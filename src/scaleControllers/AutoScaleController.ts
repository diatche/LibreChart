import { IPoint } from 'evergrid';
import DataSource from '../data/DataSource';
import ScaleController, {
    ContentLimitOptions,
    ScaleControllerOptions,
} from './ScaleController';

export interface AutoScaleOptions extends ScaleControllerOptions {
    dataSources?: DataSource[];
    defaultMin?: number;
    defaultMax?: number;
}

export default class AutoScaleController<
    T = any,
    D = any
> extends ScaleController<T, D> {
    readonly defaultMin: number | undefined;
    readonly defaultMax: number | undefined;

    private _dataSources?: DataSource[];

    constructor(options: AutoScaleOptions = {}) {
        super(options);
        let { defaultMin = options.min, defaultMax = options.max } = options;
        this.defaultMin = defaultMin;
        this.defaultMax = defaultMax;

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
                    `Autoscale anchor (${this.anchor}) is below defaultMin value (${this.defaultMin})`
                );
            }
            if (
                typeof this.defaultMax !== 'undefined' &&
                this.anchor > this.defaultMax
            ) {
                console.warn(
                    `Autoscale anchor (${this.anchor}) is above defaultMax value (${this.defaultMax})`
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
        options: ContentLimitOptions
    ): [number, number] | undefined {
        const hasAnchor = typeof this.anchor !== 'undefined';
        let anchor = this.anchor || 0;
        let min = hasAnchor ? anchor : NaN;
        let max = min;
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
            if (isNaN(min) || range[0] < min) {
                min = range[0];
            }
            if (isNaN(max) || range[1] > max) {
                max = range[1];
            }
            hasRange = true;
        }
        if (!hasRange) {
            if (
                typeof this.defaultMin !== 'undefined' &&
                typeof this.defaultMax !== 'undefined'
            ) {
                min = this.defaultMin;
                max = this.defaultMax;
            } else if (typeof this.defaultMin !== 'undefined') {
                min = this.defaultMin;
                max = this.defaultMin;
            } else if (typeof this.defaultMax !== 'undefined') {
                min = this.defaultMax;
                max = this.defaultMax;
            } else {
                return undefined;
            }
        }

        return [min, max];
    }

    private _getDataSouceLimits(
        dataSource: DataSource,
        visibleRange: [IPoint, IPoint]
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
