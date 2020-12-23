import {
    CustomLayoutSource,
    CustomLayoutSourceProps,
    IItemCustomLayout,
    IPoint,
    LayoutSourceProps,
} from 'evergrid';
import DataSource, {
    DataSourceInput,
} from './DataSource';
import {
    ChartDataType,
    IDataItem,
    IRectStyle,
} from '../types';
import { VectorUtil } from '../utils/vectorUtil';

export interface IRectDataItem<X, Y> extends IDataItem<X, Y, IRectStyle> {
    x: X,
    y: Y,
    x2: X,
    y2: Y,
    style?: IRectStyle;
}

export interface RectDataSourceInput<T, X = any, Y = any> {
    transform: (item: T) => IRectDataItem<X, Y>;
    style?: IRectStyle;
}

export default class RectDataSource<
    T = any,
    X = any,
    Y = any,
> extends DataSource<
    T,
    number,
    CustomLayoutSourceProps,
    CustomLayoutSource,
    X,
    Y,
    any,
    any,
    IRectStyle,
    IRectDataItem<X, Y>
> {
    style: IRectStyle;

    constructor(
        input: RectDataSourceInput<T, X, Y> & DataSourceInput<T, number, CustomLayoutSourceProps, X, Y, IRectStyle, IRectDataItem<X, Y>>
    ) {
        super(input);
        this.style = { ...input.style };
    }

    get type(): ChartDataType {
        return 'rect';
    }

    get itemReuseID(): string {
        return this.id + '_rect';
    }

    getItemLayout(index: number): IItemCustomLayout {
        let range = this.transform(this.data[index]);
        let start = this.getItemPoint(range);
        let end = this.getItemPoint({ x: range.x2, y: range.y2 });
        return {
            offset: start,
            size: {
                x: end.x - start.x,
                y: end.y - start.y,
            },
        };
    }

    getItemsIndexesInLocationRange(pointRange: [IPoint, IPoint]): number[] {
        let indexes: number[] = [];
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            let layout = this.getItemLayout(i);
            if (VectorUtil.rectsIntersect(
                layout.offset.x,
                layout.offset.y,
                layout.size?.x || 0,
                layout.size?.y || 0,
                pointRange[0].x,
                pointRange[0].y,
                pointRange[1].x - pointRange[0].x,
                pointRange[1].y - pointRange[0].y,
            )) {
                indexes.push(i);
            }
        }
        return indexes;
    }

    createLayoutSource(props?: LayoutSourceProps<number>) {
        return new CustomLayoutSource({
            ...this.plot.getLayoutSourceOptions(),
            itemSize: { x: 1, y: 1 },
            reuseID: this.itemReuseID,
            ...props,
            getItemLayout: i => this.getItemLayout(i),
            getVisibleIndexSet: pointRange => new Set(this.getItemsIndexesInLocationRange(pointRange)),
            shouldRenderItem: () => false,
        });
    }
}
