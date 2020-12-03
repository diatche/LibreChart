import {
    CustomLayoutSource,
    CustomLayoutSourceProps,
    LayoutSourceProps,
} from 'evergrid';
import { kPointReuseID } from '../const';
import { DataSource } from '..';

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

    createLayoutSource(props?: LayoutSourceProps<number>) {
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
