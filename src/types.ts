import Decimal from "decimal.js";
import {
    GridLayoutSourceProps,
    LayoutSource,
} from "evergrid";
import { ColorValue, TextStyle } from "react-native";
import { AxisType } from "./utils/axisTypes";

export interface IDataPoint<X, Y> {
    x: X,
    y: Y,
}

export interface ITickLabel {
    title: string;
    style?: TextStyle;
}

export interface IDecimalPoint {
    x: Decimal;
    y: Decimal;
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

export interface IChartGridStyleInput {
    majorGridLineThickness?: number;
    majorGridLineColor?: ColorValue;

    minorGridLineThickness?: number;
    minorGridLineColor?: ColorValue;
}

export interface IChartGridStyle extends Required<IChartGridStyleInput> {}

export interface IGridLayoutSourceProps extends Omit<GridLayoutSourceProps, 'shouldRenderItem'> {}

export interface IChartGrid extends IChartGridInput {
    hidden: boolean;
    layout?: LayoutSource;
    style: Required<IChartGridStyle>;
}
