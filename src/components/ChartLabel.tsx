import React from 'react';
import {
    Animated,
    FlexStyle,
    StyleSheet,
    TextProps,
    ViewProps,
} from 'react-native';
import { ITickLabel, Alignment2D } from '../types';

export interface ChartLabelProps
    extends Omit<ITickLabel, 'align'>,
        Animated.AnimatedProps<ViewProps> {
    alignX?: Alignment2D['x'];
    alignY?: Alignment2D['y'];
    textWidth?: number;
    textHeight?: number;
    ignoreBounds?: boolean;
}

const ChartLabel = (props: ChartLabelProps) => {
    const {
        alignX = 'center',
        alignY = 'center',
        textWidth,
        textHeight,
        title,
        numberOfLines,
        textStyle,
        style,
        render,
        ...otherProps
    } = props;

    const isFixedWidth = (textWidth || 0) > 0;
    const isFixedHeight = (textHeight || 0) > 0;

    const { ignoreBounds = isFixedWidth || isFixedHeight } = props;

    const textProps: Animated.AnimatedProps<TextProps> = {
        selectable: false,
        style: [{ textAlign: alignX }, textStyle],
        numberOfLines,
    };

    return (
        <Animated.View
            {...otherProps}
            style={[
                styles.container,
                {
                    alignItems: kAlignItemsMapX[alignX],
                    justifyContent: kAlignContentMapY[alignY],
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    ignoreBounds ? { alignSelf: kAlignSelfMapX[alignX] } : {},
                    isFixedWidth ? { width: textWidth } : {},
                    isFixedHeight ? { height: textHeight } : {},
                ]}
            >
                {render ? (
                    render(textProps)
                ) : (
                    <Animated.Text {...textProps}>{title || ''}</Animated.Text>
                )}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

const kAlignItemsMapX: {
    [K in Alignment2D['x']]: FlexStyle['alignItems'];
} = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
};

const kAlignSelfMapX: {
    [K in Alignment2D['x']]: FlexStyle['alignSelf'];
} = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
};

const kAlignContentMapY: {
    [K in Alignment2D['y']]: FlexStyle['justifyContent'];
} = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
};

export default ChartLabel;
