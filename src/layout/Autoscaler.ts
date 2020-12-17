import { IAnimationBaseOptions, IPoint, weakref } from "evergrid";
import DataSource from "../data/DataSource";
import { ScaleLayout } from "../internal";

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

    constructor(options: AutoscalerOptions = {}) {
        this.paddingAbs = this._validatePadding(options.paddingAbs || Autoscaler.defaultPaddingAbs);
        this.paddingRel = this._validatePadding(options.paddingRel || Autoscaler.defaultPaddingRel);
        this.min = options.min;
        this.max = options.max;
        this.anchor = options.anchor;
        this.animationOptions = options.animationOptions || { animated: true };

        this._min = 0;
        this._max = 0;

        if (options?.dataSources) {
            this.dataSources = options.dataSources;
        }
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

    configure(scaleLayout: ScaleLayout<T, D>) {
        this.scaleLayout = scaleLayout;

        if (!this._dataSources) {
            this.dataSources = scaleLayout.plot.dataSources;
        }
    }

    unconfigure() {}

    didEndInteraction() {
        this._updateIfNeeded();
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

    private _updateIfNeeded() {
        let limits = this._getLimits();
        if (!limits) {
            return;
        }
        let [min, max] = limits;
        if (min === this._min && max === this._max) {
            return;
        }
        console.debug(`Autoscaling min: ${min}, max: ${max}`);
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
                offset: p,
                ...this.animationOptions,
            });
        }
    }

    private _getLimits(): [number, number] | undefined {
        const hasAnchor = typeof this.anchor !== 'undefined';
        let anchor = this.anchor || 0;
        let minLoc = this.anchor || 0;
        let maxLoc = this.anchor || 0;
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
            if (!hasRange || range[0] < minLoc) {
                minLoc = range[0];
            }
            if (!hasRange || range[1] > maxLoc) {
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
            if (maxLoc <= anchor && max > anchor) {
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
        let dataPoints = dataSource.getItemsInLocationRange(visibleRange);
        if (dataPoints.length === 0) {
            return undefined;
        }
        let axis: keyof IPoint = this.scaleLayout.isHorizontal ? 'x' : 'y';
        // TODO: keep Decimal precision?
        let values = dataPoints.map(p => this.scaleLayout.scale.locationOfValue(p[axis]).toNumber());
        let min = 0;
        let max = 0;

        min = values[0];
        max = min;
        for (let v of values) {
            if (v < min) {
                min = v;
            }
            if (v > max) {
                max = v;
            }
        }

        // console.debug('data points: ' + JSON.stringify(dataPoints));
        console.debug('values: ' + JSON.stringify(values));
        return [min, max];
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
}
