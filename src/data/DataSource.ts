import {
    IItemUpdateManyOptions,
    IPoint,
    isPointInRange,
    LayoutSource,
    weakref,
    zeroPoint,
} from 'evergrid';
import {
    ChartDataType,
    IDataLocation,
    IDataPoint,
    IDecimalPoint,
} from '../types';
import { PlotLayout } from '../internal';
import { Observable } from '../utils/observable';

let _idCounter = 0;

export interface DataSourceProps<
    T,
    X = any,
    Y = any,
> {
    data?: T[];
    transform: (item: T, index: number) => IDataLocation<X, Y>;
}

export interface DataSourceInput<
    T,
    X = any,
    Y = any,
> extends DataSourceProps<T, X, Y> {
    noCopy?: boolean;
}

export interface IItemsInLocationRangeOptions {
    partial?: boolean;
}

export default abstract class DataSource<
    T = any,
    X = any,
    Y = any,
> implements DataSourceProps<T, X, Y> {
    id: string;
    data: T[];
    transform: (item: T, index: number) => IDataLocation<X, Y>;
    layout?: LayoutSource;

    private _plotWeakRef = weakref<PlotLayout<X, Y>>();
    private _scaleLayoutUpdates?: {
        x: Observable.IObserver,
        y: Observable.IObserver,
    };

    constructor(input: DataSourceInput<T, X, Y>) {
        this.id = `${(++_idCounter)}`;
        if (input.noCopy && !input.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = input.noCopy ? input.data! : [...input.data!];
        this.transform = input.transform;
    }

    get plot(): PlotLayout<X, Y> {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: PlotLayout<X, Y>) {
        if (!plot || !(plot instanceof PlotLayout)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(plot: PlotLayout<X, Y>) {
        this.plot = plot;
        this.layout = this.createLayoutSource();

        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
        };
        // FIXME: Do only one update if both x and y layouts change.
        this._scaleLayoutUpdates = {
            x: plot.xLayout.updates.addObserver(
                () => this.update(updateOptions)
            ),
            y: plot.yLayout.updates.addObserver(
                () => this.update(updateOptions)
            ),
        };
    }

    unconfigure() {
        this.layout = undefined;
        
        if (this._scaleLayoutUpdates) {
            this._scaleLayoutUpdates.x.cancel();
            this._scaleLayoutUpdates.y.cancel();
            this._scaleLayoutUpdates = undefined;
        }
    }

    update(updateOptions: IItemUpdateManyOptions) {
        this.layout?.updateItems(updateOptions);
    }

    abstract get type(): ChartDataType;

    abstract get itemReuseID(): string;

    abstract createLayoutSource(): LayoutSource;

    getDataBoundingRectInRange(pointRange: [IPoint, IPoint]): [IPoint, IPoint] | undefined {
        // Get data range
        let points = this.getDataPointsInRange(
            pointRange,
            { partial: true },
        );
        if (points.length === 0) {
            return undefined;
        }
        let min = zeroPoint();
        let max = zeroPoint();

        min = { ...points[0] };
        max = { ...min };
        for (let v of points) {
            if (v.x < min.x) {
                min.x = v.x;
            }
            if (v.x > max.x) {
                max.x = v.x;
            }
            if (v.y < min.y) {
                min.y = v.y;
            }
            if (v.y > max.y) {
                max.y = v.y;
            }
        }

        return [min, max];
    }

    getDataPointsInRange(
        pointRange: [IPoint, IPoint],
        options?: IItemsInLocationRangeOptions,
    ): IDataPoint[] {
        let points: IDataPoint[] = [];
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            let p = this.getItemPoint(this.transform(this.data[i], i)) as IDataPoint;
            p.dataIndex = i;
            if (isPointInRange(p, pointRange)) {
                points.push(p);
            }
        }
        return points;
    }

    getItemsIndexesInLocationRange(pointRange: [IPoint, IPoint]): number[] {
        let indexes: number[] = [];
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            const p = this.getItemPoint(this.transform(this.data[i], i));
            if (isPointInRange(p, pointRange)) {
                indexes.push(i);
            }
        }
        return indexes;
    }

    getItemDecimalPoint(item: IDataLocation<X, Y>): IDecimalPoint {
        let plot = this.plot;
        return {
            x: plot.xLayout.scale.locationOfValue(item.x),
            y: plot.yLayout.scale.locationOfValue(item.y),
        };
    }

    getItemPoint(item: IDataLocation<X, Y>): IPoint {
        let d = this.getItemDecimalPoint(item);
        return { x: d.x.toNumber(), y: d.y.toNumber() };
    }
}
