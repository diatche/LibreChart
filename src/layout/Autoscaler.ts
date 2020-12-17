import {
    IAnimationBaseOptions,
    IPoint,
    weakref,
} from "evergrid";
import debounce from "lodash.debounce";
import { InteractionManager } from "react-native";
import DataSource from "../data/DataSource";
import { ScaleLayout } from "../internal";
import { Cancelable } from "../types";

export type AutoscalerInput<T = any, D = any> = Autoscaler<T, D> | AutoscalerOptions | boolean;

export interface AutoscalerOptions {
    paddingAbs?: number | [number, number];
    paddingRel?: number | [number, number];
    min?: number;
    max?: number;
    anchor?: number;
    dataSources?: DataSource[];
    /**
     * Animated by default.
     */
    animationOptions?: IAnimationBaseOptions;
}

export default class Autoscaler<T = any, D = any> {
    static defaultPaddingAbs = 0;
    static defaultPaddingRel = 0.2;
    static updateDebounceInterval = 300;

    readonly paddingAbs: [number, number];
    readonly paddingRel: [number, number];
    readonly min: number | undefined;
    readonly max: number | undefined;
    readonly anchor: number | undefined;

    animationOptions: IAnimationBaseOptions;

    private _dataSources?: DataSource[];
    private _min: number;
    private _max: number;
    private _scaleLayoutWeakRef = weakref<ScaleLayout<T, D>>();
    private _containerSize?: IPoint;

    constructor(options: AutoscalerOptions = {}) {
        this.paddingAbs = this._validatePadding(options.paddingAbs || Autoscaler.defaultPaddingAbs);
        this.paddingRel = this._validatePadding(options.paddingRel || Autoscaler.defaultPaddingRel);
        this.min = options.min;
        this.max = options.max;
        this.anchor = options.anchor;

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

        this.animationOptions = options.animationOptions || { animated: true };

        this._min = 0;
        this._max = 0;

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
            this._debouncedUpdate();
        }
    }

    cancelUpdate() {
        if (this._scheduledUpdate) {
            this._scheduledUpdate.cancel();
            this._scheduledUpdate = undefined;
        }
        this._debouncedUpdate.cancel();
    }
    
    private _scheduledUpdate?: Cancelable;

    private _debouncedUpdate = debounce(() => {
        if (this._scheduledUpdate) {
            return;
        }
        this._scheduledUpdate = InteractionManager.runAfterInteractions(() => (
            this.update()
        ));
    }, Autoscaler.updateDebounceInterval);

    update(options?: { animationOptions?: IAnimationBaseOptions }) {
        this.cancelUpdate();

        this._containerSize = this._maybeScaleLayout()?.plot.containerSize;
        if (!this._isContainerReady(this._containerSize)) {
            return;
        }

        let limits = this._getLimits();
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
                range: [pMin, pMax],
                ...this.animationOptions,
                ...options?.animationOptions,
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
                offset: p,
                ...this.animationOptions,
                ...options?.animationOptions,
            });
        }
    }

    private _getLimits(): [number, number] | undefined {
        const hasAnchor = typeof this.anchor !== 'undefined';
        let anchor = this.anchor || 0;
        let minLoc = hasAnchor ? anchor : NaN;
        let maxLoc = minLoc;
        let hasRange = false;
        let visibleRange = this.scaleLayout.plot.getVisibleLocationRange();
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
            min -= this.paddingRel[0] * locDiff;
            max += this.paddingRel[1] * locDiff;
        }

        // Apply absolute padding
        min -= this.paddingAbs[0];
        max += this.paddingAbs[1];

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

    private _isContainerReady(size: IPoint | undefined) {
        return size && size.x >= 1 && size.y >= 1;
    }
}
