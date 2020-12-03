import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import {
    AxisType,
    IAxisBackgroundStyle,
} from '../utils/axisTypes';

export interface ChartAxisBackgroundProps extends IAxisBackgroundStyle {
    majorCount: number;
    axisType: AxisType;
}

const ChartAxisBackground = React.memo((props: ChartAxisBackgroundProps) => {
    let containerStyle: ViewStyle = {
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

    let tickContainerStyle: ViewStyle = {};
    let majorTickStyle: ViewStyle = {
        backgroundColor: props.majorTickColor,
    };

    switch (props.axisType) {
        case 'bottomAxis':
        case 'topAxis':
            tickContainerStyle.flexDirection = 'row';

            majorTickStyle.width = props.majorTickThickness;
            majorTickStyle.height = props.majorTickLength;
            majorTickStyle.marginHorizontal = -props.majorTickThickness / 2;
            break;
        case 'leftAxis':
        case 'rightAxis':
            tickContainerStyle.flexDirection = 'column';

            majorTickStyle.width = props.majorTickLength;
            majorTickStyle.height = props.majorTickThickness;
            majorTickStyle.marginVertical = -props.majorTickThickness / 2;
            break;
    }

    let majorTicks: React.ReactNode[] = [];
    for (let i = 0; i < props.majorCount; i++) {
        majorTicks.push((
            <View key={i} style={majorTickStyle} />
        ));
    }
    
    return (
        <View style={[styles.container, containerStyle]}>
            <View style={[styles.tickContainer, tickContainerStyle]}>
                {majorTicks}
                <View style={styles.placeholder} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // borderWidth: 2,
        // borderColor: 'rgba(200, 210, 130, 0.5)',
    },
    tickContainer: {
        flex: 1,
        justifyContent: 'space-between',
        // borderWidth: 2,
        // borderColor: 'rgba(100, 110, 230, 0.5)',
    },
    placeholder: {
        width: 0,
        height: 0,
    },
});

export default ChartAxisBackground;
