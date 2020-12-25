import Decimal from "decimal.js";
import {
    AnimatedValueInput,
    GridLayoutSourceProps, IPoint,
} from "evergrid";
import {
    Animated,
    ColorValue,
    TextStyle,
} from "react-native";

export type AnimatedValueAny = number | Animated.Value | Animated.AnimatedInterpolation;

export interface IDataSourceRect<X, Y> {
    x: X;
    y: Y;
    x2?: X;
    y2?: Y;
}

export interface IRect extends IPoint {
    width: number;
    height: number;
}

export interface IDataRect extends IPoint, IRect {
    dataIndex: number;
}

export interface IPointStyle {
    /** Point inner radius in view coordinates. */
    pointInnerRadius?: AnimatedValueAny;
    /** Point outer radius in view coordinates. */
    pointOuterRadius?: AnimatedValueAny;

    pointInnerColor?: ColorValue;
    pointOuterColor?: ColorValue;
}

export interface IStrokeStyle {
    /** Stroke width in view coordinates. */
    strokeWidth?: AnimatedValueAny;
    strokeColor?: ColorValue;
    /** Stroke dash array in view coordinates. */
    strokeDashArray?: number[];
}

export interface IFillStyle {
    fillColor?: string;
}

export interface IRectStyle extends IFillStyle, IStrokeStyle {

    cornerRadius?: AnimatedValueAny;
    topLeftCornerRadius?: AnimatedValueAny;
    topRightCornerRadius?: AnimatedValueAny;
    bottomRightCornerRadius?: AnimatedValueAny;
    bottomLeftCornerRadius?: AnimatedValueAny;

    padding?: AnimatedValueAny;
    paddingHorizontal?: AnimatedValueAny;
    paddingVertical?: AnimatedValueAny;
    paddingLeft?: AnimatedValueAny;
    paddingRight?: AnimatedValueAny;
    paddingTop?: AnimatedValueAny;
    paddingBottom?: AnimatedValueAny;
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

export type ChartDataType = 'path' | 'point' | 'bar' | 'rect';

export type Cancelable = { cancel: () => void };
