import {
    IItem,
    IItemUpdateManyOptions,
    IPoint,
    isPointInRange,
    LayoutSource,
    LayoutSourceProps,
    weakref,
    zeroPoint,
} from 'evergrid';
import {
    ChartDataType,
    IDataItem,
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
    S = any,
    Item extends IDataItem<X, Y, S> = IDataItem<X, Y, S>,
> {
    data?: T[];
    transform: (item: T) => Item;
}

export interface DataSourceInput<
    T,
    Index = any,
    LayoutProps extends LayoutSourceProps<Index> = LayoutSourceProps<Index>,
    X = any,
    Y = any,
    S = any,
    Item extends IDataItem<X, Y, S> = IDataItem<X, Y, S>,
> extends DataSourceProps<T, X, Y, S, Item> {
    noCopy?: boolean;
    layout?: LayoutProps;
}

export interface IItemsInLocationRangeOptions {
    partial?: boolean;
}

export default abstract class DataSource<
    T = any,
    Index = any,
    LayoutProps extends LayoutSourceProps<Index> = LayoutSourceProps<Index>,
    Layout extends LayoutSource<Index, LayoutProps> = LayoutSource<Index, LayoutProps>,
    X = any,
    Y = any,
    DX = any,
    DY = any,
    S = any,
    Item extends IDataItem<X, Y, S> = IDataItem<X, Y, S>,
> implements DataSourceProps<T, X, Y, S, Item> {
    id: string;
    data: T[];
    transform: (item: T) => Item;
    layout?: Layout;
    layoutProps?: LayoutProps;

    private _plotWeakRef = weakref<PlotLayout<X, Y, DX, DY>>();
    private _scaleLayoutUpdates?: {
        x: Observable.IObserver,
        y: Observable.IObserver,
    };

    constructor(props: DataSourceInput<T, Index, LayoutProps, X, Y, S, Item>) {
        this.id = `${(++_idCounter)}`;
        if (props.noCopy && !props.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = props.noCopy ? props.data! : [...props.data!];
        this.transform = props.transform;
        this.layoutProps = props.layout;
    }

    get plot(): PlotLayout<X, Y, DX, DY> {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: PlotLayout<X, Y, DX, DY>) {
        if (!plot || !(plot instanceof PlotLayout)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(plot: PlotLayout<X, Y, DX, DY>) {
        this.plot = plot;
        this.layout = this.createLayoutSource(this.layoutProps);

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

    abstract createLayoutSource(props?: LayoutProps): Layout;

    ownsItem(item: IItem<any>): item is IItem<Index> {
        // TODO: need to use different reuse ids for each data source
        return item.reuseID === this.itemReuseID;
    }

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
            let p = this.getItemPoint(this.transform(this.data[i])) as IDataPoint;
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
            const p = this.getItemPoint(this.transform(this.data[i]));
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
