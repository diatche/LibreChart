import {
    IAnimationBaseOptions,
    IInsets,
    IPoint,
    weakref,
} from "evergrid";
import debounce from "lodash.debounce";
import { InteractionManager } from "react-native";
import Scale, { 
    ITickScaleConstraints,
} from "../scale/Scale";
import DataSource from "../data/DataSource";
import { ScaleLayout } from "../internal";
import { Cancelable } from "../types";
import Decimal from "decimal.js";

export type AutoscalerInput<T = any, D = any> = Autoscaler<T, D> | AutoscalerOptions | boolean;

export type AutoscalerHysteresisFunction = (
    min: number,
    max: number,
    previousMin: number | undefined,
    previousMax: number | undefined,
) => [number, number] | null;

export namespace Hysteresis {

    export const none: AutoscalerHysteresisFunction = () => null;

    export const step = (
        size: number,
        options: {
            origin?: number;
        } = {},
    ): AutoscalerHysteresisFunction => {
        if (size <= 0) {
            throw new Error('Invalid step');
        }
        let { origin = 0 } = options;
        return (a, b) => [
            Math.floor((a - origin) / size) * size + origin,
            Math.ceil((b - origin) / size) * size + origin,
        ];
    };

    export function withScale<T = any, D = any>(
        scale: Scale<T, D>
    ): AutoscalerHysteresisFunction {
        let constraints: ITickScaleConstraints<D> = {
            expand: true,
        };
        return (a, b) => {
            let ad = new Decimal(a);
            let bd = new Decimal(b);
            scale.updateTickScale(
                scale.valueAtLocation(ad),
                scale.valueAtLocation(bd),
                constraints,
            );
            let span = scale.spanLocationRange(ad, bd);
            return [span[0].toNumber(), span[1].toNumber()];
        };
    };

    // export const log10 = (
    //     options: {
    //         step?: number;
    //         origin?: number;
    //     } = {},
    // ): AutoscalerHysteresisFunction => {
    //     let {
    //         step = 1,
    //         origin = 0,
    //     } = options;
    //     if (step <= 0) {
    //         throw new Error('Invalid stepCoef');
    //     }
    //     return (a, b) => {
    //         if (a === b) {
    //             // Zero range
    //             return null;
    //         }
    //         a -= origin;
    //         b -= origin;
    //         if (a > 0 && b < 0 || a < 0 && b > 0) {
    //             // Different sign
    //             return null;
    //         }
    //         let isNeg = a < 0;
    //         let sign = 1;
    //         let floor = Math.floor;
    //         let ceil = Math.ceil;
    //         if (isNeg) {
    //             sign = -1;
    //             a = -a;
    //             b = -b;
    //             floor = Math.ceil;
    //             ceil = Math.floor;
    //         }

    //         let al = Math.log10(a);
    //         if (step === 1) {
    //             al = floor(al);
    //         } else {
    //             let al0 = floor(al);
    //             al = floor((al - al0) / step) * step + al0;
    //         }
            
    //         let bl = Math.log10(b);
    //         if (step === 1 || !isFinite(bl)) {
    //             bl = ceil(bl);
    //         } else {
    //             let bl0 = floor(bl);
    //             bl = ceil((bl - bl0) / step) * step + bl0;
    //         }

    //         return [
    //             Math.pow(base, al) * sign + origin,
    //             Math.pow(base, bl) * sign + origin,
    //         ];
    //     };
    // };
}

export interface AutoscalerOptions {
    dataSources?: DataSource[];
    contentPaddingAbs?: number | [number, number];
    contentPaddingRel?: number | [number, number];
    viewPaddingAbs?: number | [number, number];
    min?: number;
    max?: number;
    anchor?: number;
    hysteresis?: AutoscalerHysteresisFunction;
    /**
     * Animated by default.
     */
    animationOptions?: IAnimationBaseOptions;
}

export default class Autoscaler<T = any, D = any> {
    static defaultContentPaddingAbs = 0;
    static defaultContentPaddingRel = 0.2;
    static defaultViewPaddingAbs = 0;
    static updateDebounceInterval = 500;

    readonly contentPaddingAbs: [number, number];
    readonly contentPaddingRel: [number, number];
    readonly viewPaddingAbs: [number, number];
    readonly min: number | undefined;
    readonly max: number | undefined;
    readonly anchor: number | undefined;

    hysteresis?: AutoscalerHysteresisFunction;
    animationOptions: IAnimationBaseOptions;

    private _dataSources?: DataSource[];
    private _min = 0;
    private _max = 0;
    private _scaleLayoutWeakRef = weakref<ScaleLayout<T, D>>();
    private _containerSize?: IPoint;

    constructor(options: AutoscalerOptions = {}) {
        this.contentPaddingAbs = this._validatePadding(
            options.contentPaddingAbs || Autoscaler.defaultContentPaddingAbs
        );
        this.contentPaddingRel = this._validatePadding(
            options.contentPaddingRel || Autoscaler.defaultContentPaddingRel
        );
        this.viewPaddingAbs = this._validatePadding(
            options.viewPaddingAbs || Autoscaler.defaultViewPaddingAbs
        );
        this.min = options.min;
        this.max = options.max;
        this.anchor = options.anchor;
        this.hysteresis = options.hysteresis;

        if (typeof this.min !== 'undefined' && typeof this.max !== 'undefined' && this.max < this.min) {
            throw new Error('Invalid autoscale range');
        }

        if (typeof this.anchor !== 'undefined') {
            if (typeof this.min !== 'undefined' && this.anchor < this.min) {
                console.warn(`Autoscale anchor (${this.anchor}) is below min value (${this.min})`);
            }
            if (typeof this.max !== 'undefined' && this.anchor > this.max) {
                console.warn(`Autoscale anchor (${this.anchor}) is above max value (${this.max})`);
            }
        }

        this.animationOptions = options.animationOptions || {
            animated: true,
            timing: {
                duration: 500,
            },
        };

        if (options?.dataSources) {
            this.dataSources = options.dataSources;
        }
    }

    static parse(input: AutoscalerInput | undefined): Autoscaler | undefined {
        switch (typeof input) {
            case 'undefined':
                return undefined;
            case 'boolean':
                return input ? new Autoscaler() : undefined;
            case 'object':
                if (input instanceof Autoscaler) {
                    return input;
                } else {
                    // Assume options
                    return new Autoscaler(input);
                }
        }
        throw new Error('Invalid autoscaler');
    }

    get scaleLayout(): ScaleLayout<T, D> {
        return this._scaleLayoutWeakRef.getOrFail();
    }

    set scaleLayout(scaleLayout: ScaleLayout<T, D>) {
        if (!scaleLayout || !(scaleLayout instanceof ScaleLayout)) {
            throw new Error('Invalid scale layout');
        }
        this._scaleLayoutWeakRef.set(scaleLayout);
    }

    private _maybeScaleLayout(): ScaleLayout<T, D> | undefined {
        return this._scaleLayoutWeakRef.get();
    }

    configure(scaleLayout: ScaleLayout<T, D>) {
        this.scaleLayout = scaleLayout;

        if (!this._dataSources) {
            this.dataSources = scaleLayout.plot.dataSources;
        }

        this.setNeedsUpdate();
    }

    unconfigure() {
        this.cancelUpdate();
    }

    get dataSources(): DataSource[] {
        return this._dataSources ? [...this._dataSources] : [];
    }

    set dataSources(dataSources: DataSource[]) {
        for (let ds of this._dataSources || []) {
            this._unsubFromDataSource(ds);
        }

        this._dataSources = [...dataSources];

        for (let ds of this._dataSources) {
            this._subToDataSource(ds);
        }
    }

    private _subToDataSource(dataSource: DataSource) {
        // TODO: implement when data source mutability is added
    }

    private _unsubFromDataSource(dataSource: DataSource) {
        // TODO: implement when data source mutability is added
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
        if (this._scheduledUpdate) {
            return;
        }

        this._scheduledUpdate = InteractionManager.runAfterInteractions(() => {
            this._debouncedUpdate();
        });
    }

    cancelUpdate() {
        this._cancelUpdateAfterInteractions();
        this._debouncedUpdate.cancel();
    }

    private _cancelUpdateAfterInteractions() {
        if (this._scheduledUpdate) {
            this._scheduledUpdate.cancel();
            this._scheduledUpdate = undefined;
        }
    }
    
    private _scheduledUpdate?: Cancelable;

    private _debouncedUpdate = debounce(
        () => {
            this._cancelUpdateAfterInteractions();
            this._scheduledUpdate = InteractionManager.runAfterInteractions(() => {
                this.update();
            });
        },
        Autoscaler.updateDebounceInterval,
    );

    update(options?: { animationOptions?: IAnimationBaseOptions }) {
        this.cancelUpdate();

        let plot = this._maybeScaleLayout()?.plot;
        if (!plot) {
            return;
        }
        let insets = plot.getAxisInsets();
        this._containerSize = plot.getContainerSize({ insets });
        if (!this._isContainerReady(this._containerSize)) {
            return;
        }

        let limits = this._getLimits(this._containerSize, insets);
        if (!limits) {
            return;
        }
        let [min, max] = limits;
        if (min === this._min && max === this._max) {
            return;
        }
        // console.debug(`Autoscaling min: ${min}, max: ${max}`);
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
            });
        } else if (typeof this.anchor !== 'undefined') {
            // Scroll to location.

            // Why do we not scroll when there is an achor?
            // Because if we have one point, which must be
            // the same as the anchor. Scrolling to the anchor
            // may place it at the center of the viewport
            // (if the anchor of the plot is at 0.5).

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

    private _getLimits(
        containerSize: IPoint,
        insets: Partial<IInsets<number>>,
    ): [number, number] | undefined {
        const hasAnchor = typeof this.anchor !== 'undefined';
        let anchor = this.anchor || 0;
        let minLoc = hasAnchor ? anchor : NaN;
        let maxLoc = minLoc;
        let hasRange = false;
        let plot = this.scaleLayout.plot;
        let visibleRange = plot.getVisibleLocationRange({ insets });
        // Extend visible range in cross axis
        if (this.scaleLayout.isHorizontal) {
            visibleRange[0].x = -Infinity;
            visibleRange[1].x = Infinity;
        } else {
            visibleRange[0].y = -Infinity;
            visibleRange[1].y = Infinity;
        }
        for (let ds of this._dataSources || []) {
            let range = this._getDataSouceLimits(ds, visibleRange);
            if (!range) {
                continue;
            }
            if (isNaN(minLoc) || range[0] < minLoc) {
                minLoc = range[0];
            }
            if (isNaN(maxLoc) || range[1] > maxLoc) {
                maxLoc = range[1];
            }
            hasRange = true;
        }
        if (!hasRange) {
            return undefined;
        }

        let min = minLoc;
        let max = maxLoc;
        let locDiff = maxLoc - minLoc;

        if (locDiff > 0) {
            // Apply relative padding
            min -= this.contentPaddingRel[0] * locDiff;
            max += this.contentPaddingRel[1] * locDiff;
        }

        // Apply absolute padding
        min -= this.contentPaddingAbs[0];
        max += this.contentPaddingAbs[1];

        // Apply limits
        if (typeof this.min !== 'undefined' && min < this.min) {
            min = this.min;
        }
        if (typeof this.max !== 'undefined' && max < this.max) {
            max = this.max;
        }

        if (hasAnchor) {
            // Do not pad over anchor
            if (minLoc >= anchor && min < anchor) {
                min = anchor;
            }
            if (maxLoc < anchor && max > anchor) {
                max = anchor;
            }
        }

        if (this.hysteresis) {
            try {
                let res = this.hysteresis(min, max, this.min, this.max);
                if (res) {
                    if (
                        typeof res[0] !== 'number' || typeof res[1] !== 'number' ||
                        isNaN(res[0]) || isNaN(res[1]) ||
                        !isFinite(res[0]) || !isFinite(res[1])
                    ) {
                        console.warn(`Ignoring invalid hysteresis output: [${res[0]}, ${res[1]}]`);
                    } else {
                        min = res[0];
                        max = res[1];
                    }
                }
            } catch (error) {
                console.error(`Uncaught error in hysteresis function: ${error?.message || error}`);
            }
        }

        if (this.viewPaddingAbs[0] || this.viewPaddingAbs[1]) {
            // Convert view padding to target scale
            let contentLen = max - min;
            if (contentLen > 0) {
                let viewLen = containerSize[this.scaleLayout.isHorizontal ? 'x' : 'y'];
                viewLen -= this.viewPaddingAbs[0];
                viewLen -= this.viewPaddingAbs[1];
                let scale = viewLen / contentLen;
                min -= this.viewPaddingAbs[0] / scale;
                max += this.viewPaddingAbs[1] / scale;
            }
        }

        return [min, max];
    }

    private _getDataSouceLimits(
        dataSource: DataSource,
        visibleRange: [IPoint, IPoint],
    ): [number, number] | undefined {
        // Get data range
        let rect = dataSource.getDataBoundingRectInRange(visibleRange);
        if (!rect) {
            return undefined;
        }
        let axis: keyof IPoint = this.scaleLayout.isHorizontal ? 'x' : 'y';
        return [rect[0][axis], rect[1][axis]];
    }

    private _validatePadding(
        padding: number | [number, number] | undefined,
    ): [number, number] {
        switch (typeof padding) {
            case 'undefined':
                return [0, 0];
            case 'number':
                return [padding, padding];
            case 'object':
                if (typeof padding[0] === 'number' && typeof padding[1] === 'number') {
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
