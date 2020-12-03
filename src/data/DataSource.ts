import {
    IItemCustomLayout,
    IPoint,
    isPointInRange,
    LayoutSource,
    LayoutSourceProps,
} from 'evergrid';
import { IDataPoint } from '../types';
import Scale from '../scale/Scale';

export interface DataSourceProps<
    X = any,
    Y = any,
> {
    data?: IDataPoint<X, Y>[];
    scale: {
        x: Scale<X, any>;
        y: Scale<Y, any>;
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
    data: IDataPoint<X, Y>[] = [];
    scale: {
        x: Scale<X, any>;
        y: Scale<Y, any>;
    };
    layout: Layout;

    constructor(props: DataSourceInput<X, Y, Index, LayoutProps>) {
        if (props.noCopy && !props.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = props.noCopy ? props.data! : [...props.data];
        this.scale = { ...props.scale };
        if (!(this.scale.x instanceof Scale)) {
            throw new Error('Invalid data source x-axis scale.');
        }
        if (!(this.scale.y instanceof Scale)) {
            throw new Error('Invalid data source y-axis scale.');
        }
        this.layout = this.createLayoutSource(props.layout);
    }

    getVisibleIndexSet(pointRange: [IPoint, IPoint]): Set<number> {
        let indexSet = new Set<number>();
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            const p = this.getItemLocation(this.data[i]);
            if (isPointInRange(p, pointRange)) {
                indexSet.add(i);
            }
        }
        return indexSet;
    }

    getItemLayout(index: number): IItemCustomLayout {
        return {
            offset: this.getItemLocation(this.data[index]),
        };
    }

    getItemLocation(point: IDataPoint<X, Y>): IPoint {
        return {
            x: this.scale.x.locationOfValue(point.x).toNumber(),
            y: this.scale.y.locationOfValue(point.y).toNumber(),
        };
    }

    abstract createLayoutSource(props?: LayoutProps): Layout;
}
