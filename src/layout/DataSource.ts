import {
    CustomLayoutSource,
    IItemCustomLayout,
    IPoint,
    isPointInRange,
    LayoutSourceProps,
} from 'evergrid';
import { kPointReuseID } from '../const';
import { IDataPoint } from '../types';
import Scale from '../scale/Scale';

const kDefaultPointViewDiameter = 8;
const kDefaultPointViewSize = {
    x: kDefaultPointViewDiameter,
    y: kDefaultPointViewDiameter,
};
const kDefaultPointViewLayout = {
    size: kDefaultPointViewSize,
};

export interface DataSourceProps<X = any, Y = any> {
    data?: IDataPoint<X, Y>[];
    scale: {
        x: Scale<X, any>;
        y: Scale<Y, any>;
    };
}

export interface DataSourceInput<X = any, Y = any> extends DataSourceProps<X, Y> {
    noCopy?: boolean;
    layout?: LayoutSourceProps<number>;
}

export default class DataSource<X = any, Y = any> implements DataSourceProps<X, Y> {
    data: IDataPoint<X, Y>[] = [];
    scale: {
        x: Scale<X, any>;
        y: Scale<Y, any>;
    };
    layout: CustomLayoutSource;

    constructor(props: DataSourceInput<X, Y>) {
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
        this.layout = this._createLayoutSource(props.layout);
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

    private _createLayoutSource(props?: LayoutSourceProps<number>) {
        return new CustomLayoutSource({
            reuseID: kPointReuseID,
            // itemSize: { x: kDefaultPointRadius * 2, y: kDefaultPointRadius * 2 },
            itemOrigin: { x: 0.5, y: 0.5 },
            ...props,
            getItemLayout: i => this.getItemLayout(i),
            getItemViewLayout: () => kDefaultPointViewLayout,
            getVisibleIndexSet: pointRange => this.getVisibleIndexSet(pointRange),
            shouldRenderItem: () => false,
        });
    }
}
