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
    AxisTypeMapping,
} from "evergrid";
import {
    kAxisReuseIDs,
    kAxisStyleLightDefaults,
} from '../const';
import { Chart } from "../internal";
import debounce from 'lodash.debounce';
import Decimal from "decimal.js";
import {
    IAxisLayoutSourceProps,
    IAxisOptions,
    IAxisStyle,
} from "../types";
import { IMatcher, isMatch } from "./comp";
import Scale, { ITickLocation } from "./Scale";
import LinearScale from "./LinearScale";

const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

const k0 = new Decimal(0);

export interface IAxisProps<T, D> extends Required<IAxisOptions<T, D>> {}

export type AxisManyInput = (Axis | IAxisOptions)[] | Partial<AxisTypeMapping<(Axis | IAxisOptions)>>;

interface IAxisLengthLayoutBaseInfo<D> {
    /** Number of major axis intervals per axis container. */
    majorCount: number;
    /** Major axis interval distance in content coordinates. */
    majorLocationInterval: Decimal;
    /** Major axis interval distance in value coordinates. */
    majorValueInterval: D;

    /** Number of minor axis intervals per axis container. */
    minorCount: number;
    /** Minor axis interval distance in content coordinates. */
    minorLocationInterval: Decimal;
    /** Minor axis interval distance in value coordinates. */
    minorValueInterval: D;

    /** Grid container length in content coordinates. */
    containerLength: number;
}

interface IAxisLengthLayoutInfo<D> extends IAxisLengthLayoutBaseInfo<D> {
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

interface IAxisLayoutInfo<D> extends IAxisLengthLayoutInfo<D>, IAxisWidthLayoutInfo {}

export default class Axis<T = any, D = T> implements IAxisProps<T, D> {
    axisType: AxisType;
    hidden: boolean;
    getTickLabel: IAxisProps<T, D>['getTickLabel'];
    scale: Scale<T, D>;
    layoutSourceDefaults: IAxisLayoutSourceProps;
    style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IAxisLayoutInfo<D>;
    layout?: FlatLayoutSource;

    constructor(axisType: AxisType, options?: IAxisOptions<T, D>) {
        let {
            hidden = false,
            getTickLabel = (tick: ITickLocation<any, any>) => String(tick.value),
            scale = new LinearScale(),
            layoutSourceDefaults = {},
            style = {},
        } = options || {};

        if (!isAxisType(axisType)) {
            throw new Error('Invalid axis type');
        }

        this.axisType = axisType;
        this.hidden = hidden;
        this.getTickLabel = getTickLabel;
        this.scale = scale as any;
        this.isHorizontal = isAxisHorizontal(this.axisType),

        this.layoutInfo = {
            majorLocationInterval: k0,
            majorCount: 0,
            majorValueInterval: this.scale.emptyInterval,
            minorLocationInterval: k0,
            minorValueInterval: this.scale.emptyInterval,
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

    static createMany<T = any>(input: AxisManyInput | undefined): Partial<AxisTypeMapping<Axis<T>>> {
        let axisArrayOrMap: any = input;
        if (!axisArrayOrMap) {
            return {};
        }

        // Validate and normalize axis types
        let axisOrOptionsArray: (Axis<T> | IAxisOptions<T> & { axisType?: AxisType })[] = [];
        let axisOrOption: Axis<T> | (IAxisOptions<T> & { axisType?: AxisType });
        if (typeof axisArrayOrMap[Symbol.iterator] === 'function') {
            axisOrOptionsArray = axisArrayOrMap;
        } else {
            let axisMap: { [key: string]: (Axis<T> | IAxisOptions<T>) } = axisArrayOrMap;
            for (let key of Object.keys(axisMap)) {
                axisOrOption = axisMap[key];
                if (!axisOrOption.axisType) {
                    if (isAxisType(key)) {
                        axisOrOption.axisType = key;
                    } else {
                        throw new Error('Invalid axis type');
                    }
                } else if (axisOrOption.axisType !== key) {
                    console.warn(`Axis with type "${axisOrOption.axisType}" was nested in a different key "${key}". Using the axis type property of the type. Use the same type inside the axis and outside to remove this warning.`);
                }
                axisOrOptionsArray.push(axisOrOption);
            }
        }

        let axis: Axis<T>;
        let axes: Partial<AxisTypeMapping<Axis<T>>> = {};
        for (axisOrOption of axisOrOptionsArray) {
            if (axisOrOption instanceof Axis) {
                axis = axisOrOption;
            } else {
                if (!axisOrOption.axisType) {
                    throw new Error('Axis is missing a type. Use an object with axis types as keys or use axis instances.');
                }
                axis = new Axis(axisOrOption.axisType, axisOrOption);
            }
            axes[axis.axisType] = axis;
        }
        return axes;
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

    encodeValue(value: T): Decimal {
        return value as any;
    }

    decodeValue(value: Decimal): T {
        return value as any;
    }

    update(view: Evergrid, updateOptions: IItemUpdateManyOptions): boolean {
        if (!this.layout) {
            return false;
        }

        let axisLengthInfo = this._getLengthInfo(view);
        let matchers = this._getScaleMatchers();
        if (!axisLengthInfo || isMatch(this, axisLengthInfo, matchers)) {
            // No changes
            return false;
        }

        Object.assign(this.layoutInfo, axisLengthInfo);
        this.layoutInfo.containerLength$.setValue(axisLengthInfo.containerLength);
        this.layoutInfo.negHalfMajorInterval$.setValue(
            axisLengthInfo.majorLocationInterval.div(2).neg().toNumber()
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

    getVisibleLocationRange(view: Evergrid): [number, number] {
        let r = this.layout!.getVisibleLocationRange(view);
        return this.isHorizontal
            ? [r[0].x, r[1].x]
            : [r[0].y, r[1].y];
    }

    getVisibleValueRange(view: Evergrid): [T, T] {
        return this.getVisibleLocationRange(view)
            .map(x => this.scale.decodeValue(new Decimal(x))) as [T, T];
    }

    private _getLengthInfo(view: Evergrid): IAxisLengthLayoutBaseInfo<D> | undefined {
        let scale = this.isHorizontal ? view.scale.x : view.scale.y;
        let visibleRange = this.getVisibleLocationRange(view);
        let visibleValueRange = visibleRange
            .map(x => this.scale.decodeValue(new Decimal(x))) as [T, T];

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
        let majorTicks = this.scale.getTickScale(
            visibleValueRange[0],
            visibleValueRange[1],
            {
                minInterval: majorDist.div(scale).abs(),
                expand: true,
            }
        );

        let majorStartTick = majorTicks[0];
        let majorEndTick = majorTicks[Math.min(1, majorTicks.length - 1)];
        let majorLocationInterval = majorEndTick.location.sub(majorStartTick.location);
        let majorValueInterval = majorStartTick.valueInterval;
        let majorLength = majorTicks[majorTicks.length - 1].location.sub(majorStartTick.location);

        let minorTicks = this.scale.getTickScale(
            majorStartTick.value,
            majorEndTick.value,
            {
                maxCount: new Decimal(this.style.minorIntervalCountMax),
                minInterval: minorDist.div(scale).abs(),
                expand: false,
            }
        );

        let minorStartTick = minorTicks[0];
        let minorEndTick = minorTicks[Math.min(1, minorTicks.length - 1)];
        let minorLocationInterval = minorEndTick.location.sub(minorStartTick.location);
        let minorValueInterval = minorStartTick.valueInterval;

        return {
            majorLocationInterval,
            majorValueInterval,
            majorCount: majorTicks.length - 1,
            minorLocationInterval,
            minorValueInterval,
            minorCount: minorTicks.length - 2,
            containerLength: majorLength.toNumber(),
        };
    }

    private _resetLengthInfo() {
        this.layoutInfo.majorLocationInterval = k0;
        this.layoutInfo.majorCount = 0;
        this.layoutInfo.containerLength = 0;
        this.layoutInfo.containerLength$.setValue(0);
    }

    private _getScaleMatchers(): IMatcher[] {
        return [
            this.scale.getValueMatcher(),
            this.scale.getIntervalMatcher(),
        ];
    }
    
    /**
     * Returns the axis container's range at the
     * specified index.
     * 
     * @param location The location.
     * @returns The grid container's range in content coordinates.
     */
    getContainerRangeAtIndex(index: number): [Decimal, Decimal] {
        let interval = this.layoutInfo.majorLocationInterval || k0;
        let count = this.layoutInfo.majorCount || 0;
        if (count === 0 || interval.lte(0)) {
            return [k0, k0];
        }
        let len = interval.mul(count);
        let start = new Decimal(index).mul(len);
        return [start, start.add(len)];
    }

    /**
     * Returns all ticks in the specified location
     * range
     * 
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @returns Tick locations.
     */
    getTicksInLocationRange(start: Decimal, end: Decimal): ITickLocation<T>[] {
        if (start.gte(end)) {
            return [];
        }
        let locationInterval = this.layoutInfo.majorLocationInterval || k0;
        let count = this.layoutInfo.majorCount || 0;
        if (count === 0 || locationInterval.lte(0)) {
            return [];
        }
        let valueInterval = this.layoutInfo.majorValueInterval;

        // Get all ticks in interval
        let startValue = this.scale.decodeValue(start);
        let tick: ITickLocation<T> = {
            value: startValue,
            valueInterval: valueInterval,
            location: start,
            locationInterval: locationInterval,
        };
        
        let ticks = [tick];
        for (let i = 0; i < count - 1; i++) {
            tick = this.scale.getNextTick(tick);
            ticks.push(tick);
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
