import { Animated } from "react-native";
import Evergrid, {
    AxisType,
    AxisTypeMapping,
    axisTypeMap,
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
    isRangeEmpty,
} from "evergrid";
import DataSource from "./DataSource";
import {
    kAxisReuseIDs,
    kGridReuseID,
} from '../const';
import { Chart } from "../internal";
import { ticks, zeroDecimalPoint } from "./scale";
import debounce from 'lodash.debounce';
import Decimal from "decimal.js";
import { IDecimalPoint } from "../types";
import { isMatch } from "./comp";

const kGridUpdateDebounceInterval = 100;
const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

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

interface IGridLayoutBaseInfo {
    /** Number of major grid intervals per grid container. */
    majorCount: IPoint;
    /** Major grid interval distance in content coordinates. */
    majorInterval: IDecimalPoint;
    /** Grid container size in content coordinates. */
    containerSize: IPoint;
}

interface IGridLayoutInfo extends IGridLayoutBaseInfo {
    /** Animated grid container size in content coordinates. */
    readonly containerSize$: Animated.ValueXY;
    /**
     * Animated major grid interval negative half-distance
     * in content coordinates.
     * 
     * This is used to syncronize axes with the grid.
     **/
    readonly negHalfMajorInterval$: Animated.ValueXY;
}

interface IAxisLayoutInfo {
    /** The axis thickness. */
    thickness: number;
    /**
     * To reduce the number of layout updates,
     * snap thickness to this step size.
     **/
    thicknessStep: number;
    /** The animated axis thickness. */
    readonly thickness$: Animated.Value;
    /**
     * Each axis container works out what thickness
     * is optimal. Based on these values, the final
     * thickness is calculated.
     */
    optimalThicknesses: { [index: number]: number };
    /**
     * Called by the axis container view, after a
     * view layout, with the new optimal thickness.
     */
    onOptimalThicknessChange: (thickness: number, index: number, chart: Chart) => void;
}

export default class LayoutEngine { 
    dataSources: DataSource[] = [];
    gridLayout: GridLayoutSource;
    axisLayouts: Partial<AxisTypeMapping<FlatLayoutSource>> = {};

    /** Grid layout info. */
    readonly gridInfo = LayoutEngine._createGridInfo();

    /** Axis layout info. */
    readonly axisInfo: AxisTypeMapping<IAxisLayoutInfo>;

    /** Animated grid container size in view coordinates. */
    private _containerViewSize$?: IAnimatedPoint;

    constructor(props: LayoutEngineProps) {
        this.dataSources = props.dataSources || [];
        this.gridLayout = this._createGridLayoutSource(props);
        this.axisLayouts = this._createAxisLayoutSources(props);
        this.axisInfo = this._createAxisInfos();
    }
    
    configure(chart: Chart) {
        this._containerViewSize$ = chart.innerView?.scaleSize$(this.gridInfo.containerSize$);
        this.update(chart);
    }

    unconfigure(chart: Chart) {

    }

    scheduleUpdate(chart: Chart) {
        this._debouncedUpdate(chart);
    }
    
    private _debouncedUpdate = debounce(
        (chart: Chart) => this.update(chart),
        kGridUpdateDebounceInterval,
    );

    update(chart: Chart) {
        let view = chart.innerView;
        if (!view) {
            return;
        }

        this.updateGrid(view);
    }

    updateGrid(view: Evergrid) {
        let gridInfo = this._getGridInfo(view);
        if (!gridInfo || isMatch(this.gridInfo, gridInfo)) {
            // No changes
            return;
        }

        Object.assign(this.gridInfo, gridInfo);
        this.gridInfo.containerSize$.setValue(gridInfo.containerSize);
        this.gridInfo.negHalfMajorInterval$.setValue({
            x: gridInfo.majorInterval.x.div(2).neg().toNumber(),
            y: gridInfo.majorInterval.y.div(2).neg().toNumber(),
        });

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

    onOptimalAxisThicknessChange(
        thickness: number,
        index: number,
        axisType: AxisType,
        chart: Chart,
    ) {
        // Save optimal thicknesses until an
        // update is triggered.
        const axis = this.axisInfo[axisType];
        axis.optimalThicknesses[index] = thickness;
        this.scheduleAxisUpdate(axisType, chart);
    }

    scheduleAxisUpdate(axisType: AxisType, chart: Chart) {
        this._debouncedAxisUpdate[axisType](chart);
    }
    
    private _debouncedAxisUpdate = axisTypeMap(axisType => debounce(
        (chart: Chart) => this.updateAxisThickness(axisType, chart),
        kAxisUpdateDebounceInterval,
    ));

    updateAxisThickness(axisType: AxisType, chart: Chart) {
        let view = chart.innerView;
        if (!view) {
            return;
        }

        // Get optimal axis thickness
        const axis = this.axisInfo[axisType];

        let axisThickness = 0;
        for (let thickness of Object.values(axis.optimalThicknesses)) {
            if (thickness > axisThickness) {
                axisThickness = thickness;
            }
        }

        axisThickness = Math.ceil(axisThickness / axis.thicknessStep) * axis.thicknessStep;

        if (axisThickness !== axis.thickness) {
            // Thickness changed
            axis.thickness = axisThickness;

            let duration = kAxisResizeDuration;
            if (duration > 0) {
                Animated.timing(axis.thickness$, {
                    toValue: axisThickness,
                    duration,
                    useNativeDriver: false,
                }).start();
            } else {
                axis.thickness$.setValue(axisThickness);
            }
        }
    }

    private _cleanAxisThicknessInfo(axisType: AxisType, visibleRange: [number, number]) {
        if (!this.axisLayouts[axisType]) {
            return;
        }

        // Remove hidden axis container indexes
        const axis = this.axisInfo[axisType];

        if (isRangeEmpty(visibleRange)) {
            axis.optimalThicknesses = {};
            return;
        }

        for (let key of Object.keys(axis.optimalThicknesses)) {
            let index = parseInt(key);
            if (index < visibleRange[0] || index >= visibleRange[1]) {
                delete axis.optimalThicknesses[index];
            }
        }
    }

    private _getGridInfo(view: Evergrid): IGridLayoutBaseInfo | undefined {
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

        return {
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
    }

    private static _createGridInfo(): IGridLayoutInfo {
        return {
            majorInterval: zeroDecimalPoint(),
            majorCount: zeroPoint(),
            containerSize: zeroPoint(),
            containerSize$: new Animated.ValueXY(),
            negHalfMajorInterval$: new Animated.ValueXY(),
        };
    }

    private _resetGridInfo() {
        this.gridInfo.majorInterval = zeroDecimalPoint();
        this.gridInfo.majorCount = zeroPoint();
        this.gridInfo.containerSize = zeroPoint();
        this.gridInfo.containerSize$.setValue(zeroPoint());
    }

    private _createAxisInfos(): AxisTypeMapping<IAxisLayoutInfo> {
        return axisTypeMap(a => this._createAxisInfo(a));
    }

    private _createAxisInfo(type: AxisType): IAxisLayoutInfo {
        return {
            thickness: 0,
            thicknessStep: kDefaultAxisThicknessStep,
            thickness$: new Animated.Value(0),
            optimalThicknesses: {},
            onOptimalThicknessChange: (thickness, index, chart) => (
                this.onOptimalAxisThicknessChange(thickness, index, type, chart)
            ),
        };
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
        let start = new Decimal(index).mul(len);
        return [start, start.add(len)];
    }

    /**
     * Returns all ticks in the specified interval.
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @param direction {'x' | 'y'} The axis direction.
     * @returns Tick locations.
     */
    getTickLocations(
        start: Decimal.Value,
        end: Decimal.Value,
        direction: 'x' | 'y',
    ): Decimal[] {
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

    /**
     * Returns `true` if the axis has a negative scale.
     * @param direction 
     * @param chart 
     */
    isAxisInverted(direction: 'x' | 'y', chart: Chart) {
        return (chart.innerView?.scale[direction] || 0) < 0;
    }

    onVisibleGridContainerRangeChange(visibleRange: [IPoint, IPoint]) {
        let xRange: [number, number] = [visibleRange[0].x, visibleRange[1].x];
        let yRange: [number, number] = [visibleRange[0].y, visibleRange[1].y];
        this._cleanAxisThicknessInfo('topAxis', xRange);
        this._cleanAxisThicknessInfo('bottomAxis', xRange);
        this._cleanAxisThicknessInfo('leftAxis', yRange);
        this._cleanAxisThicknessInfo('rightAxis', yRange);
    }

    private _createGridLayoutSource(props: LayoutEngineProps) {
        return new GridLayoutSource({
            itemSize: this.gridInfo.containerSize$,
            ...props.grid,
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
            onVisibleRangeChange: r => this.onVisibleGridContainerRangeChange(r),
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
                            y: this.axisInfo[axis].thickness$,
                        }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: this.gridInfo.negHalfMajorInterval$.x,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'bottom',
                    shouldRenderItem: () => true,
                    reuseID: kAxisReuseIDs[axis],
                });
            case 'topAxis':
                return new FlatLayoutSource({
                    itemSize: this.gridInfo.containerSize$,
                    ...axisProps,
                    getItemViewLayout: () => ({
                        size: {
                            x: this._containerViewSize$?.x || 0,
                            y: this.axisInfo[axis].thickness$,
                        }
                    }),
                    itemOrigin: { x: 0, y: 1 },
                    origin: {
                        x: this.gridInfo.negHalfMajorInterval$.x,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'top',
                    shouldRenderItem: () => true,
                    reuseID: kAxisReuseIDs[axis],
                });
            case 'leftAxis':
                return new FlatLayoutSource({
                    itemSize: this.gridInfo.containerSize$,
                    ...axisProps,
                    getItemViewLayout: () => ({
                        size: {
                            x: this.axisInfo[axis].thickness$,
                            y: this._containerViewSize$?.y || 0,
                        }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: 0,
                        y: this.gridInfo.negHalfMajorInterval$.y,
                    },
                    horizontal: false,
                    stickyEdge: 'left',
                    shouldRenderItem: () => true,
                    reuseID: kAxisReuseIDs[axis],
                });
            case 'rightAxis':
                return new FlatLayoutSource({
                    itemSize: this.gridInfo.containerSize$,
                    ...axisProps,
                    getItemViewLayout: () => ({
                        size: {
                            x: this.axisInfo[axis].thickness$,
                            y: this._containerViewSize$?.y || 0,
                        }
                    }),
                    itemOrigin: { x: 1, y: 0 },
                    origin: {
                        x: 0,
                        y: this.gridInfo.negHalfMajorInterval$.y,
                    },
                    horizontal: false,
                    stickyEdge: 'right',
                    shouldRenderItem: () => true,
                    reuseID: kAxisReuseIDs[axis],
                });
        }
    }
}

// export const create = () => {
//     return new GridLayoutSource({

//     });
// };
