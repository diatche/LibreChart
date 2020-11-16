import { Animated } from "react-native";
import Evergrid, {
    AxisType,
    AxisTypeMapping,
    FlatLayoutSource,
    FlatLayoutSourceProps,
    GridLayoutSource,
    GridLayoutSourceProps,
    IAnimatedPoint,
    IItemUpdateManyOptions,
    IPoint,
    isAxisType,
    isPointRangeEmpty,
    LayoutSource,
    zeroPoint,
} from "evergrid";
import DataSource from "./DataSource";
import { kAxisReuseIDs, kGridReuseID } from '../const';
import { Chart } from "../internal";
import { ticks, zeroDecimalPoint } from "./scale";
import debounce from 'lodash.debounce';
import Decimal from "decimal.js";
import { IDecimalPoint } from "../types";
import { isMatch } from "./comp";

const k0 = new Decimal(0);

export interface LayoutEngineProps {
    dataSources?: DataSource[];
    grid?: {
        show?: boolean;
    } & GridLayoutSourceProps;
    axes?: Partial<AxisTypeMapping<{
        show?: boolean;
    } & Omit<FlatLayoutSourceProps, 'shouldRenderItem'>>>;
}

interface IGridLayoutInfo {
    /** Number of major grid intervals per grid container. */
    majorCount: IPoint;
    /** Major grid interval distance in content coordinates. */
    majorInterval: IDecimalPoint;
    /** Grid container size in content coordinates. */
    containerSize: IPoint;
    /** Animated grid container size in content coordinates. */
    readonly containerSize$: Animated.ValueXY;
}

export default class LayoutEngine {
    dataSources: DataSource[] = [];
    gridLayout: GridLayoutSource;
    axisLayouts: Partial<AxisTypeMapping<FlatLayoutSource>> = {};

    /** Grid layout info. */
    readonly gridInfo = LayoutEngine._createGridInfo();
    readonly axes = LayoutEngine._createGridInfo();

    /** Animated grid container size in view coordinates. */
    private _containerViewSize$?: IAnimatedPoint;

    constructor(props: LayoutEngineProps) {
        this.dataSources = props.dataSources || [];
        this.gridLayout = this._createGridLayoutSource(props);
        this.axisLayouts = this._createAxisLayoutSources(props);
    }
    
    configure(chart: Chart) {
        this._containerViewSize$ = chart.innerView?.scaleVector$(this.gridInfo.containerSize$);
        this.update(chart);
    }

    unconfigure(chart: Chart) {

    }

    scheduleUpdate(chart: Chart) {
        this._debouncedUpdate(chart);
    }
    
    private _debouncedUpdate = debounce(
        (chart: Chart) => this.update(chart),
        100,
    );

    update(chart: Chart) {
        let view = chart.innerView;
        if (!view) {
            return;
        }
        this.updateGrid(view);
    }

    updateGrid(view: Evergrid) {
        let { scale } = view;
        let visibleRange = view.getVisibleLocationRange();

        if (isPointRangeEmpty(visibleRange)) {
            this._resetGridInfo();
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

        let gridInfo = {
            majorInterval: {
                x: xTicks[Math.min(1, xTicks.length - 1)]
                    .sub(xTicks[0]),
                y: yTicks[Math.min(1, yTicks.length - 1)]
                    .sub(yTicks[0]),
            },
            majorCount: {
                x: xTicks.length - 1,
                y: yTicks.length - 1,
            },
            containerSize: {
                x: xTicks[xTicks.length - 1]
                    .sub(xTicks[0])
                    // .div(scale.x)
                    .toNumber(),
                y: yTicks[yTicks.length - 1]
                    .sub(yTicks[0])
                    // .div(scale.y)
                    .toNumber(),
            },
        };
        if (isMatch(this.gridInfo, gridInfo)) {
            // No changes
            return;
        }
        
        Object.assign(this.gridInfo, gridInfo);
        this.gridInfo.containerSize$.setValue(gridInfo.containerSize);

        let updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
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

    private static _createGridInfo(): IGridLayoutInfo {
        return {
            majorInterval: zeroDecimalPoint(),
            majorCount: zeroPoint(),
            containerSize: zeroPoint(),
            containerSize$: new Animated.ValueXY(),
        };
    }

    private _resetGridInfo() {
        this.gridInfo.majorInterval = zeroDecimalPoint();
        this.gridInfo.majorCount = zeroPoint();
        this.gridInfo.containerSize = zeroPoint();
        this.gridInfo.containerSize$.setValue(zeroPoint());
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

    /**
     * Returns the grid container's range at the
     * specified 
     * @param location The location.
     * @param direction The axis direction.
     * @returns The grid container's range in content coordinates.
     */
    getGridContainerRangeAtIndex(index: number, direction: 'x' | 'y'): [Decimal, Decimal] {
        let interval = this.gridInfo.majorInterval[direction];
        let count = this.gridInfo.majorCount[direction];
        if (count === 0 || interval.lte(0)) {
            return [k0, k0];
        }
        let len = interval.mul(count);
        let origin = new Decimal(this.gridLayout.origin[direction]);
        let start = new Decimal(index).mul(len).add(origin);
        return [start, start.add(len)];
    }

    /**
     * Returns the grid container's range, which
     * contains the specified point in content coordinates.
     * @param location The location.
     * @param direction The axis direction.
     * @returns The grid container's range in content coordinates.
     */
    getGridContainerRangeAtLocation(location: Decimal.Value, direction: 'x' | 'y'): [Decimal, Decimal] {
        let interval = this.gridInfo.majorInterval[direction];
        let count = this.gridInfo.majorCount[direction];
        if (count === 0 || interval.lte(0)) {
            return [k0, k0];
        }
        let len = interval.mul(count);
        let origin = new Decimal(this.gridLayout.origin[direction]);
        let p = new Decimal(location).sub(origin);
        let start = p.div(len).floor().mul(len).add(origin);
        return [start, start.add(len)];
    }

    /**
     * Returns all ticks in the specified interval.
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @param direction {'x' | 'y'} The axis direction.
     * @returns Tick locations.
     */
    getTickLocations(start: Decimal.Value, end: Decimal.Value, direction: 'x' | 'y'): Decimal[] {
        let a = new Decimal(start);
        let b = new Decimal(end);

        if (a.gte(b)) {
            return [];
        }
        let interval = this.gridInfo.majorInterval[direction];
        let count = this.gridInfo.majorCount[direction];
        if (count === 0 || interval.lte(0)) {
            return [];
        }

        // Get all ticks in interval
        let ticks: Decimal[] = [];
        let len = interval.mul(count);
        let tick = a.div(len).floor().mul(len);
        if (tick.gte(a)) {
            ticks.push(tick);
        }
        tick = tick.add(interval);
        while (tick.lt(b)) {
            ticks.push(tick);
            tick = tick.add(interval);
        }

        return ticks;
    }

    private _createGridLayoutSource(props: LayoutEngineProps) {
        return new GridLayoutSource({
            itemSize: this.gridInfo.containerSize$,
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
        let axisProps = props.axes?.[axis];
        if (!axisProps?.show) {
            return undefined;
        }
        switch (axis) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    itemSize: this.gridInfo.containerSize$,
                    ...axisProps,
                    getItemViewLayout: () => ({
                        size: {
                            x: this._containerViewSize$?.x || 0,
                            y: 60,
                        }
                    }),
                    insets: { bottom: 60 },
                    horizontal: true,
                    stickyEdge: 'bottom',
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
