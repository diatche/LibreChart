import {
    CustomLayoutSource,
    IItemCustomLayout,
    IPoint,
    LayoutSourceProps,
} from 'evergrid';
import DataSource, {
    DataSourceInput,
} from './DataSource';
import {
    ChartDataType,
    IDataLocation,
    IRectStyle,
} from '../types';
import { VectorUtil } from '../utils/vectorUtil';

export interface IDataRect<X, Y> extends IDataLocation<X, Y> {
    x2: X;
    y2: Y;
}

export interface RectDataSourceInput<T, X = any, Y = any> extends DataSourceInput<T, X, Y> {
    transform: (item: T, index: number) => IDataRect<X, Y>;
    style?: IRectStyle;
    itemStyle?: (item: T, index: number) => IRectStyle;
}

export default class RectDataSource<T = any, X = any, Y = any> extends DataSource<T, X, Y> {
    transform: (item: T, index: number) => IDataRect<X, Y>;
    style: IRectStyle;
    itemStyle?: (item: T, index: number) => IRectStyle;

    constructor(input: RectDataSourceInput<T, X, Y>) {
        super(input);
        this.transform = input.transform;
        this.style = { ...input.style };
        this.itemStyle = input.itemStyle;
    }

    get type(): ChartDataType {
        return 'rect';
    }

    get itemReuseID(): string {
        return this.id + '_rect';
    }

    getItemLayout(index: number): IItemCustomLayout {
        let range = this.transform(this.data[index], index);
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
            reuseID: this.itemReuseID,
            ...props,
            getItemLayout: i => this.getItemLayout(i),
            getVisibleIndexSet: pointRange => new Set(this.getItemsIndexesInLocationRange(pointRange)),
            shouldRenderItem: () => false,
        });
    }
}
