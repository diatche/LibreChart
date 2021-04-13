import React from 'react';
import { Animated, FlexStyle, StyleSheet, ViewProps } from 'react-native';
import { ITickLabel, Alignment2D } from '../types';

export interface ChartLabelProps
    extends Omit<ITickLabel, 'align'>,
        Animated.AnimatedProps<ViewProps> {
    alignX?: Alignment2D['x'];
    alignY?: Alignment2D['y'];
}

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

const ChartLabel = React.memo((props: ChartLabelProps) => {
    const {
        alignX = 'center',
        alignY = 'center',
        title,
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
                    justifyContent: kAlignContentMapY[alignY],
                },
                style,
            ]}
        >
            <Animated.View style={{ alignSelf: kAlignSelfMapX[alignX] }}>
                <Animated.Text
                    selectable={false}
                    style={[{ textAlign: alignX }, textStyle]}
                    numberOfLines={1}
                >
                    {title || ''}
                </Animated.Text>
            </Animated.View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

export default ChartLabel;
