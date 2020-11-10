import { Animated } from "react-native";
import RecyclerGridView, {
    AxisType,
    AxisTypeMapping,
    FlatLayoutSource,
    FlatLayoutSourceProps,
    GridLayoutSource,
    GridLayoutSourceProps,
    isAxisType,
    LayoutSource,
    zeroPoint,
} from "recycler-grid-view";
import DataSource from "./DataSource";
import { Chart, kAxisReuseIDs, kGridReuseID } from "../internal";

export interface LayoutEngineProps {
    dataSources?: DataSource[];
    grid?: {
        show?: boolean;
    } & GridLayoutSourceProps;
    axes?: AxisTypeMapping<{
        show?: boolean;
    } & FlatLayoutSourceProps>;
}

export default class LayoutEngine {
    dataSources: DataSource[] = [];
    gridLayout?: GridLayoutSource;
    axisLayouts: Partial<AxisTypeMapping<FlatLayoutSource>> = {};

    gridContainerSize$ = new Animated.ValueXY();
    gridMajorCount = zeroPoint();

    constructor(props: LayoutEngineProps) {
        this.dataSources = props.dataSources || [];
        this.gridLayout = this._createGridLayoutSource(props);
        this.axisLayouts = this._createAxisLayoutSources(props);
    }
    
    configure(chart: Chart) {
        this.update(chart);
    }

    unconfigure(chart: Chart) {

    }

    update(chart: Chart) {
        let view = chart.innerView;
        if (!view) {
            return;
        }
        this.updateGrid(view);
    }

    updateGrid(view: RecyclerGridView) {
        let {
            containerSize,
            scale,
        } = view;

        // Work out tick mark distance
        
    }

    getLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            // Grid in back by default
            this.gridLayout,
            // Data above grid and below axes
            ...this.dataSources.map(d => d.layout),
            // Horizontal axes below vertical axes
            this.axisLayouts.bottomAxis,
            this.axisLayouts.topAxis,
            this.axisLayouts.rightAxis,
            this.axisLayouts.leftAxis,
        ].filter(s => !!s) as LayoutSource[];
    }

    private _createGridLayoutSource(props: LayoutEngineProps) {
        if (!props.grid?.show) {
            return undefined;
        }
        return new GridLayoutSource({
            itemSize: this.gridContainerSize$,
            ...props.grid,
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
        });
    }

    private _createAxisLayoutSources(props: LayoutEngineProps) {
        let axisLayouts: Partial<AxisTypeMapping<FlatLayoutSource>> = {};
        for (let axisType of Object.keys(props.axes || {})) {
            if (!isAxisType(axisType)) {
                throw new Error(`Invalid axis type: ${axisType}`);
            }
            let layout = this._createAxisLayoutSource(axisType, props);
            if (layout) {
                axisLayouts[axisType] = layout;
            }
        }
        return axisLayouts;
    }

    private _createAxisLayoutSource(axis: AxisType, props: LayoutEngineProps): FlatLayoutSource | undefined {
        let axisProps = props.axes![axis];
        if (!axisProps.show) {
            return undefined;
        }
        switch (axis) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    itemSize: this.gridContainerSize$,
                    ...axisProps,
                    getItemViewLayout: () => ({
                        size: {
                            x: this.gridContainerSize$.x,
                            y: 60,
                        }
                    }),
                    shouldRenderItem: () => true,
                    reuseID: kAxisReuseIDs[axis],
                });
                // return new FlatLayoutSource({
                //     reuseID: 'bottomAxisMajor',
                //     itemSize: kStep,
                //     getItemViewLayout: () => ({
                //         size: {
                //             x: 60,
                //             y: kXAxisHeight,
                //         }
                //     }),
                //     horizontal: true,
                //     stickyEdge: 'bottom',
                //     itemOrigin: { x: 0.5, y: 1 },
                //     shouldRenderItem: () => true,
                // });
            case 'leftAxis':
                throw new Error('Not Implemented');
            case 'rightAxis':
                throw new Error('Not Implemented');
            case 'topAxis':
                throw new Error('Not Implemented');
        }
    }
}

// export const create = () => {
//     return new GridLayoutSource({

//     });
// };
