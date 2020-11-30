import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { IChartGridStyle } from '../types';

export interface ChartGridProps extends Required<IChartGridStyle> {
    majorCountX: number;
    majorCountY: number;
    minorCountX: number;
    minorCountY: number;
}

const ChartGrid = React.memo((props: ChartGridProps) => {
    // TODO: skip grid when color or thickness is falsy

    // Note that we do not use borders as these tend to
    // less often line up with axis ticks.
    const xMajorGridStyle: ViewStyle = {
        width: props.majorGridLineThickness,
        height: '100%',
        marginLeft: -props.majorGridLineThickness / 2,
        backgroundColor: props.majorGridLineColor,
    };
    const xMinorGridStyle: ViewStyle = {
        width: props.minorGridLineThickness,
        height: '100%',
        marginLeft: -props.minorGridLineThickness / 2,
        backgroundColor: props.minorGridLineColor,
    };
    const yMajorGridStyle: ViewStyle = {
        width: '100%',
        height: props.majorGridLineThickness,
        marginTop: -props.majorGridLineThickness / 2,
        backgroundColor: props.majorGridLineColor,
    };
    const yMinorGridStyle: ViewStyle = {
        width: '100%',
        height: props.minorGridLineThickness,
        marginTop: -props.minorGridLineThickness / 2,
        backgroundColor: props.minorGridLineColor,
    };

    let xMajorGridItems: React.ReactNode[] = [];
    let xMinorGridItems: React.ReactNode[] = [];
    for (let i = 0; i < props.majorCountX; i++) {
        xMajorGridItems.push((
            <View key={`xa${i}`} style={xMajorGridStyle} />
        ));
        xMinorGridItems.push((
            <View key={`xa${i}`} style={styles.placeholder} />
        ));
        for (let j = 0; j < props.minorCountX; j++) {
            xMinorGridItems.push((
                <View key={`xi${i},${j}`} style={xMinorGridStyle} />
            ));
        }
    }

    let yMajorGridItems: React.ReactNode[] = [];
    let yMinorGridItems: React.ReactNode[] = [];
    for (let i = 0; i < props.majorCountY; i++) {
        yMajorGridItems.push((
            <View key={`ya${i}`} style={yMajorGridStyle} />
        ));
        yMinorGridItems.push((
            <View key={`ya${i}`} style={styles.placeholder} />
        ));
        for (let j = 0; j < props.minorCountY; j++) {
            yMinorGridItems.push((
                <View key={`yi${i},${j}`} style={yMinorGridStyle} />
            ));
        }
    }

    // Draw minor grid below major grid
    return (
        <View style={styles.container}>
            <View style={[styles.innerContainer, { flexDirection: 'row' }]}>
                {xMinorGridItems}
                <View style={styles.placeholder} />
            </View>
            <View style={[styles.innerContainer, { flexDirection: 'column' }]}>
                {yMinorGridItems}
                <View style={styles.placeholder} />
            </View>
            <View style={[styles.innerContainer, { flexDirection: 'row' }]}>
                {xMajorGridItems}
                <View style={styles.placeholder} />
            </View>
            <View style={[styles.innerContainer, { flexDirection: 'column' }]}>
                {yMajorGridItems}
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
    innerContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
    },
    placeholder: {
        width: 0,
        height: 0,
    },
});

export default ChartGrid;
