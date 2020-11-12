import { Animated } from "react-native";
import RecyclerGridView, {
    AxisType,
    AxisTypeMapping,
    FlatLayoutSource,
    FlatLayoutSourceProps,
    GridLayoutSource,
    GridLayoutSourceProps,
    IAnimationBaseOptions,
    IItemUpdateOptions,
    isAxisType,
    isPointRangeEmpty,
    LayoutSource,
    zeroPoint,
} from "recycler-grid-view";
import DataSource from "./DataSource";
import { kAxisReuseIDs, kGridReuseID } from '../const';
import { Chart } from "../internal";
import { ticks, zeroDecimalPoint } from "./scale";

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
    gridLayout: GridLayoutSource;
    axisLayouts: Partial<AxisTypeMapping<FlatLayoutSource>> = {};

    /** Grid container size in content coordinates. */
    gridContainerSize$ = new Animated.ValueXY();
    /** Number of major grid intervals per grid container. */
    gridMajorCount = zeroPoint();
    /** Major grid interval distance in content coordinates. */
    gridMajorInterval = zeroDecimalPoint();

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
        let { scale } = view;
        let visibleRange = view.getVisibleLocationRange();
        
        if (isPointRangeEmpty(visibleRange)) {
            this.gridMajorInterval = zeroDecimalPoint();
            this.gridMajorCount = zeroPoint();
            this.gridContainerSize$.setValue(zeroPoint());
            return;
        }

        // Work out tick mark distance
        let xTicks = ticks(
            visibleRange[0].x,
            visibleRange[1].x,
            {
                minDistance: Math.abs(50 / scale.x),
                expand: true,
            }
        );
        let yTicks = ticks(
            visibleRange[0].y,
            visibleRange[1].y,
            {
                minDistance: Math.abs(50 / scale.y),
                expand: true,
            }
        );

        this.gridMajorInterval = {
            x: xTicks[Math.min(1, xTicks.length - 1)]
                .sub(xTicks[0]),
            y: yTicks[Math.min(1, yTicks.length - 1)]
                .sub(yTicks[0]),
        }
        this.gridMajorCount = {
            x: xTicks.length - 1,
            y: yTicks.length - 1,
        };
        let gridContainerSize = {
            x: xTicks[xTicks.length - 1]
                .sub(xTicks[0])
                // .div(scale.x)
                .toNumber(),
            y: yTicks[yTicks.length - 1]
                .sub(yTicks[0])
                // .div(scale.y)
                .toNumber(),
        };
        this.gridContainerSize$.setValue(gridContainerSize);

        let updateOptions: IItemUpdateOptions = {
            visible: true,
            // animated: true,
            // timing: {
            //     duration: 200,
            // }
        };
        this.gridLayout.updateItems(view, updateOptions);
        for (let axisLayout of Object.values(this.axisLayouts)) {
            axisLayout?.updateItems(view, updateOptions);
        }
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
