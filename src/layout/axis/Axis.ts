import { Animated, InteractionManager } from 'react-native';
import {
    FlatLayoutSource,
    FlatLayoutSourceProps,
    IItemUpdateManyOptions,
    isRangeEmpty,
    normalizeAnimatedValue,
    weakref,
} from 'evergrid';
import { WeakRef } from '@ungap/weakrefs/esm';
import {
    kAxisBackgroundReuseIDs,
    kAxisContentReuseIDs,
    kAxisStyleLightDefaults,
} from './axisConst';
import debounce from 'lodash.debounce';
import {
    AxisType,
    AxisTypeMapping,
    IAxisLayoutSourceProps,
    IAxisOptions,
    IAxisStyle,
} from './axisTypes';
import { ITickVector } from '../../scale/Scale';
import { PlotLayout } from '../../internal';
import { isAxisHorizontal, isAxisType } from './axisUtil';
import { Cancelable } from '../../types';
import ScaleLayout from '../ScaleLayout';
import { Observable } from '../../utils/observable';
import { PartialChartTheme } from '../../theme';

const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

let _idCounter = 0;

export interface IAxisProps<T> extends IAxisOptions<T> {}

export interface IAxisExtraOptions {
    axisType: AxisType;
    theme?: PartialChartTheme;
}

export type AsixInput<T = any> =
    | Axis<T>
    | (Partial<IAxisOptions<T>> & IAxisExtraOptions)
    | boolean
    | undefined;

export type AsixInputWithType<T = any> =
    | Axis
    | (Partial<IAxisOptions<T>> & Omit<IAxisExtraOptions, 'axisType'>);

export type AxisManyInput<X = any, Y = any, DX = any, DY = any> =
    | IAxes<X, Y, DX, DY>
    | IAxesOptionsMap<X, Y>
    | AsixInputWithType[];

export interface IAxes<X = any, Y = any, DX = any, DY = any> {
    topAxis?: Axis<X, DX>;
    bottomAxis?: Axis<X, DX>;
    leftAxis?: Axis<Y, DY>;
    rightAxis?: Axis<Y, DY>;
}

export interface IAxesOptionsMap<X = any, Y = any> {
    topAxis?: Partial<AsixInput<X>>;
    bottomAxis?: Partial<AsixInput<X>>;
    leftAxis?: Partial<AsixInput<Y>>;
    rightAxis?: Partial<AsixInput<Y>>;
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
    setOptimalThickness: (thickness: number, index: number) => void;
    /** The currently visible container index ranges. */
    visibleContainerIndexRange: [number, number];
}

export default class Axis<T = any, DT = any> implements IAxisProps<T> {
    axisType: AxisType;
    hidden: boolean;
    getTickLabel: IAxisProps<T>['getTickLabel'];
    onThicknessChange: IAxisProps<T>['onThicknessChange'];
    onOptimalThicknessChange: IAxisProps<T>['onOptimalThicknessChange'];
    layoutSourceDefaults: IAxisLayoutSourceProps;
    readonly style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IAxisLayoutInfo;

    /**
     * Contains axis ticks and labels.
     *
     * Always renders when dequeuing a container.
     */
    contentLayout?: FlatLayoutSource;

    /**
     * Contains background, axis and line.
     *
     * Nevers renders when dequeuing a container.
     */
    backgroundLayout?: FlatLayoutSource;

    private _plotWeakRef = weakref<PlotLayout>();
    private _scaleLayout?: ScaleLayout<T, DT>;
    private _scaleLayoutUpdates?: Observable.IObserver;

    private _syncedAxisRefs: { [syncId: string]: WeakRef<Axis> } = {};

    constructor(options: Partial<IAxisOptions<T>> & IAxisExtraOptions) {
        let {
            axisType,
            hidden = false,
            getTickLabel = (tick: ITickVector<T>) => String(tick.value),
            onOptimalThicknessChange,
            onThicknessChange,
            layoutSourceDefaults = {},
            style = {},
        } = options || {};

        if (!isAxisType(axisType)) {
            throw new Error('Invalid axis type');
        }

        this.axisType = axisType;
        this.hidden = hidden;
        this.getTickLabel = getTickLabel;
        this.onOptimalThicknessChange = onOptimalThicknessChange;
        this.onThicknessChange = onThicknessChange;
        (this.isHorizontal = isAxisHorizontal(this.axisType)),
            (this.layoutInfo = {
                thickness: 0,
                thicknessStep: kDefaultAxisThicknessStep,
                thickness$: new Animated.Value(0),
                optimalThicknesses: {},
                setOptimalThickness: (thickness, index) =>
                    this.setOptimalThickness(thickness, index),
                visibleContainerIndexRange: [0, 0],
            });
        this.style = {
            ...kAxisStyleLightDefaults,
            ...options.theme?.axis,
            ...style,
            padding: normalizeAnimatedValue(style.padding),
        };
        this.layoutSourceDefaults = layoutSourceDefaults;
    }

    static createMany(
        input: AxisManyInput | undefined,
        defaults?: Partial<IAxisOptions> & Omit<IAxisExtraOptions, 'axisType'>,
    ): IAxes {
        let axisArrayOrMap: any = input;
        if (!axisArrayOrMap) {
            return {};
        }

        // Validate and normalize axis types
        let axisOrOptionsArray: AsixInputWithType[] = [];
        let axisOrOption: AsixInputWithType;
        if (typeof axisArrayOrMap[Symbol.iterator] === 'function') {
            axisOrOptionsArray = axisArrayOrMap;
        } else {
            let axisMap: {
                [K in AxisType]: AsixInput;
            } = axisArrayOrMap;
            for (let key of Object.keys(axisMap)) {
                if (!isAxisType(key)) {
                    throw new Error('Invalid axis type');
                }
                let axisValue = axisMap[key];
                axisOrOption = {};
                if (typeof axisValue === 'object') {
                    if (axisValue instanceof Axis) {
                        axisOrOption = axisValue;
                    } else {
                        axisOrOption = { ...axisValue };
                    }
                } else if (typeof axisValue === 'boolean') {
                    if (!axisValue) {
                        continue;
                    }
                    axisOrOption = {};
                } else if (typeof axisValue === 'undefined') {
                    continue;
                } else {
                    throw new Error(`Invalid "${key}" axis configuration`);
                }
                if (!axisOrOption.axisType) {
                    axisOrOption.axisType = key;
                }
                if (axisOrOption.axisType !== key) {
                    console.warn(
                        `Axis with type "${axisOrOption.axisType}" was nested in a different key "${key}". Using the axis type property of the type. Use the same type inside the axis and outside to remove this warning.`,
                    );
                }
                axisOrOptionsArray.push(axisOrOption);
            }
        }

        let axis: Axis;
        let axes: Partial<AxisTypeMapping<Axis>> = {};
        for (axisOrOption of axisOrOptionsArray) {
            if (axisOrOption instanceof Axis) {
                axis = axisOrOption;
            } else {
                if (!axisOrOption.axisType) {
                    throw new Error(
                        'Axis is missing a type. Use an object with axis types as keys or use axis instances.',
                    );
                }
                axis = new Axis({
                    ...defaults,
                    ...axisOrOption,
                } as IAxisOptions & IAxisExtraOptions);
            }
            axes[axis.axisType] = axis;
        }
        return axes;
    }

    syncThickness(axis: Axis): string {
        const syncId = String(++_idCounter);
        this._syncThickness(axis, syncId);
        axis._syncThickness(this, syncId);
        return syncId;
    }

    private _syncThickness(axis: Axis, syncId: string) {
        this._syncedAxisRefs[syncId] = new WeakRef(axis);
    }

    unsyncThickness(syncId: string) {
        let axis = this._getSyncedAxis(syncId);
        this._unsyncThickness(syncId);
        if (axis) {
            axis._unsyncThickness(syncId);
        }
    }

    private _unsyncThickness(syncId: string) {
        if (syncId in this._syncedAxisRefs) {
            delete this._syncedAxisRefs[syncId];
            this.scheduleThicknessUpdate();
        }
    }

    private _getSyncedAxis(syncId: string): Axis | undefined {
        return this._syncedAxisRefs[syncId]?.deref();
    }

    private _getSyncedAxes(): Axis[] {
        return Object.keys(this._syncedAxisRefs)
            .map(syncId => this._getSyncedAxis(syncId))
            .filter(x => !!x) as Axis[];
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

    get scaleLayout(): ScaleLayout<T, DT> | undefined {
        return this._scaleLayout;
    }

    configure(plot: PlotLayout) {
        this.plot = plot;
        this._scaleLayout = this.isHorizontal ? plot.xLayout : plot.yLayout;

        if (!this.hidden) {
            this.contentLayout = this._createContentLayoutSource(
                this.layoutInfo,
                this.layoutSourceDefaults,
            );
            this.backgroundLayout = this._createBackgroundLayoutSource(
                this.layoutInfo,
                this.layoutSourceDefaults,
            );

            const updateOptions: IItemUpdateManyOptions = {
                visible: true,
                queued: true,
                forceRender: true,
            };
            this._scaleLayoutUpdates = this.scaleLayout?.updates.addObserver(
                () => this.update(updateOptions),
            );
        }
    }

    unconfigure() {
        this.contentLayout = undefined;
        this.backgroundLayout = undefined;

        this._scaleLayoutUpdates?.cancel();
        this._scaleLayoutUpdates = undefined;
    }

    private _createContentLayoutSource(
        layoutInfo: IAxisLayoutInfo,
        defaults: IAxisLayoutSourceProps,
    ): FlatLayoutSource | undefined {
        let options: IAxisLayoutSourceProps & FlatLayoutSourceProps = {
            ...defaults,
            ...this.plot.getLayoutSourceOptions(),
            reuseID: kAxisContentReuseIDs[this.axisType],
            shouldRenderItem: (item, previous) => {
                this.onContainerDequeue(previous.index, item.index);
                return true;
            },
        };

        return this._createLayoutSource(layoutInfo, options);
    }

    private _createBackgroundLayoutSource(
        layoutInfo: IAxisLayoutInfo,
        defaults: IAxisLayoutSourceProps,
    ): FlatLayoutSource | undefined {
        return this._createLayoutSource(layoutInfo, {
            ...defaults,
            ...this.plot.getLayoutSourceOptions(),
            reuseID: kAxisBackgroundReuseIDs[this.axisType],
            shouldRenderItem: () => false,
            onVisibleRangeChange: r => {
                this.layoutInfo.visibleContainerIndexRange = r;
            },
        });
    }

    private _createLayoutSource(
        layoutInfo: IAxisLayoutInfo,
        defaults: IAxisLayoutSourceProps & FlatLayoutSourceProps,
    ): FlatLayoutSource | undefined {
        let layoutPropsBase = defaults;
        let thickness = Animated.add(this.style.padding, layoutInfo.thickness$);

        switch (this.axisType) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: itemViewLayout => {
                        itemViewLayout.size.y = thickness;
                    },
                    stickyEdge: 'bottom',
                    horizontal: true,
                });
            case 'topAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: itemViewLayout => {
                        itemViewLayout.size.y = thickness;
                    },
                    stickyEdge: 'top',
                    horizontal: true,
                });
            case 'leftAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: itemViewLayout => {
                        itemViewLayout.size.x = thickness;
                    },
                    stickyEdge: 'left',
                    horizontal: false,
                });
            case 'rightAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: itemViewLayout => {
                        itemViewLayout.size.x = thickness;
                    },
                    stickyEdge: 'right',
                    horizontal: false,
                });
        }
    }

    update(updateOptions: IItemUpdateManyOptions) {
        if (this.contentLayout || this.backgroundLayout) {
            this.willUpdateLayout();
            this.contentLayout?.updateItems(updateOptions);
            this.backgroundLayout?.updateItems(updateOptions);
        }
    }

    willUpdateLayout() {}

    setOptimalThickness(thickness: number, index: number) {
        // Save optimal thicknesses until an
        // update is triggered.

        // Apply thickness step
        thickness = this.cleanThickness(thickness);

        if (thickness !== this.layoutInfo.optimalThicknesses[index]) {
            let previousThickness = this.layoutInfo.optimalThicknesses[index];
            this.layoutInfo.optimalThicknesses[index] = thickness;
            this.scheduleThicknessUpdate();
            this.onOptimalThicknessChange?.(thickness, previousThickness);
        }
    }

    scheduleThicknessUpdate() {
        if (!this.contentLayout || this._scheduledThicknessUpdate) {
            return;
        }
        this._scheduledThicknessUpdate = InteractionManager.runAfterInteractions(
            () => this._debouncedThicknessUpdate(),
        );
    }

    cancelThicknessUpdate() {
        if (this._scheduledThicknessUpdate) {
            this._scheduledThicknessUpdate.cancel();
            this._scheduledThicknessUpdate = undefined;
        }
        this._debouncedThicknessUpdate.cancel();
    }

    private _debouncedThicknessUpdate = debounce(
        () => this.updateThickness(),
        kAxisUpdateDebounceInterval,
    );

    private _scheduledThicknessUpdate?: Cancelable;

    /** Apply thickness step. */
    cleanThickness(thickness: number): number {
        return (
            Math.ceil(thickness / this.layoutInfo.thicknessStep) *
            this.layoutInfo.thicknessStep
        );
    }

    private _resolveOwnOptimalThickness() {
        let thickness = 0;
        for (let optimalThickness of Object.values(
            this.layoutInfo.optimalThicknesses,
        )) {
            if (optimalThickness > thickness) {
                thickness = optimalThickness;
            }
        }
        return thickness;
    }

    updateThickness() {
        this.cancelThicknessUpdate();

        // Get optimal axis thickness
        let thickness = this._resolveOwnOptimalThickness();
        const syncedAxes = this._getSyncedAxes();
        for (let axis of syncedAxes) {
            let axisThickness = axis._resolveOwnOptimalThickness();
            if (axisThickness > thickness) {
                thickness = axisThickness;
            }
        }

        thickness = this.cleanThickness(thickness);

        if (thickness !== this.layoutInfo.thickness) {
            // Thickness changed
            let previousThickness = this.layoutInfo.thickness;
            this.layoutInfo.thickness = thickness;

            let duration = kAxisResizeDuration;
            if (duration > 0) {
                Animated.timing(this.layoutInfo.thickness$, {
                    toValue: thickness,
                    duration,
                    useNativeDriver: false,
                }).start(() => {
                    this.plot.didChangePlotSize();
                });
            } else {
                this.layoutInfo.thickness$.setValue(thickness);
            }

            this.onThicknessChange?.(thickness, previousThickness);

            for (let axis of syncedAxes) {
                axis.updateThickness();
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

    onContainerDequeue(fromIndex: number, toIndex: number) {
        // Move optimal axis
        if (this.layoutInfo.optimalThicknesses[fromIndex]) {
            this.layoutInfo.optimalThicknesses[
                toIndex
            ] = this.layoutInfo.optimalThicknesses[fromIndex];
            delete this.layoutInfo.optimalThicknesses[fromIndex];
        }
    }
}
