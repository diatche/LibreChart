import React from 'react';
import { Animated, FlexStyle, StyleSheet, ViewProps } from 'react-native';
import { ITickLabel, TextAlign } from '../types';

export interface ChartLabelProps extends ITickLabel, ViewProps {}

const kAlignSelfMapX: { [K in TextAlign['x']]: FlexStyle['alignSelf'] } = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
};

const kAlignContentMapY: {
    [K in TextAlign['y']]: FlexStyle['justifyContent'];
} = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
};

const ChartLabel = React.memo((props: ChartLabelProps) => {
    const { align, title, textStyle, style, render, ...otherProps } = props;
    const alignX = align?.x || 'center';
    if (render) {
        return render(props);
    }
    return (
        <Animated.View
            {...otherProps}
            style={[
                styles.container,
                {
                    justifyContent: kAlignContentMapY[align?.y || 'center'],
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
