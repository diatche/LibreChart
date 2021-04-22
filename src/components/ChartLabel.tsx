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
}

const ChartLabel = (props: ChartLabelProps) => {
    const {
        alignX = 'center',
        alignY = 'center',
        title,
        textStyle,
        style,
        render,
        ...otherProps
    } = props;

    const textProps: Animated.AnimatedProps<TextProps> = {
        selectable: false,
        style: [{ textAlign: alignX }, textStyle],
    };

    let content: React.ReactNode;
    if (render) {
        content = render(textProps);
        if (typeof content === 'string') {
            throw new Error(
                'Use the title prop to display a basic text string'
            );
        }
    } else {
        content = <Animated.Text {...textProps}>{title || ''}</Animated.Text>;
    }

    return (
        <Animated.View
            {...otherProps}
            style={[
                styles.container,
                { justifyContent: kAlignContentMapY[alignY] },
                style,
            ]}
        >
            <Animated.View>{content}</Animated.View>
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
