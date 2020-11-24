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
    
    /**
     * Maximum number of minor tick intervals
     * to place between major tick intervals.
     **/
    minorIntervalCountMax?: number;

    labelFontSize?: number;
    labelMargin?: number;
}

export interface IAxisStyle extends IAxisLayoutStyle {
    axisBackgroundColor?: ColorValue;
    axisLineColor?: ColorValue;
    axisLineThickness?: number;

    majorTickThickness?: number;
    majorTickColor?: ColorValue;

    labelColor?: ColorValue;
}

export interface IChartGridStyle {
    majorGridLineThickness?: number;
    majorGridLineColor?: ColorValue;

    minorGridLineThickness?: number;
    minorGridLineColor?: ColorValue;
}
