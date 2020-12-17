import Decimal from "decimal.js";
import {
    GridLayoutSourceProps, IPoint,
} from "evergrid";
import { ColorValue, TextStyle } from "react-native";

export interface IDataItem<X, Y> {
    x: X,
    y: Y,
    style?: IDataPointStyle;
}

export interface IDataPoint extends IPoint {
    dataIndex: number;
}

export interface IDataPointStyle {
    /** Point inner radius in view coordinates. */
    pointInnerRadius?: number;
    /** Point outer radius in view coordinates. */
    pointOuterRadius?: number;

    pointInnerColor?: string | number;
    pointOuterColor?: string | number;
}

export interface ITickLabel {
    title: string;
    style?: TextStyle;
}

export interface IDecimalPoint {
    x: Decimal;
    y: Decimal;
}

export interface IChartGridStyleInput {
    majorGridLineThickness?: number;
    majorGridLineColor?: ColorValue;

    minorGridLineThickness?: number;
    minorGridLineColor?: ColorValue;
}

export interface IChartGridStyle extends Required<IChartGridStyleInput> {}

export interface IGridLayoutSourceProps extends Omit<GridLayoutSourceProps, 'shouldRenderItem'> {}

export type ChartDataType = 'path' | 'point';

export type Cancelable = { cancel: () => void };
