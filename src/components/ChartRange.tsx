import React from 'react';
import {
    Animated,
} from 'react-native';
import {
    IFillStyle,
    IStrokeStyle,
} from '../types';

export interface ChartRangeProps extends IFillStyle, IStrokeStyle {}

const ChartRange = React.memo((props: ChartRangeProps) => {
    return <Animated.View style={{
        flex: 1,
        backgroundColor: props.fillColor,
        borderRadius: props.cornerRadius,
        borderWidth: props.strokeWidth,
        borderColor: props.strokeColor,
    }} />;
});

export default ChartRange;
