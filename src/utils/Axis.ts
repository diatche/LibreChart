import { Animated } from "react-native";
import Evergrid, {
    AxisType,
    FlatLayoutSource,
    FlatLayoutSourceProps,
    IItemUpdateManyOptions,
    zeroPoint,
    isRangeEmpty,
    isAxisHorizontal,
    isAxisType,
} from "evergrid";
import {
    kAxisReuseIDs,
    kAxisStyleLightDefaults,
} from '../const';
import { Chart } from "../internal";
import { linearTicks } from "./linearScale";
import debounce from 'lodash.debounce';
import Decimal from "decimal.js";
import {
    IAxisLayoutSourceProps,
    IAxisOptions,
    IAxisStyle,
} from "../types";
import { isMatch } from "./comp";
import { ITickConstraints } from "./baseScale";

const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

const k0 = new Decimal(0);

export interface IAxisProps extends Required<IAxisOptions> {}

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
    /**
     * Animated major axis interval negative half-distance
     * in content coordinates.
     * 
     * This is used to syncronize axes with the this.
     **/
    readonly negHalfMajorInterval$: Animated.Value;
    /** The currently visible container index ranges. */
    visibleContainerIndexRange: [number, number];
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
    onOptimalThicknessChange: (thickness: number, index: number) => void;
}

interface IAxisLayoutInfo extends IAxisLengthLayoutInfo, IAxisWidthLayoutInfo {}

export default class Axis implements IAxisProps {
    axisType: AxisType;
    hidden: boolean;
    getLabel: IAxisProps['getLabel'];
    tickGenerator: IAxisProps['tickGenerator'];
    defaultTickConstraints: ITickConstraints;
    layoutSourceDefaults: IAxisLayoutSourceProps;
    style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IAxisLayoutInfo;
    layout?: FlatLayoutSource;

    constructor(axisType: AxisType, options?: IAxisOptions) {
        let {
            hidden = false,
            getLabel = (value: Decimal) => value.toString(),
            tickGenerator = linearTicks,
            defaultTickConstraints = {},
            layoutSourceDefaults = {},
            style = {},
        } = options || {};

        if (!isAxisType(axisType)) {
            throw new Error('Invalid axis type');
        }

        this.axisType = axisType;
        this.hidden = hidden;
        this.getLabel = getLabel;
        this.tickGenerator = tickGenerator;
        this.defaultTickConstraints = defaultTickConstraints;
        this.isHorizontal = isAxisHorizontal(this.axisType),

        this.layoutInfo = {
            majorInterval: k0,
            majorCount: 0,
            minorInterval: k0,
            minorCount: 0,
            containerLength: 0,
            containerLength$: new Animated.Value(0),
            negHalfMajorInterval$: new Animated.Value(0),
            visibleContainerIndexRange: [0, 0],
            thickness: 0,
            thicknessStep: kDefaultAxisThicknessStep,
            thickness$: new Animated.Value(0),
            optimalThicknesses: {},
            onOptimalThicknessChange: (thickness, index) => (
                this.onOptimalThicknessChange(thickness, index)
            ),
        };
        this.style = {
            ...kAxisStyleLightDefaults,
            ...style,
        };
        this.layoutSourceDefaults = layoutSourceDefaults;


        if (!this.hidden) {
            this.layout = this._createLayoutSource(layoutSourceDefaults);
        }
    }

    private _createLayoutSource(defaults: IAxisLayoutSourceProps): FlatLayoutSource | undefined {
        let layoutPropsBase: FlatLayoutSourceProps = {
            itemSize: {
                x: this.layoutInfo.containerLength$,
                y: this.layoutInfo.containerLength$,
            },
            ...defaults,
            shouldRenderItem: (item, previous) => {
                this.onContainerDequeue(previous.index, item.index);
                return true;
            },
            reuseID: kAxisReuseIDs[this.axisType],
            onVisibleRangeChange: r => {
                this.layoutInfo.visibleContainerIndexRange = r;
            },
        };

        switch (this.axisType) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { y: this.layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: this.layoutInfo.negHalfMajorInterval$,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'bottom',
                });
            case 'topAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { y: this.layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 0, y: 1 },
                    origin: {
                        x: this.layoutInfo.negHalfMajorInterval$,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'top',
                });
            case 'leftAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { x: this.layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: 0,
                        y: this.layoutInfo.negHalfMajorInterval$,
                    },
                    horizontal: false,
                    stickyEdge: 'left',
                });
            case 'rightAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { x: this.layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 1, y: 0 },
                    origin: {
                        x: 0,
                        y: this.layoutInfo.negHalfMajorInterval$,
                    },
                    horizontal: false,
                    stickyEdge: 'right',
                });
        }
    }

    update(view: Evergrid, updateOptions: IItemUpdateManyOptions): boolean {
        if (!this.layout) {
            return false;
        }

        let axisLengthInfo = this._getLengthInfo(view);
        if (!axisLengthInfo || isMatch(this, axisLengthInfo)) {
            // No changes
            return false;
        }

        Object.assign(this.layoutInfo, axisLengthInfo);
        this.layoutInfo.containerLength$.setValue(axisLengthInfo.containerLength);
        this.layoutInfo.negHalfMajorInterval$.setValue(
            axisLengthInfo.majorInterval.div(2).neg().toNumber()
        );

        this.layout.updateItems(view, updateOptions);
        return true;
    }

    onOptimalThicknessChange(thickness: number, index: number) {
        // Save optimal thicknesses until an
        // update is triggered.

        // Apply thickness step
        thickness = Math.ceil(thickness / this.layoutInfo.thicknessStep) * this.layoutInfo.thicknessStep;

        if (thickness !== this.layoutInfo.optimalThicknesses[index]) {
            this.layoutInfo.optimalThicknesses[index] = thickness;
            this.scheduleThicknessUpdate();
        }
    }

    scheduleThicknessUpdate() {
        if (!this.layout) {
            return;
        }
        this._debouncedThicknessUpdate();
    }
    
    private _debouncedThicknessUpdate = debounce(
        () => this.updateThickness(),
        kAxisUpdateDebounceInterval,
    );

    updateThickness() {
        // Get optimal axis thickness
        let thickness = 0;
        for (let optimalThickness of Object.values(this.layoutInfo.optimalThicknesses)) {
            if (optimalThickness > thickness) {
                thickness = optimalThickness;
            }
        }

        thickness = Math.ceil(thickness / this.layoutInfo.thicknessStep) * this.layoutInfo.thicknessStep;

        if (thickness !== this.layoutInfo.thickness) {
            // Thickness changed
            this.layoutInfo.thickness = thickness;

            let duration = kAxisResizeDuration;
            if (duration > 0) {
                Animated.timing(this.layoutInfo.thickness$, {
                    toValue: thickness,
                    duration,
                    useNativeDriver: false,
                }).start();
            } else {
                this.layoutInfo.thickness$.setValue(thickness);
            }
        }

        this._cleanThicknessInfo();
    }

    private _cleanThicknessInfo() {
        // Remove hidden axis container indexes
        let visibleRange = this.layoutInfo.visibleContainerIndexRange;
        if (isRangeEmpty(visibleRange)) {
            return;
        }

        for (let key of Object.keys(this.layoutInfo.optimalThicknesses)) {
            let index = parseInt(key);
            if (index < visibleRange[0] || index >= visibleRange[1]) {
                delete this.layoutInfo.optimalThicknesses[index];
            }
        }
    }

    private _getLengthInfo(view: Evergrid): IAxisLengthLayoutBaseInfo | undefined {
        let scale = this.isHorizontal ? view.scale.x : view.scale.y;
        let visibleLocationRange = this.layout!.getVisibleLocationRange(view);
        let visibleRange: [number, number] = this.isHorizontal
            ? [visibleLocationRange[0].x, visibleLocationRange[1].x]
            : [visibleLocationRange[0].y, visibleLocationRange[1].y];

        if (isRangeEmpty(visibleRange)) {
            this._resetLengthInfo();
            return;
        }

        let {
            majorGridLineDistanceMin,
            minorGridLineDistanceMin,
        } = this.style;

        let majorDist = new Decimal(majorGridLineDistanceMin);
        let minorDist = new Decimal(minorGridLineDistanceMin);

        // Work out tick mark distance
        let majorTicks = this.tickGenerator(
            visibleRange[0],
            visibleRange[1],
            {
                ...this.defaultTickConstraints,
                minInterval: majorDist.div(scale).abs(),
                expand: true,
            }
        );

        let majorInterval = majorTicks[Math.min(1, majorTicks.length - 1)]
                .sub(majorTicks[0]);

        let minorTicks = this.tickGenerator(
            k0,
            majorInterval,
            {
                ...this.defaultTickConstraints,
                maxCount: this.style.minorIntervalCountMax,
                minInterval: minorDist.div(scale).abs(),
                expand: false,
            }
        );

        let minorInterval = minorTicks[Math.min(1, minorTicks.length - 1)]
            .sub(minorTicks[0]);

        return {
            majorInterval,
            majorCount: majorTicks.length - 1,
            minorInterval,
            minorCount: minorTicks.length - 2,
            containerLength: majorTicks[majorTicks.length - 1]
                .sub(majorTicks[0])
                .toNumber(),
        };
    }

    private _resetLengthInfo() {
        this.layoutInfo.majorInterval = k0;
        this.layoutInfo.majorCount = 0;
        this.layoutInfo.containerLength = 0;
        this.layoutInfo.containerLength$.setValue(0);
    }
    
    /**
     * Returns the axis container's range at the
     * specified index.
     * 
     * @param location The location.
     * @returns The grid container's range in content coordinates.
     */
    getContainerRangeAtIndex(index: number): [Decimal, Decimal] {
        let interval = this.layoutInfo.majorInterval || k0;
        let count = this.layoutInfo.majorCount || 0;
        if (count === 0 || interval.lte(0)) {
            return [k0, k0];
        }
        let len = interval.mul(count);
        let start = new Decimal(index).mul(len);
        return [start, start.add(len)];
    }

    /**
     * Returns all ticks in the specified interval
     * for an this.
     * 
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @returns Tick locations.
     */
    getTickLocations(start: Decimal.Value, end: Decimal.Value): Decimal[] {
        let a = new Decimal(start);
        let b = new Decimal(end);

        if (a.gte(b)) {
            return [];
        }
        let interval = this.layoutInfo.majorInterval || k0;
        let count = this.layoutInfo.majorCount || 0;
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
     * @param chart 
     */
    isInverted(chart: Chart) {
        let view = chart.innerView;
        if (!view) {
            return false;
        }
        let scale = this.layout?.getScale(view) || zeroPoint();
        return (this.isHorizontal ? scale.x : scale.y) < 0;
    }

    onContainerDequeue(fromIndex: number, toIndex: number) {
        // Move optimal axis 
        if (this.layoutInfo.optimalThicknesses[fromIndex]) {
            this.layoutInfo.optimalThicknesses[toIndex] = this.layoutInfo.optimalThicknesses[fromIndex];
            delete this.layoutInfo.optimalThicknesses[fromIndex];
        }
    }
}
