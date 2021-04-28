import React from 'react';
import { StyleSheet, Animated, ViewProps } from 'react-native';
import { AxisType, IAxisBackgroundStyle } from '../layout/axis/axisTypes';

export interface ChartAxisBackgroundProps
    extends Omit<IAxisBackgroundStyle, 'axisThickness'> {
    axisType: AxisType;
}

const ChartAxisBackground = React.memo((props: ChartAxisBackgroundProps) => {
    let containerStyle: Animated.AnimatedProps<ViewProps>['style'] = {
        borderColor: props.axisLineColor,
        backgroundColor: props.axisBackgroundColor,
    };
    switch (props.axisType) {
        case 'topAxis':
            containerStyle.borderBottomWidth = props.axisLineThickness;
            break;
        case 'bottomAxis':
            containerStyle.borderTopWidth = props.axisLineThickness;
            break;
        case 'leftAxis':
            containerStyle.borderRightWidth = props.axisLineThickness;
            break;
        case 'rightAxis':
            containerStyle.borderLeftWidth = props.axisLineThickness;
            break;
    }

    return <Animated.View style={[styles.container, containerStyle]} />;
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // borderWidth: 2,
        // borderColor: 'rgba(200, 210, 130, 0.5)',
    },
});

export default ChartAxisBackground;
