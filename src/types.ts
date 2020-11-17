import Decimal from "decimal.js";
import { ColorValue } from "react-native";

export interface IDecimalPoint {
    x: Decimal;
    y: Decimal;
}

export interface IAxisLayoutStyle {
    majorTickLength?: number;

    majorGridLineDistanceMin?: number;

    minorGridLineDistanceMin?: number;

    labelFontSize?: number;
    labelMargin?: number;
    getLabel?: (value: Decimal) => string;
}

export interface IChartLayoutStyle extends IAxisLayoutStyle {
}

export interface IAxisStyle extends IAxisLayoutStyle {
    axisBackgroundColor?: ColorValue;
    axisLineColor?: ColorValue;
    axisLineThickness?: number;

    majorTickThickness?: number;
    majorTickColor?: ColorValue;

    majorGridLineThickness?: number;
    majorGridLineColor?: ColorValue;

    minorGridLineThickness?: number;
    minorGridLineColor?: ColorValue;

    labelColor?: ColorValue;
}

export interface IChartStyle extends IAxisStyle {
}
