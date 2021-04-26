import {
    AxisType,
    AxisTypeMapping,
    IAxisStyle,
    IAxisStyleInput,
} from './axisTypes';
import {
    kAllAxisTypes,
    kAllAxisTypeSet,
    kAxisStyleLightDefaults,
    kHorizontalAxisTypes,
} from './axisConst';
import _ from 'lodash';
import { normalizeAnimatedValue } from 'evergrid';
import { DeepPartial } from '../../types';
import { Animated, TextProps } from 'react-native';

export const isAxisType = (axisType: any): axisType is AxisType => {
    return kAllAxisTypeSet.has(axisType as any);
};

export const isAxisHorizontal = (axisType: AxisType) =>
    kHorizontalAxisTypes.indexOf(axisType) >= 0;

export function axisTypeMap<T>(
    iterator: (axisType: AxisType) => T
): AxisTypeMapping<T> {
    let d: Partial<AxisTypeMapping<T>> = {};
    for (let axisType of kAllAxisTypes) {
        d[axisType] = iterator(axisType);
    }
    return d as AxisTypeMapping<T>;
}

export function mergeAxisStyles(
    ...styles: (
        | IAxisStyle
        | DeepPartial<IAxisStyle>
        | IAxisStyleInput
        | undefined
    )[]
): IAxisStyle {
    // Merge regular values
    styles = styles.filter(x => !!x);
    let inheritedStyle = _.merge({}, kAxisStyleLightDefaults, ...styles);
    let style: IAxisStyle = _.merge({}, inheritedStyle, {
        padding: normalizeAnimatedValue(inheritedStyle.padding),
        axisThickness:
            typeof inheritedStyle.axisThickness !== 'undefined'
                ? normalizeAnimatedValue(inheritedStyle.axisThickness)
                : undefined,
    });

    // Merge React label styles
    style.labelStyle.textStyle = styles
        .map(style => style?.labelStyle?.textStyle)
        .filter(x => !!x) as Animated.AnimatedProps<TextProps>['style'];
    style.majorLabelStyle.textStyle = styles
        .map(style => style?.majorLabelStyle?.textStyle)
        .filter(x => !!x) as Animated.AnimatedProps<TextProps>['style'];
    style.minorLabelStyle.textStyle = styles
        .map(style => style?.minorLabelStyle?.textStyle)
        .filter(x => !!x) as Animated.AnimatedProps<TextProps>['style'];

    return style;
}
