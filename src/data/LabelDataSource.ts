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
        style: ILabelStyle | undefined
    ) => ITickLabel | ITickLabel['title'] | ITickLabel['render'];
    style?: ILabelStyle;
    /**
     * If specifying a `viewOffset` which changes accross labels, use an `Animated.Value`
     * to avoid issues related to reusing views.
     */
    itemStyle?: (
        item: T,
        index: number,
        previous: ILabelStyle | undefined
    ) => ILabelStyle | undefined;
}

export default class LabelDataSource<T = any, X = number, Y = number>
    extends DataSource<T, X, Y>
    implements LabelDataSourceInput<T, X, Y> {
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
    getLabel: LabelDataSourceInput<T, X, Y>['getLabel'];
    style: ILabelStyle;
    itemStyle?: LabelDataSourceInput<T, X, Y>['itemStyle'];
    private _itemStyles: { [index: number]: ILabelStyle | undefined };

    constructor(input: LabelDataSourceInput<T, X, Y>) {
        super(input);
        this.transform = input.transform;
        this.getLabel = input.getLabel;
        this.style = { ...input.style };
        this.itemStyle = input.itemStyle;
        this._itemStyles = {};
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

    getItemStyle(index: number): ILabelStyle | undefined {
        if (!this.itemStyle) {
            return this.style;
        }
        let itemStyle = this._itemStyles[index];
        if (!itemStyle) {
            this.updateItemStyle(index);
            itemStyle = this._itemStyles[index];
        }
        return { ...this.style, ...itemStyle };
    }

    updateItemStyle(index: number) {
        if (!this.itemStyle) {
            return;
        }
        let itemStyle = this._itemStyles[index];
        itemStyle = this.itemStyle(this.data[index], index, itemStyle);
        if (itemStyle) {
            this._itemStyles[index] = itemStyle;
        } else {
            delete this._itemStyles[index];
        }
    }

    private _moveItemStyle(fromIndex: number, toIndex: number) {
        if (!this.itemStyle) {
            return;
        }
        let temp = this._itemStyles[fromIndex];
        delete this._itemStyles[fromIndex];
        if (temp) {
            this._itemStyles[toIndex] = temp;
        }
    }

    createLayoutSource(props?: LayoutSourceProps<number>) {
        return new CustomLayoutSource({
            ...this.plot.getLayoutSourceOptions(),
            reuseID: this.itemReuseID,
            ...props,
            getItemLayout: i => this.getItemLayout(i),
            willUseItemViewLayout: (itemViewLayout, index, layoutSource) => {
                // Setup newly created item
                this.updateItemStyle(index);
                let itemStyle = this.getItemStyle(index);
                let offsetX =
                    itemStyle?.viewOffset?.x || this.style.viewOffset?.x;
                if (offsetX) {
                    itemViewLayout.offset.x = Animated.add(
                        itemViewLayout.offset.x,
                        offsetX
                    );
                }
                let offsetY =
                    itemStyle?.viewOffset?.y || this.style.viewOffset?.y;
                if (offsetY) {
                    itemViewLayout.offset.y = Animated.add(
                        itemViewLayout.offset.y,
                        offsetY
                    );
                }
                props?.willUseItemViewLayout?.(
                    itemViewLayout,
                    index,
                    layoutSource
                );
            },
            shouldRenderItem: (item, previous) => {
                // Prepare to reuse item
                this._moveItemStyle(previous.index, item.index);
                return true;
            },
            willShowItem: item => {
                // Update item style if needed
                this.updateItemStyle(item.index);
            },
            getVisibleIndexSet: pointRange =>
                new Set(this.getItemsIndexesInLocationRange(pointRange)),
        });
    }
}
