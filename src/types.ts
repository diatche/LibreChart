import Decimal from "decimal.js";
import {
    AxisType,
    FlatLayoutSourceProps,
    GridLayoutSource,
    GridLayoutSourceProps,
} from "evergrid";
import { ColorValue } from "react-native";
import Scale, {
    ITick,
} from "./utils/baseScale";

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

export interface IAxisOptions<T = any> {
    /**
     * Toggles axis visiblity.
     * Axis is visible by default.
     **/
    hidden?: boolean;

    getTickLabel?: (tick: ITick<T>) => string;

    /**
     * Customises the tick location.
     * Be default, linear ticks are used.
     */
    scale?: Scale<T>;

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
    layout?: GridLayoutSource;
    style: Required<IChartGridStyle>;
}
