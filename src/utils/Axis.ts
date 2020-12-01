import { Animated } from "react-native";
import {
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
import debounce from 'lodash.debounce';
import Decimal from "decimal.js";
import {
    IAxisLayoutSourceProps,
    IAxisOptions,
    IAxisStyle,
} from "../types";
import Scale, { ITickLocation } from "./Scale";
import LinearScale from "./LinearScale";

const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

const k0 = new Decimal(0);

export interface IAxisProps<T, D> extends Required<IAxisOptions<T, D>> {}

export type AxisManyInput = (Axis | IAxisOptions)[] | Partial<AxisTypeMapping<(Axis | IAxisOptions)>>;

interface IAxisLengthLayoutBaseInfo {
    /** Number of major axis intervals per axis container. */
    majorCount: number;

    /** Number of minor axis intervals per axis container. */
    minorCount: number;

    /** Grid container length in content coordinates. */
    containerLength: number;

    /** The view scale with which the layout was calculated. */
    viewScale: number;

    /**
     * The distance (in content coordinates) to offset the
     * viewport to preserve the current visible content
     * after update. This is applied automatically.
     **/
    recenteringOffset: number;
}

interface IAxisLengthLayoutInfo extends IAxisLengthLayoutBaseInfo {
    /** Animated axis container length in content coordinates. */
    readonly containerLength$: Animated.Value;
    /**
     * This value equals negative half of major
     * tick interval (in content coordinates).
     * 
     * This is used to syncronize the grid with labels.
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

export default class Axis<T = Decimal, D = T> implements IAxisProps<T, D> {
    axisType: AxisType;
    hidden: boolean;
    getTickLabel: IAxisProps<T, D>['getTickLabel'];
    scale: Scale<T, D>;
    layoutSourceDefaults: IAxisLayoutSourceProps;
    style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IAxisLayoutInfo;
    layout?: FlatLayoutSource;

    constructor(axisType: AxisType, options?: IAxisOptions<T, D>) {
        let {
            hidden = false,
            getTickLabel = (tick: ITickLocation<any>) => String(tick.value),
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
        this.scale.minorTickDepth = 1;
        this.isHorizontal = isAxisHorizontal(this.axisType),

        this.layoutInfo = {
            viewScale: 0,
            majorCount: 0,
            minorCount: 0,
            containerLength: 0,
            recenteringOffset: 0,
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
            this.layout = this._createLayoutSource(
                this.layoutInfo,
                layoutSourceDefaults,
            );
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

    private _createLayoutSource(
        layoutInfo: IAxisLayoutInfo,
        defaults: IAxisLayoutSourceProps,
    ): FlatLayoutSource | undefined {
        let layoutPropsBase: FlatLayoutSourceProps = {
            itemSize: {
                x: layoutInfo.containerLength$,
                y: layoutInfo.containerLength$,
            },
            ...defaults,
            shouldRenderItem: (item, previous) => {
                this.onContainerDequeue(previous.index, item.index);
                return true;
            },
            reuseID: kAxisReuseIDs[this.axisType],
            onVisibleRangeChange: r => {
                layoutInfo.visibleContainerIndexRange = r;
            },
        };

        switch (this.axisType) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { y: layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: layoutInfo.negHalfMajorInterval$,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'bottom',
                });
            case 'topAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { y: layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 0, y: 1 },
                    origin: {
                        x: layoutInfo.negHalfMajorInterval$,
                        y: 0,
                    },
                    horizontal: true,
                    stickyEdge: 'top',
                });
            case 'leftAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { x: layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 0, y: 0 },
                    origin: {
                        x: 0,
                        y: layoutInfo.negHalfMajorInterval$,
                    },
                    horizontal: false,
                    stickyEdge: 'left',
                });
            case 'rightAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    getItemViewLayout: () => ({
                        size: { x: layoutInfo.thickness$ }
                    }),
                    itemOrigin: { x: 1, y: 0 },
                    origin: {
                        x: 0,
                        y: layoutInfo.negHalfMajorInterval$,
                    },
                    horizontal: false,
                    stickyEdge: 'right',
                });
        }
    }

    // locationOfValue(value: T): Decimal {
    //     return value as any;
    // }

    // valueAtLocation(value: Decimal): T {
    //     return value as any;
    // }

    update(updateOptions: IItemUpdateManyOptions): boolean {
        if (!this.layout) {
            return false;
        }

        let axisLengthInfo = this._getLengthInfo();
        if (!axisLengthInfo) {
            // No changes
            return false;
        }

        Object.assign(this.layoutInfo, axisLengthInfo);
        
        this.layoutInfo.containerLength$.setValue(axisLengthInfo.containerLength);

        let negHalfMajorInterval = this.scale.tickScale.interval.locationInterval.div(2).neg().toNumber();
        this.layoutInfo.negHalfMajorInterval$.setValue(negHalfMajorInterval);

        if (this.layoutInfo.recenteringOffset) {
            // FIXME: We are assuming that the axis controls
            // the chart, but this may be an independent axis.
            this.layout.root.scrollBy({
                offset: this.isHorizontal
                    ? { x: this.layoutInfo.recenteringOffset }
                    : { y: this.layoutInfo.recenteringOffset },
            });
        }

        this.layout.updateItems(updateOptions);
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

    getVisibleLocationRange(): [number, number] {
        let r = this.layout!.getVisibleLocationRange();
        return this.isHorizontal
            ? [r[0].x, r[1].x]
            : [r[0].y, r[1].y];
    }

    private _getLengthInfo(): IAxisLengthLayoutBaseInfo | undefined {
        if (!this.layout) {
            return undefined;
        }
        let viewScaleVector = this.layout.getScale();
        let viewScale = this.isHorizontal ? viewScaleVector.x : viewScaleVector.y;
        let visibleRange = this.getVisibleLocationRange();

        if (isRangeEmpty(visibleRange)) {
            this._resetLengthInfo();
            return undefined;
        }
        
        let {
            majorGridLineDistanceMin,
            minorGridLineDistanceMin,
        } = this.style;
        
        let majorDist = new Decimal(majorGridLineDistanceMin);
        let minorDist = new Decimal(minorGridLineDistanceMin);

        let startLocation = new Decimal(visibleRange[0]);
        let endLocation = new Decimal(visibleRange[1]);
        let midLocation = startLocation.add(endLocation).div(2);
        let startValue = this.scale.valueAtLocation(startLocation);
        let midValue = this.scale.valueAtLocation(midLocation);
        let endValue = this.scale.valueAtLocation(endLocation);

        // Update tick scale
        let scaleUpdated = this.scale.updateTickScale(
            startValue,
            endValue,
            {
                minInterval: {
                    locationInterval: majorDist.div(viewScale).abs(),
                },
                expand: true,
                minorTickConstraints: [{
                    minInterval: {
                        locationInterval: minorDist.div(viewScale).abs(),
                    },
                    maxCount: new Decimal(this.style.minorIntervalCountMax),
                }],
            }
        );
        if (!scaleUpdated) {
            return undefined;
        }
        
        // Count ticks
        let valueRange = this.scale.spanValueRange(
            startValue,
            endValue,
        );
        let majorCount = this.scale.countTicksInValueRange(
            valueRange[0],
            valueRange[1],
        );
        let minorCount = 0;
        let minorInterval = this.scale.minorTickScales[0].interval.locationInterval;
        if (majorCount && !minorInterval.isZero()) {
            minorCount = this.scale.tickScale.interval.locationInterval
                .div(minorInterval)
                .round()
                .toNumber() - 1;
        }

        // Get container length
        let locationRange = this.scale.spanLocationRange(
            startLocation,
            endLocation,
        );
        let containerLength = locationRange[1].sub(locationRange[0]).toNumber();

        // Check if recentering is needed
        let newMidLocation = this.scale.locationOfValue(midValue);
        let recenteringOffset = midLocation
            .sub(newMidLocation)
            .div(viewScale)
            .round()
            .mul(viewScale)
            .toNumber();

        return {
            majorCount,
            minorCount,
            containerLength,
            viewScale,
            recenteringOffset,
        };
    }

    private _resetLengthInfo() {
        this.layoutInfo.majorCount = 0;
        this.layoutInfo.minorCount = 0;
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
        let interval = this.scale.tickScale.interval.locationInterval;
        let count = this.layoutInfo.majorCount || 0;
        if (count === 0 || interval.lte(0)) {
            return [k0, k0];
        }
        let len = interval.mul(count);
        let start = len.mul(index);
        return [start, start.add(len)];
    }

    /**
     * Returns `true` if the axis has a negative scale.
     */
    isInverted() {
        let scale = this.layout?.getScale() || zeroPoint();
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
