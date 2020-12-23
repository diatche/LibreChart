import React from 'react';
import {
    Animated,
} from 'react-native';
import {
    IFillStyle,
    IStrokeStyle,
} from '../types';

export interface ChartRectProps extends IFillStyle, IStrokeStyle {}

const ChartRect = React.memo((props: ChartRectProps) => {
    return <Animated.View style={{
        flex: 1,
        backgroundColor: props.fillColor,
        borderRadius: props.cornerRadius,
        borderWidth: props.strokeWidth,
        borderColor: props.strokeColor,
    }} />;
});

export default ChartRect;
