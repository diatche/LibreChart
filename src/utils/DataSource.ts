import {
    CustomLayoutSource,
    IItemCustomLayout,
    IPoint,
    isPointInRange,
} from 'recycler-grid-view';

const kDefaultPointViewDiameter = 8;
const kDefaultPointViewSize = {
    x: kDefaultPointViewDiameter,
    y: kDefaultPointViewDiameter,
};
const kDefaultPointViewLayout = {
    size: kDefaultPointViewSize,
};

export interface DataSourceProps {
    data?: IPoint[];
    noCopy?: boolean;
    reuseID?: string;
}

export default class DataSource {
    data: IPoint[] = [];
    layout: CustomLayoutSource;

    constructor(props: DataSourceProps) {
        if (props.noCopy && !props.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = props.noCopy ? props.data! : [...props.data];
        this.layout = this._createLayoutSource(props);
    }

    getVisibleIndexSet(pointRange: [IPoint, IPoint]): Set<number> {
        let indexSet = new Set<number>();
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            const p = this.data[i];
            if (isPointInRange(p, pointRange)) {
                indexSet.add(i);
            }
        }
        return indexSet;
    }

    getItemLayout(index: number): IItemCustomLayout {
        const offset = this.data[index];
        return { offset };
    }

    private _createLayoutSource(props: DataSourceProps) {
        return new CustomLayoutSource({
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
