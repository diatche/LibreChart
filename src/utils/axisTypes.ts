import {
    FlatLayoutSourceProps,
} from "evergrid";
import { ColorValue, TextStyle } from "react-native";
import { ITickLabel } from "../types";
import Scale, { ITickLocation } from "./Scale";

export type AxisType = 'topAxis' | 'rightAxis' | 'bottomAxis' | 'leftAxis';
export type Direction = 'horizontal' | 'vertical';

export type AxisTypeMapping<T> = { [K in AxisType]: T };

export interface IAxisLayoutStyle {
    majorTickLength?: number;

    majorGridLineDistanceMin?: number;

    minorGridLineDistanceMin?: number;

    /**
     * Maximum number of minor tick intervals
     * to place between major tick intervals.
     **/
    minorIntervalCountMax?: number;

    labelFontSize?: number;
    labelMargin?: number;
    labelFontWeight?: TextStyle['fontWeight'];
    majorLabelFontWeight?: TextStyle['fontWeight'];
    minorLabelFontWeight?: TextStyle['fontWeight'];
}

export interface IAxisStyleInput extends IAxisLayoutStyle {
    axisBackgroundColor?: ColorValue;
    axisLineColor?: ColorValue;
    axisLineThickness?: number;

    majorTickThickness?: number;
    majorTickColor?: ColorValue;

    labelColor?: ColorValue;
    majorLabelColor?: ColorValue;
    minorLabelColor?: ColorValue;
}

export interface IAxisStyle extends Required<IAxisStyleInput> {}

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
