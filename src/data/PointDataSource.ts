import {
    CustomLayoutSource,
    CustomLayoutSourceProps,
    LayoutSourceProps,
} from 'evergrid';
import DataSource from './DataSource';
import { ChartDataType } from '../types';

const kDefaultPointViewDiameter = 8;
const kDefaultPointViewSize = {
    x: kDefaultPointViewDiameter,
    y: kDefaultPointViewDiameter,
};
const kDefaultPointViewLayout = {
    size: kDefaultPointViewSize,
};

export default class PointDataSource<X = any, Y = any> extends DataSource<
    X, Y, number, CustomLayoutSourceProps, CustomLayoutSource
> {
    get type(): ChartDataType {
        return 'point';
    }

    get itemReuseID(): string {
        return this.id + '_point';
    }

    createLayoutSource(props?: LayoutSourceProps<number>) {
        return new CustomLayoutSource({
            ...this.plot.getLayoutSourceOptions(),
            itemSize: { x: 1, y: 1 },
            reuseID: this.itemReuseID,
            itemOrigin: { x: 0.5, y: 0.5 },
            ...props,
            getItemLayout: i => this.getItemLayout(i),
            getItemViewLayout: () => kDefaultPointViewLayout,
            getVisibleIndexSet: pointRange => new Set(this.getItemsIndexesInLocationRange(pointRange)),
            shouldRenderItem: () => false,
        });
    }
}
