import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
} from 'react-native';
import { IAxisStyle } from '../types';

export interface ChartGridProps extends Required<IAxisStyle> {
    majorCountX: number;
    majorCountY: number;
    minorCountX: number;
    minorCountY: number;
}

const ChartGrid = React.memo((props: ChartGridProps) => {
    // TODO: skip grid when color or thickness is falsy

    // Note that we do not use borders as these do not
    // always line up with the axis ticks.
    const xMajorGridStyle: ViewStyle = {
        width: props.majorGridLineThickness,
        height: '100%',
        backgroundColor: props.majorGridLineColor,
    };
    const xMinorGridStyle: ViewStyle = {
        width: props.minorGridLineThickness,
        height: '100%',
        backgroundColor: props.minorGridLineColor,
    };
    const yMajorGridStyle: ViewStyle = {
        width: '100%',
        height: props.majorGridLineThickness,
        backgroundColor: props.majorGridLineColor,
    };
    const yMinorGridStyle: ViewStyle = {
        width: '100%',
        height: props.minorGridLineThickness,
        backgroundColor: props.minorGridLineColor,
    };

    let xGridItems: React.ReactNode[] = [];
    for (let i = 0; i < props.majorCountX; i++) {
        xGridItems.push((
            <View key={`xa${i}`} style={xMajorGridStyle} />
        ));
        for (let j = 0; j < props.minorCountX; j++) {
            xGridItems.push((
                <View key={`xi${i},${j}`} style={xMinorGridStyle} />
            ));
        }
    }

    let yGridItems: React.ReactNode[] = [];
    for (let i = 0; i < props.majorCountY; i++) {
        yGridItems.push((
            <View key={`ya${i}`} style={yMajorGridStyle} />
        ));
        for (let j = 0; j < props.minorCountY; j++) {
            yGridItems.push((
                <View key={`yi${i},${j}`} style={yMinorGridStyle} />
            ));
        }
    }

    return (
        <View style={styles.container}>
            <View style={[styles.innerContainer, { flexDirection: 'row' }]}>
                {xGridItems}
                <View style={styles.edge} />
            </View>
            <View style={[styles.innerContainer, { flexDirection: 'column' }]}>
                {yGridItems}
                <View style={styles.edge} />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'space-between',
    },
    edge: {
        width: 0,
        height: 0,
    },
});

export default ChartGrid;
