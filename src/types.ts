import Decimal from "decimal.js";
import { ColorValue } from "react-native";

export interface IDecimalPoint {
    x: Decimal;
    y: Decimal;
}

export interface IAxisStyle {
    axisBackgroundColor?: ColorValue;
    axisColor?: ColorValue;
    axisThickness?: number;
    axisResizeAnimationDuration?: number;

    majorTickLength?: number;
    majorTickThickness?: number;
    majorTickColor?: ColorValue;

    labelFontSize?: number;
    labelColor?: ColorValue;
    labelMargin?: number;
    getLabel?: (value: Decimal) => string;
}

export interface IChartStyle extends IAxisStyle {
}
