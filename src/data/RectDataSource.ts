import {
    CustomLayoutSource,
    IItemCustomLayout,
    LayoutSourceProps,
} from 'evergrid';
import DataSource, {
    DataSourceInput,
} from './DataSource';
import {
    ChartDataType,
    IDataSourceRect,
    IRectStyle,
} from '../types';

export interface RectDataSourceInput<T, X = any, Y = any> extends DataSourceInput<T, X, Y> {
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
    style?: IRectStyle;
    itemStyle?: (item: T, index: number) => IRectStyle;
}

export default class RectDataSource<T = any, X = any, Y = any> extends DataSource<T, X, Y> {
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
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
        let sourceRect = this.transform(this.data[index], index);
        let r = this.getItemRect(sourceRect);
        return {
            offset: r,
            size: {
                x: r.width,
                y: r.height,
            },
        };
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
