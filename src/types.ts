import Decimal from "decimal.js";
import {
    AxisType,
    FlatLayoutSourceProps,
    GridLayoutSourceProps,
    LayoutSource,
} from "evergrid";
import { ColorValue } from "react-native";
import Scale, {
    ITickLocation,
} from "./utils/Scale";

export interface IDataPoint<X, Y> {
    x: X,
    y: Y,
}

export interface IDecimalPoint {
    x: Decimal;
    y: Decimal;
}

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
}

export interface IAxisStyleInput extends IAxisLayoutStyle {
    axisBackgroundColor?: ColorValue;
    axisLineColor?: ColorValue;
    axisLineThickness?: number;

    majorTickThickness?: number;
    majorTickColor?: ColorValue;

    labelColor?: ColorValue;
}

export interface IAxisStyle extends Required<IAxisStyleInput> {}

export interface IChartGridStyleInput {
    majorGridLineThickness?: number;
    majorGridLineColor?: ColorValue;

    minorGridLineThickness?: number;
    minorGridLineColor?: ColorValue;
}

export interface IChartGridStyle extends Required<IChartGridStyleInput> {}

export interface IAxisLayoutSourceProps extends Omit<FlatLayoutSourceProps, 'shouldRenderItem'> {}

export interface IAxisOptions<T = any, D = T> {
    /**
     * Toggles axis visiblity.
     * Axis is visible by default.
     **/
    hidden?: boolean;

    getTickLabel?: (tick: ITickLocation<T>) => string;

    /**
     * Customises the tick location.
     * Be default, linear ticks are used.
     */
    scale?: Scale<T, D>;

    layoutSourceDefaults?: IAxisLayoutSourceProps;

    style?: IAxisStyleInput;
}

export interface IChartGridInput {
    /**
     * Toggles grid visiblity.
     * Grid is visible by default.
     **/
    hidden?: boolean;

    horizontalAxis?: AxisType;
    verticalAxis?: AxisType;

    style?: IChartGridStyle;
}

export interface IGridLayoutSourceProps extends Omit<GridLayoutSourceProps, 'shouldRenderItem'> {}

export interface IChartGrid extends IChartGridInput {
    hidden: boolean;
    layout?: LayoutSource;
    style: Required<IChartGridStyle>;
}
