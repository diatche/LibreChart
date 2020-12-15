import {
    Animated,
    InteractionManager,
} from "react-native";
import {
    FlatLayoutSource,
    FlatLayoutSourceProps,
    IItemUpdateManyOptions,
    isRangeEmpty,
    normalizeAnimatedValue,
    weakref,
} from "evergrid";
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
} from "./axisTypes";
import { ITickLocation } from "../../scale/Scale";
import { PlotLayout } from "../../internal";
import {
    isAxisHorizontal,
    isAxisType,
} from "./axisUtil";
import { Cancelable } from "../../types";
import ScaleLayout from "../ScaleLayout";

const kAxisUpdateDebounceInterval = 100;
const kAxisResizeDuration = 200;
const kDefaultAxisThicknessStep = 10;

export interface IAxisProps<T> extends Required<IAxisOptions<T>> {}

export type AxisManyInput = (Axis | IAxisOptions)[] | Partial<AxisTypeMapping<(Axis | IAxisOptions)>>;

export interface IAxes<X = any, Y = any, DX = any, DY = any> {
    topAxis?: Axis<X, DX>;
    bottomAxis?: Axis<X, DX>;
    leftAxis?: Axis<Y, DY>;
    rightAxis?: Axis<Y, DY>;
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
    onOptimalThicknessChange: (thickness: number, index: number) => void;
    /** The currently visible container index ranges. */
    visibleContainerIndexRange: [number, number];
}

export default class Axis<T = any, DT = any> implements IAxisProps<T> {
    axisType: AxisType;
    hidden: boolean;
    getTickLabel: IAxisProps<T>['getTickLabel'];
    layoutSourceDefaults: IAxisLayoutSourceProps;
    readonly style: IAxisStyle;
    isHorizontal: boolean;
    layoutInfo: IAxisLayoutInfo;

    /**
     * Contains axis labels.
     * 
     * Always renders when dequeuing a container.
     */
    contentLayout?: FlatLayoutSource;

    /**
     * Contains background, axis line and ticks.
     * 
     * Nevers renders when dequeuing a container.
     */
    backgroundLayout?: FlatLayoutSource;

    private _plotWeakRef = weakref<PlotLayout>();
    private _scaleLayout?: ScaleLayout<T, DT>;
    private _scaleLayoutUpdates = 0;

    constructor(axisType: AxisType, options?: IAxisOptions<T>) {
        let {
            hidden = false,
            getTickLabel = (tick: ITickLocation<T>) => String(tick.value),
            layoutSourceDefaults = {},
            style = {},
        } = options || {};

        if (!isAxisType(axisType)) {
            throw new Error('Invalid axis type');
        }

        this.axisType = axisType;
        this.hidden = hidden;
        this.getTickLabel = getTickLabel;
        this.isHorizontal = isAxisHorizontal(this.axisType),

        this.layoutInfo = {
            thickness: 0,
            thicknessStep: kDefaultAxisThicknessStep,
            thickness$: new Animated.Value(0),
            optimalThicknesses: {},
            onOptimalThicknessChange: (thickness, index) => (
                this.onOptimalThicknessChange(thickness, index)
            ),
            visibleContainerIndexRange: [0, 0],
        };
        this.style = {
            ...kAxisStyleLightDefaults,
            ...style,
            padding: normalizeAnimatedValue(style.padding),
        };
        this.layoutSourceDefaults = layoutSourceDefaults;
    }

    static createMany(input: AxisManyInput | undefined): IAxes {
        let axisArrayOrMap: any = input;
        if (!axisArrayOrMap) {
            return {};
        }

        // Validate and normalize axis types
        let axisOrOptionsArray: (Axis | IAxisOptions & { axisType?: AxisType })[] = [];
        let axisOrOption: Axis | (IAxisOptions & { axisType?: AxisType });
        if (typeof axisArrayOrMap[Symbol.iterator] === 'function') {
            axisOrOptionsArray = axisArrayOrMap;
        } else {
            let axisMap: { [key: string]: (Axis | IAxisOptions) } = axisArrayOrMap;
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

        let axis: Axis;
        let axes: Partial<AxisTypeMapping<Axis>> = {};
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
        this._scaleLayout = this.isHorizontal
            ? plot.xLayout
            : plot.yLayout;

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
                () => this.update(updateOptions)
            ) || 0;
        }
    }

    unconfigure() {
        this.contentLayout = undefined;
        this.backgroundLayout = undefined;
        
        this.scaleLayout?.updates.removeObserver(this._scaleLayoutUpdates);
        this._scaleLayoutUpdates = 0;
    }

    private _createContentLayoutSource(
        layoutInfo: IAxisLayoutInfo,
        defaults: IAxisLayoutSourceProps,
    ): FlatLayoutSource | undefined {
        let options: IAxisLayoutSourceProps & FlatLayoutSourceProps = {
            ...defaults,
            reuseID: kAxisContentReuseIDs[this.axisType],
            shouldRenderItem: (item, previous) => {
                this.onContainerDequeue(previous.index, item.index);
                return true;
            },
        };

        switch (this.axisType) {
            case 'bottomAxis':
            case 'topAxis':
                options.origin = {
                    x: this.scaleLayout?.layoutInfo.negHalfMajorInterval$,
                    y: 0,
                };
                break;
            case 'leftAxis':
            case 'rightAxis':
                options.origin = {
                    x: 0,
                    y: this.scaleLayout?.layoutInfo.negHalfMajorInterval$,
                };
                break;
        }

        return this._createLayoutSource(layoutInfo, options);
    }

    private _createBackgroundLayoutSource(
        layoutInfo: IAxisLayoutInfo,
        defaults: IAxisLayoutSourceProps,
    ): FlatLayoutSource | undefined {
        return this._createLayoutSource(layoutInfo, {
            ...defaults,
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
        let plot = this.plot;
        let plotLayout = plot.getLayout$();
        let layoutPropsBase: FlatLayoutSourceProps = {
            ...plot.getLayoutSourceOptions(plotLayout),
            ...defaults,
        };
        let thickness = Animated.add(
            this.style.padding,
            layoutInfo.thickness$,
        );

        switch (this.axisType) {
            case 'bottomAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: (i, layout, source) => {
                        layout.offset.y = Animated.subtract(
                            plotLayout.size.y,
                            thickness,
                        );
                        layout.size.y = thickness;
                    },
                    horizontal: true,
                });
            case 'topAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: (i, layout) => {
                        layout.offset.y = new Animated.Value(0);
                        layout.size.y = thickness;
                    },
                    horizontal: true,
                });
            case 'leftAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: (i, layout) => {
                        layout.offset.x = new Animated.Value(0);
                        layout.size.x = thickness;
                    },
                    horizontal: false,
                });
            case 'rightAxis':
                return new FlatLayoutSource({
                    ...layoutPropsBase,
                    willUseItemViewLayout: (i, layout, source) => {
                        layout.offset.x = Animated.subtract(
                            plotLayout.size.x,
                            thickness,
                        );
                        layout.size.x = thickness;
                    },
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
        if (!this.contentLayout || this._scheduledThicknessUpdate) {
            return;
        }
        this._scheduledThicknessUpdate = InteractionManager.runAfterInteractions(() => (
            this._debouncedThicknessUpdate()
        ));
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

    updateThickness() {
        this.cancelThicknessUpdate();

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

    onContainerDequeue(fromIndex: number, toIndex: number) {
        // Move optimal axis 
        if (this.layoutInfo.optimalThicknesses[fromIndex]) {
            this.layoutInfo.optimalThicknesses[toIndex] = this.layoutInfo.optimalThicknesses[fromIndex];
            delete this.layoutInfo.optimalThicknesses[fromIndex];
        }
    }
}
