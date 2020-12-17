import {
    IItem,
    IItemCustomLayout,
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
    IDataPoint,
    IDecimalPoint,
} from '../types';
import { PlotLayout } from '../internal';

let _idCounter = 0;

export interface DataSourceProps<
    X = any,
    Y = any,
> {
    data?: IDataItem<X, Y>[];
}

export interface DataSourceInput<
    X = any,
    Y = any,
    Index = any,
    LayoutProps extends LayoutSourceProps<Index> = LayoutSourceProps<Index>
> extends DataSourceProps<X, Y> {
    noCopy?: boolean;
    layout?: LayoutProps;
}

export interface IItemsInLocationRangeOptions {
    partial?: boolean;
}

export default abstract class DataSource<
    X = any,
    Y = any,
    Index = any,
    LayoutProps extends LayoutSourceProps<Index> = LayoutSourceProps<Index>,
    Layout extends LayoutSource<Index, LayoutProps> = LayoutSource<Index, LayoutProps>,
> implements DataSourceProps<X, Y> {
    id: string;
    data: IDataItem<X, Y>[];
    layout?: Layout;
    layoutProps?: LayoutProps;

    private _plotWeakRef = weakref<PlotLayout<X, Y>>();
    private _xScaleLayoutUpdates = 0;
    private _yScaleLayoutUpdates = 0;

    constructor(props: DataSourceInput<X, Y, Index, LayoutProps>) {
        this.id = `${(++_idCounter)}`;
        if (props.noCopy && !props.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = props.noCopy ? props.data! : [...props.data!];
        this.layoutProps = props.layout;
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
        this.layout = this.createLayoutSource(this.layoutProps);

        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
        };
        // FIXME: Do only one update if both x and y layouts change.
        this._xScaleLayoutUpdates = plot.xLayout.updates.addObserver(
            () => this.update(updateOptions)
        ) || 0;
        this._yScaleLayoutUpdates = plot.yLayout.updates.addObserver(
            () => this.update(updateOptions)
        ) || 0;
    }

    unconfigure() {
        this.layout = undefined;
        
        this.plot.xLayout.updates.removeObserver(this._xScaleLayoutUpdates);
        this.plot.yLayout.updates.removeObserver(this._yScaleLayoutUpdates);
        this._xScaleLayoutUpdates = 0;
        this._yScaleLayoutUpdates = 0;
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
            let p = this.getItemLocation(this.data[i]) as IDataPoint;
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
            const p = this.getItemLocation(this.data[i]);
            if (isPointInRange(p, pointRange)) {
                indexes.push(i);
            }
        }
        return indexes;
    }

    getItemLayout(index: number): IItemCustomLayout {
        return {
            offset: this.getItemLocation(this.data[index]),
        };
    }

    getItemDecimalLocation(point: IDataItem<X, Y>): IDecimalPoint {
        let plot = this.plot;
        return {
            x: plot.xLayout.scale.locationOfValue(point.x),
            y: plot.yLayout.scale.locationOfValue(point.y),
        };
    }

    getItemLocation(point: IDataItem<X, Y>): IPoint {
        let d = this.getItemDecimalLocation(point);
        return { x: d.x.toNumber(), y: d.y.toNumber() };
    }
}
