import {
    IItem,
    IItemCustomLayout,
    IPoint,
    isPointInRange,
    LayoutSource,
    LayoutSourceProps,
} from 'evergrid';
import { ChartDataType, IDataPoint, IDecimalPoint } from '../types';
import Axis from '../layout/axis/Axis';

let _idCounter = 0;

export interface DataSourceProps<
    X = any,
    Y = any,
> {
    data?: IDataPoint<X, Y>[];
    axes: {
        x: Axis<X, any>;
        y: Axis<Y, any>;
    };
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

export default abstract class DataSource<
    X = any,
    Y = any,
    Index = any,
    LayoutProps extends LayoutSourceProps<Index> = LayoutSourceProps<Index>,
    Layout extends LayoutSource<Index, LayoutProps> = LayoutSource<Index, LayoutProps>,
> implements DataSourceProps<X, Y> {
    id: string;
    data: IDataPoint<X, Y>[] = [];
    axes: {
        x: Axis<X, any>;
        y: Axis<Y, any>;
    };
    layout: Layout;

    constructor(props: DataSourceInput<X, Y, Index, LayoutProps>) {
        this.id = `${(++_idCounter)}`;
        if (props.noCopy && !props.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = props.noCopy ? props.data! : [...props.data];
        this.axes = { ...props.axes };
        if (!(this.axes.x instanceof Axis)) {
            throw new Error('Invalid data source x-axis.');
        }
        if (!(this.axes.y instanceof Axis)) {
            throw new Error('Invalid data source y-axis.');
        }
        this.layout = this.createLayoutSource(props.layout);
    }

    abstract get type(): ChartDataType;

    abstract get itemReuseID(): string;

    abstract createLayoutSource(props?: LayoutProps): Layout;

    ownsItem(item: IItem<any>): item is IItem<Index> {
        // TODO: need to use different reuse ids for each data source
        return item.reuseID === this.itemReuseID;
    }

    getItemsInLocationRange(pointRange: [IPoint, IPoint]): IDataPoint<X, Y>[] {
        let items: IDataPoint<X, Y>[] = [];
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            const p = this.getItemLocation(this.data[i]);
            if (isPointInRange(p, pointRange)) {
                items.push(this.data[i]);
            }
        }
        return items;
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

    getItemDecimalLocation(point: IDataPoint<X, Y>): IDecimalPoint {
        return {
            x: this.axes.x.scale.locationOfValue(point.x),
            y: this.axes.y.scale.locationOfValue(point.y),
        };
    }

    getItemLocation(point: IDataPoint<X, Y>): IPoint {
        let d = this.getItemDecimalLocation(point);
        return { x: d.x.toNumber(), y: d.y.toNumber() };
    }
}
