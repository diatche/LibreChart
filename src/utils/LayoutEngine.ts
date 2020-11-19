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
    isAxisHorizontal,
} from "evergrid";
import DataSource from "./DataSource";
import {
    kAxisDirection,
    kAxisReuseIDs,
    kGridReuseID,
} from '../const';
import { Chart } from "../internal";
import { linearTicks } from "./linearScale";
import { zeroDecimalPoint } from "./vectors";
import debounce from 'lodash.debounce';
import Decimal from "decimal.js";
import { IChartStyle, IDecimalPoint } from "../types";
import { isMatch } from "./comp";
import { TickGenerator } from "./baseScale";

const kGridUpdateDebounceInterval = 100;
const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

const k0 = new Decimal(0);

export interface LayoutEngineProps {
    dataSources?: DataSource[];
    grid?: {
        horizontalAxis?: AxisType;
        verticalAxis?: AxisType;
    } & GridLayoutSourceProps;
    axes?: Partial<AxisTypeMapping<{
        show?: boolean;
        tickLocations?: TickGenerator;
    } & Omit<FlatLayoutSourceProps, 'shouldRenderItem'>>>;
}

interface IAxisLengthLayoutBaseInfo {
    /** Number of major axis intervals per axis container. */
    majorCount: number;
    /** Major axis interval distance in content coordinates. */
    majorInterval: Decimal;

    /** Number of minor axis intervals per axis container. */
    minorCount: number;
    /** Minor axis interval distance in content coordinates. */
    minorInterval: Decimal;

    /** Grid container length in content coordinates. */
    containerLength: number;
}

interface IAxisLengthLayoutInfo extends IAxisLengthLayoutBaseInfo {
    /** Animated axis container length in content coordinates. */
    readonly containerLength$: Animated.Value;
    /** Animated axis container length in view coordinates. */
    containerViewLength$?: Animated.AnimatedInterpolation;
    /**
     * Animated major axis interval negative half-distance
     * in content coordinates.
     * 
     * This is used to syncronize axes with the axis.
     **/
    readonly negHalfMajorInterval$: Animated.Value;
    readonly tickLocations: TickGenerator;
}

interface IAxisWidthLayoutInfo {
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

interface IChartAxis extends IAxisWidthLayoutInfo, IAxisLengthLayoutInfo {
    horizontal: boolean;
    layout?: FlatLayoutSource;
}

interface IChartGrid {
    layout?: GridLayoutSource;
    horizontalAxis?: AxisType;
    verticalAxis?: AxisType;
}


export default class LayoutEngine { 
    dataSources: DataSource[] = [];

    /** Axis layout info. */
    readonly axes: AxisTypeMapping<IChartAxis>;

    /** Grid layout info. */
    readonly grid: IChartGrid;

    /** Visible grid container index range. */
    private _visibleGridContainerIndexRange: [IPoint, IPoint] = [zeroPoint(), zeroPoint()];

    constructor(props: LayoutEngineProps) {
        this.dataSources = props.dataSources || [];
        this.axes = this._createAxes(props);
        this.grid = this._createGrid(this.axes, props);
    }

    getHorizontalGridAxis(): IChartAxis | undefined {
        if (!this.grid.horizontalAxis) {
            return undefined;
        }
        return this.axes[this.grid.horizontalAxis];
    }

    getVerticalGridAxis(): IChartAxis | undefined {
        if (!this.grid.verticalAxis) {
            return undefined;
        }
        return this.axes[this.grid.verticalAxis];
    }
    
    configure(chart: Chart) {
        axisTypeMap(axisType => this.configureAxis(axisType, chart));
        this.update(chart);
    }
    
    configureAxis(axisType: AxisType, chart: Chart) {
        const axis = this.axes[axisType];
        let view = chart.innerView;
        if (view) {
            let scale = axis.layout?.getScale$(view);
            if (scale) {
                let axisScale = axis.horizontal ? scale.x : scale.y;
                axis.containerViewLength$ = Animated.multiply(axis.containerLength$, axisScale);
            }
        }
        axis.containerViewLength$ = undefined;
    }

    unconfigure(chart: Chart) {
        axisTypeMap(axisType => this.unconfigureAxis(axisType, chart));
    }
    
    unconfigureAxis(axisType: AxisType, chart: Chart) {
        const axis = this.axes[axisType];
        axis.containerViewLength$ = undefined;
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

        this._update(view, chart.getChartStyle());
    }

    private _update(view: Evergrid, chartStyle: Required<IChartStyle>) {
        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
            // animated: true,
            // timing: {
            //     duration: 200,
            // }
        };

        let changes = axisTypeMap(axisType => this._updateAxis(
            axisType,
            view,
            chartStyle,
            updateOptions,
        ));
        
        if (
            this.grid.layout && (
                this.grid.horizontalAxis && changes[this.grid.horizontalAxis]
                || this.grid.verticalAxis && changes[this.grid.verticalAxis]
            )
        ) {
            this.grid.layout.updateItems(view, updateOptions);
        }
    }

    private _updateAxis(
        axisType: AxisType,
        view: Evergrid,
        chartStyle: Required<IChartStyle>,
        updateOptions: IItemUpdateManyOptions,
    ): boolean {
        let axis = this.axes[axisType];
        if (!axis.layout) {
            return false;
        }

        let axisLengthInfo = this._getAxisLengthInfo(axis, view, chartStyle);
        if (!axisLengthInfo || isMatch(axis, axisLengthInfo)) {
            // No changes
            return false;
        }

        Object.assign(axis, axisLengthInfo);
        axis.containerLength$.setValue(axisLengthInfo.containerLength);
        axis.negHalfMajorInterval$.setValue(
            axisLengthInfo.majorInterval.div(2).neg().toNumber()
        );

        axis.layout.updateItems(view, updateOptions);
        return true;
    }

    onOptimalAxisThicknessChange(
        thickness: number,
        index: number,
        axisType: AxisType,
        chart: Chart,
    ) {
        // Save optimal thicknesses until an
        // update is triggered.

        let view = chart.innerView;
        if (!view) {
            return;
        }

        const axis = this.axes[axisType];

        // Apply thickness step
        thickness = Math.ceil(thickness / axis.thicknessStep) * axis.thicknessStep;

        if (thickness !== axis.optimalThicknesses[index]) {
            axis.optimalThicknesses[index] = thickness;
            this.scheduleAxisThicknessUpdate(axisType, view);
        }
    }

    scheduleAxisThicknessUpdate(axisType: AxisType, view: Evergrid) {
        if (!this.axes[axisType].layout) {
            return;
        }
        this._debouncedAxisUpdate[axisType]();
    }
    
    private _debouncedAxisUpdate = axisTypeMap(axisType => debounce(
        () => this.updateAxisThickness(axisType),
        kAxisUpdateDebounceInterval,
    ));

    updateAxisThickness(axisType: AxisType) {
        const axis = this.axes[axisType];

        // Get optimal axis thickness
        let thickness = 0;
        for (let optimalThickness of Object.values(axis.optimalThicknesses)) {
            if (optimalThickness > thickness) {
                thickness = optimalThickness;
            }
        }

        thickness = Math.ceil(thickness / axis.thicknessStep) * axis.thicknessStep;

        if (thickness !== axis.thickness) {
            // Thickness changed
            axis.thickness = thickness;

            let duration = kAxisResizeDuration;
            if (duration > 0) {
                Animated.timing(axis.thickness$, {
                    toValue: thickness,
                    duration,
                    useNativeDriver: false,
                }).start();
            } else {
                axis.thickness$.setValue(thickness);
            }
        }

        this._cleanAxisThicknessInfo(axisType);
    }

    private _cleanAxisThicknessInfo(axisType: AxisType) {
        let direction = kAxisDirection[axisType];
        let visibleRange: [number, number] = [
            this._visibleGridContainerIndexRange[0][direction],
            this._visibleGridContainerIndexRange[1][direction],
        ];

        // Remove hidden axis container indexes
        const axis = this.axes[axisType];
        
        if (isRangeEmpty(visibleRange)) {
            return;
        }

        for (let key of Object.keys(axis.optimalThicknesses)) {
            let index = parseInt(key);
            if (index < visibleRange[0] || index >= visibleRange[1]) {
                delete axis.optimalThicknesses[index];
            }
        }
    }

    private _getAxisLengthInfo(
        axis: IChartAxis,
        view: Evergrid,
        chartStyle: Required<IChartStyle>
    ): IAxisLengthLayoutBaseInfo | undefined {
        let { scale } = view;
        let visibleLocationRange = axis.layout!.getVisibleLocationRange(view);
        let visibleRange: [number, number] = axis.horizontal
            ? [visibleLocationRange[0].x, visibleLocationRange[1].x]
            : [visibleLocationRange[0].y, visibleLocationRange[1].y];

        if (isRangeEmpty(visibleRange)) {
            this._resetAxisLengthInfo(axis);
            return;
        }

        let {
            majorGridLineDistanceMin,
            minorGridLineDistanceMin,
        } = chartStyle;

        let majorDist = new Decimal(majorGridLineDistanceMin);
        let minorDist = new Decimal(minorGridLineDistanceMin);

        // Work out tick mark distance
        let majorTicks = linearTicks(
            visibleRange[0],
            visibleRange[1],
            {
                minInterval: majorDist.div(scale.x).abs(),
                expand: true,
            }
        );

        let majorInterval = majorTicks[Math.min(1, majorTicks.length - 1)]
                .sub(majorTicks[0]);

        let minorTicks = linearTicks(
            k0,
            majorInterval,
            {
                minInterval: minorDist.div(scale.x).abs(),
                maxCount: 5,
            }
        );

        return {
            majorInterval,
            majorCount: majorTicks.length - 1,
            minorInterval: minorTicks[Math.min(1, minorTicks.length - 1)]
                .sub(minorTicks[0]),
            minorCount: minorTicks.length - 2,
            containerLength: majorTicks[majorTicks.length - 1]
                .sub(majorTicks[0])
                .toNumber(),
        };
    }

    private _resetAxisLengthInfo(axis: IAxisLengthLayoutInfo) {
        axis.majorInterval = k0;
        axis.majorCount = 0;
        axis.containerLength = 0;
        axis.containerLength$.setValue(0);
    }

    getLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            // Grid in back by default
            this.grid.layout,
            // Data above grid and below axes
            ...this.dataSources.map(d => d.layout),
            // Horizontal axes below vertical axes
            this.axes.bottomAxis.layout,
            this.axes.topAxis.layout,
            this.axes.rightAxis.layout,
            this.axes.leftAxis.layout,
        ].filter(s => !!s) as LayoutSource[];
    }

    /**
     * Returns the axis container's range at the
     * specified index.
     * 
     * @param location The location.
     * @param axisType The axis type.
     * @returns The grid container's range in content coordinates.
     */
    getAxisContainerRangeAtIndex(index: number, axisType: AxisType): [Decimal, Decimal] {
        let axis = this.axes[axisType];
        let interval = axis.majorInterval;
        let count = axis.majorCount;
        if (count === 0 || interval.lte(0)) {
            return [k0, k0];
        }
        let len = interval.mul(count);
        let start = new Decimal(index).mul(len);
        return [start, start.add(len)];
    }

    /**
     * Returns all ticks in the specified interval
     * for an axis.
     * 
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @param axisType The axis type.
     * @returns Tick locations.
     */
    getAxisTickLocations(
        start: Decimal.Value,
        end: Decimal.Value,
        axisType: AxisType,
    ): Decimal[] {
        let a = new Decimal(start);
        let b = new Decimal(end);

        if (a.gte(b)) {
            return [];
        }
        let axis = this.axes[axisType];
        let interval = axis.majorInterval;
        let count = axis.majorCount;
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
        this._visibleGridContainerIndexRange = visibleRange;
    }

    onAxisContainerDequeue(fromIndex: number, toIndex: number, axisType: AxisType) {
        // Move optimal axis 
        const axis = this.axes[axisType];
        if (axis.optimalThicknesses[fromIndex]) {
            axis.optimalThicknesses[toIndex] = axis.optimalThicknesses[fromIndex];
            delete axis.optimalThicknesses[fromIndex];
        }
    }

    private _createGrid(
        axes: AxisTypeMapping<IChartAxis>,
        props: LayoutEngineProps,
    ): IChartGrid {
        let {
            horizontalAxis,
            verticalAxis,
            ...otherProps
        } = props.grid || {};

        if (horizontalAxis && !isAxisType(horizontalAxis)) {
            throw new Error('Invalid axis type');
        }
        if (verticalAxis && !isAxisType(verticalAxis)) {
            throw new Error('Invalid axis type');
        }

        return {
            horizontalAxis,
            verticalAxis,
            layout: this._createGridLayout(axes, props),
        };
    }

    private _createGridLayout(
        axes: AxisTypeMapping<IChartAxis>,
        props: LayoutEngineProps,
    ): GridLayoutSource | undefined {
        let {
            horizontalAxis,
            verticalAxis,
            ...otherProps
        } = props.grid || {};
        return new GridLayoutSource({
            itemSize: view => ({
                x: horizontalAxis
                    ? axes[horizontalAxis].containerLength$
                    : view.containerSize$.x,
                y: verticalAxis
                    ? axes[verticalAxis].containerLength$
                    : view.containerSize$.y,
            }),
            ...otherProps,
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
            onVisibleRangeChange: r => this.onVisibleGridContainerRangeChange(r),
        });
    }

    private _createAxes(props: LayoutEngineProps): AxisTypeMapping<IChartAxis> {
        let axes: Partial<AxisTypeMapping<IChartAxis>> = {};
        for (let axisType of Object.keys(props.axes || {})) {
            if (!isAxisType(axisType)) {
                throw new Error(`Invalid axis type: ${axisType}`);
            }
            axes[axisType] = this._createAxis(axisType, props);
        }
        return axes as AxisTypeMapping<IChartAxis>;
    }

    private _createAxis(axisType: AxisType, props: LayoutEngineProps): IChartAxis {
        let {
            tickLocations = linearTicks,
        } = props.axes?.[axisType] || {};

        let axis: IChartAxis = {
            horizontal: isAxisHorizontal(axisType),
            majorInterval: k0,
            majorCount: 0,
            minorInterval: k0,
            minorCount: 0,
            containerLength: 0,
            containerLength$: new Animated.Value(0),
            negHalfMajorInterval$: new Animated.Value(0),
            thickness: 0,
            thicknessStep: kDefaultAxisThicknessStep,
            thickness$: new Animated.Value(0),
            optimalThicknesses: {},
            onOptimalThicknessChange: (thickness, index, chart) => (
                this.onOptimalAxisThicknessChange(thickness, index, axisType, chart)
            ),
            tickLocations,
        };
        axis.layout = this._createAxisLayoutSource(axisType, axis, props);
        return axis;
    }

    private _createAxisLayoutSource(axisType: AxisType, axis: IChartAxis, props: LayoutEngineProps): FlatLayoutSource | undefined {
        let axisProps = props.axes?.[axisType];
        if (!axisProps?.show) {
            return undefined;
        }

        let layoutPropsBase: FlatLayoutSourceProps = {
            itemSize: { x: axis.containerLength$, y: axis.containerLength$ },
            ...axisProps,
            shouldRenderItem: (item, previous) => {
                this.onAxisContainerDequeue(previous.index, item.index, axisType);
                return true;
            },
            reuseID: kAxisReuseIDs[axisType],
        };

        switch (axisType) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: {
                            x: axis.containerViewLength$ || 0,
                            y: this.axes[axisType].thickness$,
                        }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: axis.negHalfMajorInterval$,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'bottom',
                });
            case 'topAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: {
                            x: axis.containerViewLength$ || 0,
                            y: this.axes[axisType].thickness$,
                        }
                    }),
                    itemOrigin: { x: 0, y: 1 },
                    origin: {
                        x: axis.negHalfMajorInterval$,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'top',
                });
            case 'leftAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: {
                            x: this.axes[axisType].thickness$,
                            y: axis.containerViewLength$ || 0,
                        }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: 0,
                        y: axis.negHalfMajorInterval$,
                    },
                    horizontal: false,
                    stickyEdge: 'left',
                });
            case 'rightAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: {
                            x: this.axes[axisType].thickness$,
                            y: axis.containerViewLength$ || 0,
                        }
                    }),
                    itemOrigin: { x: 1, y: 0 },
                    origin: {
                        x: 0,
                        y: axis.negHalfMajorInterval$,
                    },
                    horizontal: false,
                    stickyEdge: 'right',
                });
        }
    }
}

// export const create = () => {
//     return new GridLayoutSource({

//     });
// };
