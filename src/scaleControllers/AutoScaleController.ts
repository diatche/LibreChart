import { IPoint } from 'evergrid';
import DataSource from '../data/DataSource';
import ScaleController, {
    ContentLimitOptions,
    ScaleControllerOptions,
} from './ScaleController';
import { Hysteresis } from './Hysteresis';

export interface AutoScaleOptions extends ScaleControllerOptions {
    dataSources?: DataSource[];
    contentPaddingAbs?: number | [number, number];
    contentPaddingRel?: number | [number, number];
    min?: number;
    max?: number;
    defaultMin?: number;
    defaultMax?: number;
    anchor?: number;
    hysteresis?: Hysteresis.StepFunc;
}

export default class AutoScaleController<
    T = any,
    D = any
> extends ScaleController<T, D> {
    static defaultContentPaddingAbs = 0;
    static defaultContentPaddingRel = 0.2;

    readonly contentPaddingAbs: [number, number];
    readonly contentPaddingRel: [number, number];
    readonly min: number | undefined;
    readonly max: number | undefined;
    readonly defaultMin: number | undefined;
    readonly defaultMax: number | undefined;
    readonly anchor: number | undefined;

    hysteresis?: Hysteresis.StepFunc;

    private _dataSources?: DataSource[];

    constructor(options: AutoScaleOptions = {}) {
        super(options);

        this.contentPaddingAbs = this.validatedPadding(
            options.contentPaddingAbs ||
                AutoScaleController.defaultContentPaddingAbs,
        );
        this.contentPaddingRel = this.validatedPadding(
            options.contentPaddingRel ||
                AutoScaleController.defaultContentPaddingRel,
        );
        this.min = options.min;
        this.max = options.max;
        let { defaultMin = options.min, defaultMax = options.max } = options;
        this.defaultMin = defaultMin;
        this.defaultMax = defaultMax;
        this.anchor = options.anchor;
        this.hysteresis = options.hysteresis;

        if (
            typeof this.min !== 'undefined' &&
            typeof this.max !== 'undefined' &&
            this.max < this.min
        ) {
            throw new Error('Invalid autoscale range');
        }

        if (typeof this.anchor !== 'undefined') {
            if (typeof this.min !== 'undefined' && this.anchor < this.min) {
                console.warn(
                    `Autoscale anchor (${this.anchor}) is below min value (${this.min})`,
                );
            }
            if (typeof this.max !== 'undefined' && this.anchor > this.max) {
                console.warn(
                    `Autoscale anchor (${this.anchor}) is above max value (${this.max})`,
                );
            }
        }

        if (
            typeof this.defaultMin !== 'undefined' &&
            typeof this.defaultMax !== 'undefined' &&
            this.defaultMax < this.defaultMin
        ) {
            throw new Error('Invalid autoscale default range');
        }

        if (typeof this.anchor !== 'undefined') {
            if (
                typeof this.defaultMin !== 'undefined' &&
                this.anchor < this.defaultMin
            ) {
                console.warn(
                    `Autoscale anchor (${this.anchor}) is below defaultMin value (${this.defaultMin})`,
                );
            }
            if (
                typeof this.defaultMax !== 'undefined' &&
                this.anchor > this.defaultMax
            ) {
                console.warn(
                    `Autoscale anchor (${this.anchor}) is above defaultMax value (${this.defaultMax})`,
                );
            }
        }

        if (options?.dataSources) {
            this.dataSources = options.dataSources;
        }
    }

    configureScaleController() {
        if (!this._dataSources) {
            this.dataSources = this.scaleLayout.plot.dataSources;
        }
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

    getContentLimits(
        options: ContentLimitOptions,
    ): [number, number] | undefined {
        const hasAnchor = typeof this.anchor !== 'undefined';
        let anchor = this.anchor || 0;
        let minLoc = hasAnchor ? anchor : NaN;
        let maxLoc = minLoc;
        let hasRange = false;
        let scaleLayout = this.scaleLayout;
        let plot = scaleLayout.plot;
        let visibleRange = plot.getVisibleLocationRange(options);
        // Extend visible range in cross axis
        if (scaleLayout.isHorizontal) {
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
            if (
                typeof this.defaultMin !== 'undefined' &&
                typeof this.defaultMax !== 'undefined'
            ) {
                minLoc = this.defaultMin;
                maxLoc = this.defaultMax;
            } else if (typeof this.defaultMin !== 'undefined') {
                minLoc = this.defaultMin;
                maxLoc = this.defaultMin;
            } else if (typeof this.defaultMax !== 'undefined') {
                minLoc = this.defaultMax;
                maxLoc = this.defaultMax;
            } else {
                return undefined;
            }
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
}
