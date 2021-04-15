import {
    CustomLayoutSource,
    IItem,
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
import _ from 'lodash';

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
    private _itemStyles: { [viewKey: string]: ILabelStyle | undefined };

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

    getItemStyle(item: IItem<number>): ILabelStyle | undefined {
        if (!this.itemStyle) {
            return this.style;
        }
        let itemStyle =
            this._itemStyles[item.viewKey] || this.updateItemStyle(item);
        if (!itemStyle) {
            return this.style;
        }
        return {
            align: { ...this.style.align, ...itemStyle?.align },
            viewOffset: {
                x: itemStyle?.viewOffset?.x || this.style.viewOffset?.x,
                y: itemStyle?.viewOffset?.y || this.style.viewOffset?.y,
            },
            textStyle: [this.style.textStyle, itemStyle?.textStyle],
        };
    }

    updateItemStyle(item: IItem<number>): ILabelStyle | undefined {
        if (!this.itemStyle) {
            return undefined;
        }
        let itemStyle = this._itemStyles[item.viewKey];
        itemStyle = this.itemStyle(
            this.data[item.index],
            item.index,
            itemStyle
        );
        if (itemStyle) {
            this._itemStyles[item.viewKey] = itemStyle;
        } else {
            delete this._itemStyles[item.viewKey];
        }
        return itemStyle;
    }

    createLayoutSource(props?: LayoutSourceProps<number>) {
        return new CustomLayoutSource({
            ...this.plot.getLayoutSourceOptions(),
            reuseID: this.itemReuseID,
            ...props,
            getItemLayout: i => this.getItemLayout(i),
            shouldRenderItem: () => true,
            willShowItem: (item, options) => {
                // Update item style if needed
                this.updateItemStyle(item);

                if (options.created) {
                    // Link offset with item
                    let itemStyle = this.getItemStyle(item);
                    let offsetX =
                        itemStyle?.viewOffset?.x || this.style.viewOffset?.x;
                    if (offsetX) {
                        item.animated.viewLayout.offset.x = Animated.add(
                            item.animated.viewLayout.offset.x,
                            offsetX
                        );
                    }
                    let offsetY =
                        itemStyle?.viewOffset?.y || this.style.viewOffset?.y;
                    if (offsetY) {
                        item.animated.viewLayout.offset.y = Animated.add(
                            item.animated.viewLayout.offset.y,
                            offsetY
                        );
                    }
                }
            },
            getVisibleIndexSet: pointRange =>
                new Set(this.getItemsIndexesInLocationRange(pointRange)),
        });
    }
}
