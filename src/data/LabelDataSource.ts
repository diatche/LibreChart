import {
    CustomLayoutSource,
    IItemCustomLayout,
    LayoutSourceProps,
} from 'evergrid';
import DataSource, { DataSourceInput } from './DataSource';
import {
    ChartDataType,
    IDataSourceRect,
    ILabelStyle,
    ITickLabel,
} from '../types';
import { Animated } from 'react-native';

export interface LabelDataSourceInput<T, X = number, Y = number>
    extends DataSourceInput<T, X, Y> {
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
    getLabel: (
        item: T,
        style: ILabelStyle,
    ) => ITickLabel | ITickLabel['title'] | ITickLabel['render'];
    style?: ILabelStyle;
    itemStyle?: (item: T, index: number) => ILabelStyle | undefined;
}

export default class LabelDataSource<T = any, X = number, Y = number>
    extends DataSource<T, X, Y>
    implements LabelDataSourceInput<T, X, Y> {
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
    getLabel: LabelDataSourceInput<T, X, Y>['getLabel'];
    style: ILabelStyle;
    itemStyle?: (item: T, index: number) => ILabelStyle | undefined;

    constructor(input: LabelDataSourceInput<T, X, Y>) {
        super(input);
        this.transform = input.transform;
        this.getLabel = input.getLabel;
        this.style = { ...input.style };
        this.itemStyle = input.itemStyle;
    }

    get type(): ChartDataType {
        return 'label';
    }

    get itemReuseID(): string {
        return this.id + '_label';
    }

    getItemLayout(index: number): IItemCustomLayout {
        let sourceLabel = this.transform(this.data[index], index);
        let r = this.getItemRect(sourceLabel);
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
            willUseItemViewLayout: (itemViewLayout, index) => {
                let itemStyle = this.itemStyle?.(this.data[index], index);
                let offsetX =
                    itemStyle?.viewOffset?.x || this.style.viewOffset?.x;
                if (offsetX) {
                    itemViewLayout.offset.x = Animated.add(
                        itemViewLayout.offset.x,
                        offsetX,
                    );
                }
                let offsetY =
                    itemStyle?.viewOffset?.y || this.style.viewOffset?.y;
                if (offsetY) {
                    itemViewLayout.offset.y = Animated.add(
                        itemViewLayout.offset.y,
                        offsetY,
                    );
                }
            },
            getVisibleIndexSet: pointRange =>
                new Set(this.getItemsIndexesInLocationRange(pointRange)),
            shouldRenderItem: () => false,
        });
    }
}
