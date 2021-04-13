import React from 'react';
import { Animated, FlexStyle, StyleSheet } from 'react-native';
import { ITickLabel, TextAlign } from '../types';

export interface ChartLabelProps extends ITickLabel {}

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
    const { align, title, style, render, ...otherProps } = props;
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
            ]}
        >
            <Animated.View
                style={{ alignSelf: kAlignSelfMapX[align?.x || 'center'] }}
            >
                <Animated.Text
                    selectable={false}
                    style={style}
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
