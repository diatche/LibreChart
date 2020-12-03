import {
    AnimatedValueInput,
    FlatLayoutSourceProps,
} from "evergrid";
import { Animated, ColorValue, TextStyle } from "react-native";
import { ITickLabel } from "../types";
import Scale, { ITickLocation } from "./Scale";

export type AxisType = 'topAxis' | 'rightAxis' | 'bottomAxis' | 'leftAxis';
export type Direction = 'horizontal' | 'vertical';

export type AxisTypeMapping<T> = { [K in AxisType]: T };

export interface IAxisContentLayoutStyle {
    labelFontSize?: number;
    labelMargin?: number;
    labelFontWeight?: TextStyle['fontWeight'];
    majorLabelFontWeight?: TextStyle['fontWeight'];
    minorLabelFontWeight?: TextStyle['fontWeight'];
}

export interface IAxisContentStyleInput extends IAxisContentLayoutStyle {
    labelColor?: ColorValue;
    majorLabelColor?: ColorValue;
    minorLabelColor?: ColorValue;
}

export interface IAxisContentStyle extends Required<IAxisContentStyleInput> {}

export interface IAxisBackgroundLayoutStyle {
    majorTickLength?: number;

    majorGridLineDistanceMin?: number;

    minorGridLineDistanceMin?: number;

    /**
     * Maximum number of minor tick intervals
     * to place between major tick intervals.
     **/
    minorIntervalCountMax?: number;
}

export interface IAxisBackgroundStyleInput extends IAxisBackgroundLayoutStyle {
    axisBackgroundColor?: ColorValue;
    axisLineColor?: ColorValue;
    axisLineThickness?: number;

    majorTickThickness?: number;
    majorTickColor?: ColorValue;
}

export interface IAxisBackgroundStyle extends Required<IAxisBackgroundStyleInput> {}

export interface IAxisStyleInput extends IAxisContentStyleInput, IAxisBackgroundStyleInput {
    padding?: AnimatedValueInput;
}

export interface IAxisStyle extends Required<IAxisStyleInput> {
    padding: Animated.Value;
}

export interface IAxisLayoutSourceProps extends Omit<FlatLayoutSourceProps, 'shouldRenderItem'> {}

export interface IAxisOptions<T = any, D = T> {
    /**
     * Toggles axis visiblity.
     * Axis is visible by default.
     **/
    hidden?: boolean;

    getTickLabel?: (tick: ITickLocation<T>) => string | ITickLabel;

    /**
     * Customises the tick location.
     * Be default, linear ticks are used.
     */
    scale?: Scale<T, D>;

    layoutSourceDefaults?: IAxisLayoutSourceProps;

    style?: IAxisStyleInput;
}
