import React from 'react';
import { Animated } from 'react-native';
import { IRectStyle } from '../types';

export interface ChartRectProps extends IRectStyle {}

const ChartRect = React.memo((props: ChartRectProps) => {
    return (
        <Animated.View
            style={{
                flex: 1,
                backgroundColor: props.fillColor,
                borderWidth: props.strokeWidth,
                borderColor: props.strokeColor,
                margin: -(props.strokeWidth || 0) / 2,

                borderRadius: props.cornerRadius,
                borderTopLeftRadius: props.topLeftCornerRadius,
                borderTopRightRadius: props.topRightCornerRadius,
                borderBottomRightRadius: props.bottomRightCornerRadius,
                borderBottomLeftRadius: props.bottomLeftCornerRadius,

                ...props,
            }}
        />
    );
});

export default ChartRect;
