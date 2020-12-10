import {
    Animated,
} from "react-native";
import {
    isRangeEmpty,
    normalizeAnimatedValue,
    weakref,
} from "evergrid";
import Decimal from "decimal.js";
import Scale from "../scale/Scale";
import LinearScale from "../scale/LinearScale";
import { Plot } from "../internal";
import { 
    IAxisStyle,
    IAxisStyleInput,
} from "./axis/axisTypes";
import { kAxisStyleLightDefaults } from "./axis/axisConst";
import { Observable } from "../utils/observable";

const k0 = new Decimal(0);

export interface IScaleLayoutOptions<T = any, D = T> {
    /**
     * Customises the tick location.
     * Be default, linear ticks are used.
     */
    scale?: Scale<T, D>;
    style?: IAxisStyleInput;
    isHorizontal?: boolean;
}

export interface IScaleLayoutProps<T, D> extends Required<IScaleLayoutOptions<T, D>> {}

interface IScaleLayoutLengthBaseInfo {
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

interface IScaleLayoutInfo extends IScaleLayoutLengthBaseInfo {
    /** Animated axis container length in content coordinates. */
    readonly containerLength$: Animated.Value;
    /**
     * This value equals negative half of major
     * tick interval (in content coordinates).
     * 
     * This is used to syncronize the grid with labels.
     **/
    readonly negHalfMajorInterval$: Animated.Value;
}

export default class ScaleLayout<T = Decimal, D = T> implements IScaleLayoutProps<T, D> {
    scale: Scale<T, D>;
    /** If true, then the layout is detached from the standard grid. */
    custom = false;
    readonly style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IScaleLayoutInfo;
    updates = Observable.create();

    private _plotWeakRef = weakref<Plot>();

    constructor(options?: IScaleLayoutOptions<T, D>) {
        let {
            isHorizontal = false,
            scale = new LinearScale(),
            style = {},
        } = options || {};

        this.scale = scale as any;
        this.scale.minorTickDepth = 1;
        this.isHorizontal = isHorizontal,

        this.layoutInfo = {
            viewScale: 0,
            majorCount: 0,
            minorCount: 0,
            containerLength: 0,
            recenteringOffset: 0,
            containerLength$: new Animated.Value(0),
            negHalfMajorInterval$: new Animated.Value(0),
        };
        this.style = {
            ...kAxisStyleLightDefaults,
            ...style,
            padding: normalizeAnimatedValue(style.padding),
        };
    }

    get plot(): Plot {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: Plot) {
        if (!plot || !(plot instanceof Plot)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(plot: Plot) {
        this.plot = plot;
        this.custom = (plot.index.x !== 0 || plot.index.y !== 0);
    }

    unconfigure() {

    }

    update(): boolean {
        let axisLengthInfo = this._getLengthInfo();
        if (!axisLengthInfo) {
            // No changes
            return false;
        }
        // console.debug('tickScale: ' + JSON.stringify(this.scale.tickScale, null, 2));

        Object.assign(this.layoutInfo, axisLengthInfo);
        
        this.layoutInfo.containerLength$.setValue(axisLengthInfo.containerLength);

        let negHalfMajorInterval = this.scale.tickScale.interval.locationInterval.div(2).neg().toNumber();
        this.layoutInfo.negHalfMajorInterval$.setValue(negHalfMajorInterval);

        this.didChangeLayout();
        return true;
    }

    didChangeLayout() {
        this.updates.emit();
    }

    getVisibleLocationRange(): [number, number] {
        console.warn('TODO: scale layout needs plot rect, not chart rect');
        let r = this.plot.chart.getVisibleLocationRange();
        return this.isHorizontal
            ? [r[0].x, r[1].x]
            : [r[0].y, r[1].y];
    }

    private _getLengthInfo(): IScaleLayoutLengthBaseInfo | undefined {
        let viewScaleVector = this.plot.chart.scale;
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
        let scale = this.plot.chart.scale;
        return (this.isHorizontal ? scale.x : scale.y) < 0;
    }
}
