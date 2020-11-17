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
    const xMajorGridStyle = [
        styles.xGrid,
        {
            borderLeftWidth: props.majorGridLineThickness,
            borderColor: props.majorGridLineColor,
        } as ViewStyle,
    ];
    const yMajorGridStyle = [
        styles.yGrid,
        {
            borderTopWidth: props.majorGridLineThickness,
            borderColor: props.majorGridLineColor,
        } as ViewStyle,
    ];
    const xMinorGridStyle = [
        styles.xGrid,
        {
            borderLeftWidth: props.minorGridLineThickness,
            borderColor: props.minorGridLineColor,
        } as ViewStyle,
    ];
    const yMinorGridStyle = [
        styles.yGrid,
        {
            borderTopWidth: props.minorGridLineThickness,
            borderColor: props.minorGridLineColor,
        } as ViewStyle,
    ];

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
            </View>
            <View style={[styles.innerContainer, { flexDirection: 'column' }]}>
                {yGridItems}
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
        alignItems: 'stretch',
    },
    xGrid: {
        flex: 1,
    },
    yGrid: {
        flex: 1,
    },
});

export default ChartGrid;
