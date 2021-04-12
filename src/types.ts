import Decimal from 'decimal.js';
import { GridLayoutSourceProps, IPoint } from 'evergrid';
import { Animated, TextStyle } from 'react-native';

export type AnimatedValueAny =
    | number
    | Animated.Value
    | Animated.AnimatedInterpolation;

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

    pointInnerColor?: string;
    pointOuterColor?: string;
}

export interface IStrokeStyle {
    /** Stroke width in view coordinates. */
    strokeWidth?: AnimatedValueAny;
    strokeColor?: string;
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
    render?: (props: any) => any;
}

export interface IDecimalPoint {
    x: Decimal;
    y: Decimal;
}

export interface IChartGridStyleInput {
    majorGridLineThickness?: number;
    majorGridLineColor?: string;

    minorGridLineThickness?: number;
    minorGridLineColor?: string;
}

export interface IChartGridStyle extends Required<IChartGridStyleInput> {}

export interface IGridLayoutSourceProps
    extends Omit<GridLayoutSourceProps, 'shouldRenderItem'> {}

export type ChartDataType = 'path' | 'point' | 'bar' | 'rect';

export type Cancelable = { cancel: () => void };
