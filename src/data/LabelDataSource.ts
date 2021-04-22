import {
    CustomLayoutSource,
    IItem,
    IItemCustomLayout,
    LayoutSourceProps,
    normalizeAnimatedValueOrInterpolation,
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

const kDefaultLabelStyle: ILabelStyle = {
    viewLayout: {
        size: { x: 100, y: 100 },
        anchor: { x: 0.5, y: 0.5 },
    },
};

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
        this.style = _.merge({}, kDefaultLabelStyle, input.style || {});
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
            viewLayout: _.merge(
                {},
                this.style.viewLayout || {},
                itemStyle.viewLayout || {}
            ),
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
                    if (itemStyle?.viewLayout?.offset?.x) {
                        item.animated.viewLayout.offset.x = Animated.add(
                            item.animated.viewLayout.offset.x,
                            itemStyle.viewLayout.offset.x
                        );
                    }
                    if (itemStyle?.viewLayout?.offset?.y) {
                        item.animated.viewLayout.offset.y = Animated.add(
                            item.animated.viewLayout.offset.y,
                            itemStyle.viewLayout.offset.y
                        );
                    }
                    if (itemStyle?.viewLayout?.size?.x) {
                        item.animated.viewLayout.size.x = normalizeAnimatedValueOrInterpolation(
                            itemStyle.viewLayout.size.x
                        );
                    }
                    if (itemStyle?.viewLayout?.size?.y) {
                        item.animated.viewLayout.size.y = normalizeAnimatedValueOrInterpolation(
                            itemStyle.viewLayout.size.y
                        );
                    }
                    if (itemStyle?.viewLayout?.anchor?.x) {
                        item.animated.viewLayout.anchor.x = normalizeAnimatedValueOrInterpolation(
                            itemStyle.viewLayout.anchor.x
                        );
                    }
                    if (itemStyle?.viewLayout?.anchor?.y) {
                        item.animated.viewLayout.anchor.y = normalizeAnimatedValueOrInterpolation(
                            itemStyle.viewLayout.anchor.y
                        );
                    }
                }
            },
            getVisibleIndexSet: pointRange =>
                new Set(this.getItemsIndexesInLocationRange(pointRange)),
        });
    }
}
