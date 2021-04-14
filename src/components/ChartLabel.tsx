import React from 'react';
import { Animated, FlexStyle, StyleSheet, ViewProps } from 'react-native';
import { ITickLabel, Alignment2D } from '../types';

export interface ChartLabelProps
    extends Omit<ITickLabel, 'align'>,
        Animated.AnimatedProps<ViewProps> {
    alignX?: Alignment2D['x'];
    alignY?: Alignment2D['y'];
    ignoreBounds?: boolean;
}

const ChartLabel = (props: ChartLabelProps) => {
    const {
        alignX = 'center',
        alignY = 'center',
        ignoreBounds = false,
        title,
        numberOfLines,
        textStyle,
        style,
        render,
        ...otherProps
    } = props;
    if (render) {
        return render(props);
    }
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
                style={
                    ignoreBounds
                        ? { alignSelf: kAlignSelfMapX[alignX] }
                        : styles.innerContainerBounded
                }
            >
                <Animated.Text
                    selectable={false}
                    style={[{ textAlign: alignX }, textStyle]}
                    numberOfLines={numberOfLines}
                >
                    {title || ''}
                </Animated.Text>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainerBounded: {
        maxWidth: '100%',
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
