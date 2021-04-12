import { AnimatedValueInput, FlatLayoutSourceProps } from 'evergrid';
import { Animated, TextStyle } from 'react-native';
import { ITickLabel } from '../../types';
import { ITickVector } from '../../scale/Scale';

export type AxisType = 'topAxis' | 'rightAxis' | 'bottomAxis' | 'leftAxis';
export type Direction = 'horizontal' | 'vertical';

export type AxisTypeMapping<T> = { [K in AxisType]: T };

export interface IAxisContentLayoutStyle {
    labelFontSize?: number;
    labelMargin?: number;
    labelFontWeight?: TextStyle['fontWeight'];
    majorLabelFontWeight?: TextStyle['fontWeight'];
    minorLabelFontWeight?: TextStyle['fontWeight'];
}

export interface IAxisContentStyleInput extends IAxisContentLayoutStyle {
    labelColor?: string;
    majorLabelColor?: string;
    minorLabelColor?: string;
}

export interface IAxisContentStyle extends Required<IAxisContentStyleInput> {}

export interface IAxisBackgroundLayoutStyle {
    majorTickLength?: number;

    majorGridLineDistanceMin?: number;

    minorGridLineDistanceMin?: number;

    /**
     * Maximum number of minor tick intervals
     * to place between major tick intervals.
     **/
    minorIntervalCountMax?: number;
}

export interface IAxisBackgroundStyleInput extends IAxisBackgroundLayoutStyle {
    axisBackgroundColor?: string;
    axisLineColor?: string;
    axisLineThickness?: number;

    majorTickThickness?: number;
    majorTickColor?: string;
}

export interface IAxisBackgroundStyle
    extends Required<IAxisBackgroundStyleInput> {}

export interface IAxisStyleInput
    extends IAxisContentStyleInput,
        IAxisBackgroundStyleInput {
    padding?: AnimatedValueInput;
}

export interface IAxisStyle extends Required<IAxisStyleInput> {
    padding: Animated.Value;
}

export interface IAxisLayoutSourceProps
    extends Omit<FlatLayoutSourceProps, 'shouldRenderItem'> {}

export interface IAxisOptions<T = any> {
    axisType: AxisType;

    /**
     * Toggles axis visiblity.
     * Axis is visible by default.
     **/
    hidden: boolean;

    getTickLabel: (
        tick: ITickVector<T>,
    ) => ITickLabel | ITickLabel['title'] | ITickLabel['render'];

    onThicknessChange?: (thickness: number, previousThickness: number) => void;
    onOptimalThicknessChange?: (
        thickness: number,
        previousThickness: number,
    ) => void;

    layoutSourceDefaults: IAxisLayoutSourceProps;

    style: IAxisStyleInput;
}
