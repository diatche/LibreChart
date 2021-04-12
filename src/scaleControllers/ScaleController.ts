import { IAnimationBaseOptions, IInsets, IPoint, weakref } from 'evergrid';
import debounce from 'lodash.debounce';
import { InteractionManager } from 'react-native';
import { ScaleLayout } from '../internal';
import { Cancelable } from '../types';
import { Hysteresis } from './Hysteresis';

export interface ContentLimitOptions {
    containerSize: IPoint;
    insets: Partial<IInsets<number>>;
}

export interface ScaleControllerOptions {
    contentPaddingAbs?: number | [number, number];
    contentPaddingRel?: number | [number, number];
    viewPaddingAbs?: number | [number, number];
    viewPaddingRel?: number | [number, number];
    min?: number;
    max?: number;
    anchor?: number;
    hysteresis?: Hysteresis.StepFunc;

    /**
     * Animated by default.
     */
    animationOptions?: IAnimationBaseOptions;
}

export default abstract class ScaleController<T = any, D = any> {
    static updateDebounceInterval = 500;
    animationOptions?: IAnimationBaseOptions;

    readonly contentPaddingAbs: [number, number];
    readonly contentPaddingRel: [number, number];
    readonly viewPaddingAbs: [number, number];
    readonly viewPaddingRel: [number, number];
    readonly min: number | undefined;
    readonly max: number | undefined;
    readonly anchor: number | undefined;

    hysteresis?: Hysteresis.StepFunc;

    private _min = 0;
    private _max = 0;
    private _scaleLayoutWeakRef = weakref<ScaleLayout<T, D>>();
    private _containerSize?: IPoint;

    constructor(options: ScaleControllerOptions) {
        this.contentPaddingAbs = this.validatedPadding(
            options.contentPaddingAbs || 0,
        );
        this.contentPaddingRel = this.validatedPadding(
            options.contentPaddingRel || 0,
        );
        this.viewPaddingAbs = this.validatedPadding(
            options.viewPaddingAbs || 0,
        );
        this.viewPaddingRel = this.validatedPadding(
            options.viewPaddingRel || 0,
        );
        this.min = options.min;
        this.max = options.max;
        this.anchor = options.anchor;
        this.hysteresis = options.hysteresis;

        if (
            typeof this.min !== 'undefined' &&
            typeof this.max !== 'undefined' &&
            this.max < this.min
        ) {
            throw new Error('Invalid min/max range');
        }

        if (typeof this.anchor !== 'undefined') {
            if (typeof this.min !== 'undefined' && this.anchor < this.min) {
                console.warn(
                    `Scale anchor (${this.anchor}) is below min value (${this.min})`,
                );
            }
            if (typeof this.max !== 'undefined' && this.anchor > this.max) {
                console.warn(
                    `Scale anchor (${this.anchor}) is above max value (${this.max})`,
                );
            }
        }

        this.animationOptions = options.animationOptions || {
            animated: true,
            timing: {
                duration: 500,
            },
        };
    }

    abstract getContentLimits(
        options: ContentLimitOptions,
    ): [number, number] | undefined;

    get scaleLayout(): ScaleLayout<T, D> {
        return this._scaleLayoutWeakRef.getOrFail();
    }

    set scaleLayout(scaleLayout: ScaleLayout<T, D>) {
        if (!scaleLayout || !(scaleLayout instanceof ScaleLayout)) {
            throw new Error('Invalid scale layout');
        }
        this._scaleLayoutWeakRef.set(scaleLayout);
    }

    private get _maybeScaleLayout(): ScaleLayout<T, D> | undefined {
        return this._scaleLayoutWeakRef.get();
    }

    configure(scaleLayout: ScaleLayout<T, D>) {
        this.scaleLayout = scaleLayout;
        this.configureScaleController();
        this.setNeedsUpdate();
    }

    configureScaleController() {}

    unconfigure() {
        this.cancelUpdate();
    }

    setNeedsUpdate() {
        if (!this._wasContainerReady()) {
            // Update immediately
            this.update({
                animationOptions: {
                    animated: false,
                },
            });
        } else {
            // Avoid frequent updates
            this.scheduleUpdate();
        }
    }

    scheduleUpdate() {
        this._debouncedUpdate();
    }

    cancelUpdate() {
        if (this._interaction) {
            this._interaction.cancel();
            this._interaction = undefined;
        }
        this._debouncedUpdate.cancel();
    }

    private _interaction?: Cancelable;

    private _debouncedUpdate = debounce(() => {
        let plot = this._maybeScaleLayout?.plot;
        if (!plot) {
            return;
        }
        if (plot.isInteracting) {
            // Skip update during interaction
            this._interaction = InteractionManager.runAfterInteractions(() => {
                this._interaction = undefined;
                this.scheduleUpdate();
            });
        } else {
            this.update();
        }
    }, ScaleController.updateDebounceInterval);

    update(options?: { animationOptions?: IAnimationBaseOptions }) {
        this.cancelUpdate();

        let scaleLayout = this._maybeScaleLayout;
        if (!scaleLayout) {
            return;
        }
        let plot = scaleLayout.plot;
        if (!plot) {
            return;
        }
        let insets = plot.getAxisInsets();
        let containerSize = plot.getContainerSize({ insets });
        if (!this._isContainerReady(containerSize)) {
            return;
        }
        let containerChanged = !this._containerSize;
        if (this._containerSize) {
            if (scaleLayout.isHorizontal) {
                containerChanged =
                    Math.abs(this._containerSize.x - containerSize.x) >= 1;
            } else {
                containerChanged =
                    Math.abs(this._containerSize.y - containerSize.y) >= 1;
            }
        }

        let contentLimitOptions: ContentLimitOptions = {
            containerSize,
            insets,
        };
        let limits = this.getContentLimits(contentLimitOptions);
        this._containerSize = containerSize;
        if (!limits) {
            return;
        }
        if (!(limits[1] >= limits[0])) {
            console.error('Invalid scale controller content limits. Ignoring.');
            return;
        }
        limits = this.limitContent(limits[0], limits[1]);
        limits = this.addContentPadding(limits[0], limits[1]);
        limits = this.addViewPadding(limits[0], limits[1], contentLimitOptions);
        let [min, max] = this.applyHysteresis(limits[0], limits[1]);
        if (!containerChanged && min === this._min && max === this._max) {
            return;
        }
        console.debug(
            `scaling to min: ${min} (from ${this._min}) max: ${max} (from ${
                this._max
            }) options: ${JSON.stringify(options, null, 2)}`,
        );
        this._min = min;
        this._max = max;

        let baseOptions: IAnimationBaseOptions = {
            ...this.animationOptions,
            ...options?.animationOptions,
            onEnd: info => {
                if (!info.finished) {
                    // Reschedule update
                    this._min = 0;
                    this._max = 0;
                    this.setNeedsUpdate();
                }
                options?.animationOptions?.onEnd?.(info);
            },
        };

        if (max > min) {
            // Scroll and scale to range
            let pMin: Partial<IPoint> = {};
            let pMax: Partial<IPoint> = {};
            if (this.scaleLayout.isHorizontal) {
                pMin.x = min;
                pMax.x = max;
            } else {
                pMin.y = min;
                pMax.y = max;
            }
            this.scaleLayout.plot.scrollTo({
                ...baseOptions,
                range: [pMin, pMax],
                insets,
            });
        } else {
            // Scroll to location
            let p: Partial<IPoint> = {};
            if (this.scaleLayout.isHorizontal) {
                p.x = -min;
            } else {
                p.y = -min;
            }
            this.scaleLayout.plot.scrollTo({
                ...baseOptions,
                offset: p,
            });
        }
    }

    limitContent(min: number, max: number): [number, number] {
        // Apply limits
        if (typeof this.min !== 'undefined' && min < this.min) {
            min = this.min;
        }
        if (typeof this.max !== 'undefined' && max > this.max) {
            max = this.max;
        }
        return [min, max];
    }

    addContentPadding(
        contentMin: number,
        contentMax: number,
    ): [number, number] {
        const hasAnchor = typeof this.anchor !== 'undefined';
        let anchor = this.anchor || 0;
        let min = contentMin;
        let max = contentMax;
        let contentLen = contentMax - contentMin;

        if (contentLen > 0) {
            // Apply relative padding
            min -= this.contentPaddingRel[0] * contentLen;
            max += this.contentPaddingRel[1] * contentLen;
        }

        // Apply absolute padding
        min -= this.contentPaddingAbs[0];
        max += this.contentPaddingAbs[1];

        if (hasAnchor && contentLen > 0) {
            // Do not pad over anchor
            if (contentMin >= anchor && min < anchor) {
                min = anchor;
            }
            if (contentMax <= anchor && max > anchor) {
                max = anchor;
            }
        }

        return [min, max];
    }

    addViewPadding(
        contentMin: number,
        contentMax: number,
        options: ContentLimitOptions,
    ): [number, number] {
        if (this.viewPaddingRel[0] || this.viewPaddingRel[1]) {
            let diff = contentMax - contentMin;
            if (diff > 0) {
                // Apply relative padding
                contentMin -= this.viewPaddingRel[0] * diff;
                contentMax += this.viewPaddingRel[1] * diff;
            }
        }

        if (this.viewPaddingAbs[0] || this.viewPaddingAbs[1]) {
            // Convert view padding to target scale
            let contentLen = contentMax - contentMin;
            if (contentLen > 0) {
                let viewLen = 0;
                if (this.scaleLayout.isHorizontal) {
                    viewLen =
                        options.containerSize.x -
                        (options.insets.left || 0) -
                        (options.insets.right || 0);
                } else {
                    viewLen =
                        options.containerSize.y -
                        (options.insets.top || 0) -
                        (options.insets.bottom || 0);
                }
                viewLen -= this.viewPaddingAbs[0];
                viewLen -= this.viewPaddingAbs[1];
                let scale = viewLen / contentLen;
                contentMin -= this.viewPaddingAbs[0] / scale;
                contentMax += this.viewPaddingAbs[1] / scale;
            }
        }
        return [contentMin, contentMax];
    }

    applyHysteresis(min: number, max: number): [number, number] {
        if (!this.hysteresis) {
            return [min, max];
        }
        try {
            let res = this.hysteresis(min, max, this.min, this.max);
            if (res) {
                if (
                    typeof res[0] !== 'number' ||
                    typeof res[1] !== 'number' ||
                    isNaN(res[0]) ||
                    isNaN(res[1]) ||
                    !isFinite(res[0]) ||
                    !isFinite(res[1])
                ) {
                    console.warn(
                        `Ignoring invalid hysteresis output: [${res[0]}, ${res[1]}]`,
                    );
                } else {
                    min = res[0];
                    max = res[1];
                }
            }
        } catch (error) {
            console.error(
                `Uncaught error in hysteresis function: ${
                    error?.message || error
                }`,
            );
        }
        return [min, max];
    }

    validatedPadding(
        padding: number | [number, number] | undefined,
    ): [number, number] {
        switch (typeof padding) {
            case 'undefined':
                return [0, 0];
            case 'number':
                return [padding, padding];
            case 'object':
                if (
                    typeof padding[0] === 'number' &&
                    typeof padding[1] === 'number'
                ) {
                    return [padding[0], padding[1]];
                }
                break;
        }
        throw new Error('Invalid padding');
    }

    private _wasContainerReady() {
        return this._isContainerReady(this._containerSize);
    }

    private _isContainerReady(size: IPoint | undefined): size is IPoint {
        return !!size ? size.x >= 1 && size.y >= 1 : false;
    }
}
