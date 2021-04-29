import { Animated, InteractionManager } from 'react-native';
import { isRangeEmpty, weakref } from 'evergrid';
import Scale from '../scale/Scale';
import LinearScale from '../scale/LinearScale';
import { Cancelable, PlotLayout } from '../internal';
import { IAxisStyle, IAxisStyleInput } from './axis/axisTypes';
import { kAxisStyleLightDefaults } from './axis/axisConst';
import { Observable } from '../utils/observable';
import ScaleController from '../scaleControllers/ScaleController';
import DiscreteScale from '../scale/DiscreteScale';
import AutoScaleController from '../scaleControllers/AutoScaleController';
import _ from 'lodash';
import { mergeAxisStyles } from './axis/axisUtil';
import debounce from 'lodash.debounce';

const kUpdateDebounceInterval = 100;

export interface IScaleLayoutOptions<T = any, D = T> {
    /**
     * Customises the tick location.
     * Be default, linear ticks are used.
     */
    scale?: Scale<T, D>;
    controller?: ScaleController<T, D>;
    style?: IAxisStyleInput;
    isHorizontal?: boolean;
}

interface IScaleLayoutLengthBaseInfo {
    /** Number of major axis intervals per axis container. */
    majorCount: number;

    /** Number of minor axis intervals per major axis interval. */
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
     * This value equals one major
     * tick interval (in content coordinates).
     *
     * This is used to syncronize the grid with labels.
     **/
    readonly majorInterval$: Animated.Value;

    /**
     * This value equals one major
     * tick interval (in view coordinates).
     *
     * This is used to syncronize the grid with labels.
     **/
    majorViewInterval$?: Animated.AnimatedInterpolation;

    /**
     * This value equals negative half of major
     * tick interval (in content coordinates).
     *
     * This is used to syncronize the grid with labels.
     *
     * @deprecated Use majorInterval$ instead.
     **/
    readonly negHalfMajorInterval$: Animated.Value;

    /**
     * This value equals negative half of major
     * tick interval (in view coordinates).
     *
     * This is used to syncronize the grid with labels.
     *
     * @deprecated Use majorViewInterval$ instead.
     **/
    negHalfMajorViewInterval$?: Animated.AnimatedInterpolation;
}

export default class ScaleLayout<T = number, D = T> {
    scale: Scale<T, D>;
    readonly controller?: ScaleController<T, D>;
    /** If true, then the layout is detached from the standard grid. */
    custom = false;
    readonly style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IScaleLayoutInfo;
    updates = Observable.create();

    private _plotWeakRef = weakref<PlotLayout>();
    private _isHorizontalStrict = false;

    constructor(options?: IScaleLayoutOptions<T, D>) {
        let {
            isHorizontal = false,
            scale = new LinearScale(),
            style = {},
            controller,
        } = options || {};

        this._isHorizontalStrict = typeof options?.isHorizontal !== 'undefined';

        this.scale = scale as any;
        this.scale.minorTickDepth = 1;
        this.isHorizontal = isHorizontal;

        this.layoutInfo = {
            viewScale: 0,
            majorCount: 0,
            minorCount: 0,
            containerLength: 0,
            recenteringOffset: 0,
            containerLength$: new Animated.Value(0),
            majorInterval$: new Animated.Value(0),
            negHalfMajorInterval$: new Animated.Value(0),
        };
        this.style = mergeAxisStyles(kAxisStyleLightDefaults, style);

        if (!controller && scale instanceof DiscreteScale) {
            controller = new AutoScaleController({
                viewPaddingRel: 0.1,
            });
        }
        this.controller = controller;
    }

    get plot(): PlotLayout {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: PlotLayout) {
        if (!plot || !(plot instanceof PlotLayout)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(
        plot: PlotLayout,
        config: {
            isHorizontal: boolean;
        }
    ) {
        this.plot = plot;
        if (
            this._isHorizontalStrict &&
            this.isHorizontal !== config.isHorizontal
        ) {
            throw new Error('Scale layout direction mismatch');
        }
        this.isHorizontal = config.isHorizontal;
        this.custom = plot.index.x !== 0 || plot.index.y !== 0;

        let majorViewInterval = Animated.multiply(
            this.layoutInfo.majorInterval$,
            this.plot.scale$[this.isHorizontal ? 'x' : 'y']
        );
        this.layoutInfo.majorViewInterval$ = majorViewInterval;

        let negHalfMajorViewInterval = Animated.multiply(
            this.layoutInfo.negHalfMajorInterval$,
            this.plot.scale$[this.isHorizontal ? 'x' : 'y']
        );
        this.layoutInfo.negHalfMajorViewInterval$ = negHalfMajorViewInterval;

        this.controller?.configure(this);
    }

    unconfigure() {
        this.controller?.unconfigure();
    }

    setNeedsUpdate() {
        if (this._scheduledUpdate) {
            return;
        }

        this._scheduledUpdate = InteractionManager.runAfterInteractions(() =>
            this._debouncedUpdate()
        );
    }

    cancelUpdate() {
        if (this._scheduledUpdate) {
            this._scheduledUpdate.cancel();
            this._scheduledUpdate = undefined;
        }
        this._debouncedUpdate.cancel();
    }

    private _scheduledUpdate?: Cancelable;

    private _debouncedUpdate = debounce(
        () => this.update(),
        kUpdateDebounceInterval
    );

    update(): boolean {
        this.cancelUpdate();

        let axisLengthInfo = this._getNewLengthInfo();
        if (!axisLengthInfo) {
            // No changes
            return false;
        }
        // console.debug(
        //     `axisLengthInfo ${this.isHorizontal ? 'H' : 'V'}: ` +
        //         JSON.stringify(axisLengthInfo, null, 2)
        // );

        Object.assign(this.layoutInfo, axisLengthInfo);

        this.layoutInfo.containerLength$.setValue(
            axisLengthInfo.containerLength
        );

        let majorInterval = this.scale.tickScale.interval.location;
        this.layoutInfo.majorInterval$.setValue(majorInterval);
        this.layoutInfo.negHalfMajorInterval$.setValue(-majorInterval / 2);

        this.didChangeLayout();
        return true;
    }

    didChangeLayout() {
        this.updates.emit();
    }

    getVisibleLocationRange(): [number, number] {
        let plot = this.plot;
        let insets = plot.getAxisInsets();
        let r = plot.getVisibleLocationRange({ insets });
        return this.isHorizontal ? [r[0].x, r[1].x] : [r[0].y, r[1].y];
    }

    private _getNewLengthInfo(): IScaleLayoutLengthBaseInfo | undefined {
        let viewScaleVector = this.plot.scale;
        let viewScale = this.isHorizontal
            ? viewScaleVector.x
            : viewScaleVector.y;
        let visibleRange = this.getVisibleLocationRange();

        if (isRangeEmpty(visibleRange)) {
            this._resetLengthInfo();
            return undefined;
        }

        let { majorGridLineDistanceMin, minorGridLineDistanceMin } = this.style;

        let majorDist = majorGridLineDistanceMin;
        let minorDist = minorGridLineDistanceMin;

        let startLocation = visibleRange[0];
        let endLocation = visibleRange[1];
        let midLocation = (startLocation + endLocation) / 2;
        let startValue = this.scale.valueAtLocation(startLocation);
        let midValue = this.scale.valueAtLocation(midLocation);
        let endValue = this.scale.valueAtLocation(endLocation);

        // Update tick scale
        let scaleUpdated = this.scale.updateTickScale(startValue, endValue, {
            minInterval: {
                location: Math.abs(majorDist / viewScale),
            },
            expand: true,
            minorTickConstraints: [
                {
                    minInterval: {
                        location: Math.abs(minorDist / viewScale),
                    },
                    maxCount: this.style.minorIntervalCountMax,
                },
            ],
        });
        if (!scaleUpdated && this.layoutInfo.majorCount !== 0) {
            return undefined;
        }

        // Count ticks
        let valueRange = this.scale.spanValueRange(startValue, endValue);
        let majorCount = this.scale.countTicksInValueRange(
            valueRange[0],
            valueRange[1]
        );
        let minorCount = 0;
        let minorInterval = this.scale.minorTickScales[0].interval.location;
        if (majorCount && minorInterval !== 0) {
            minorCount =
                Math.round(
                    this.scale.tickScale.interval.location / minorInterval
                ) - 1;
        }

        // Get container length
        let locationRange = this.scale.spanLocationRange(
            startLocation,
            endLocation
        );
        let containerLength = locationRange[1] - locationRange[0];

        // Check if recentering is needed
        let newMidLocation = this.scale.locationOfValue(midValue);
        let recenteringOffset =
            Math.round((midLocation - newMidLocation) / viewScale) * viewScale;

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
    getContainerRangeAtIndex(index: number): [number, number] {
        let interval = this.scale.tickScale.interval.location;
        let count = this.layoutInfo.majorCount || 0;
        if (count === 0 || interval <= 0) {
            return [0, 0];
        }
        let len = interval * count;
        let start = len * index;
        return [start, start + len];
    }

    /**
     * Returns `true` if the axis has a negative scale.
     */
    isInverted() {
        let scale = this.plot.scale;
        return (this.isHorizontal ? scale.x : scale.y) < 0;
    }
}
