import React from 'react';
import {
    View,
    StyleSheet,
} from 'react-native';

export interface ChartGridProps {
    majorCountX: number;
    majorCountY: number;
}

const ChartGrid = React.memo(({
    majorCountX,
    majorCountY,
}: ChartGridProps) => {
    let xGridItems: React.ReactNode[] = [];
    for (let i = 0; i < majorCountX; i++) {
        xGridItems.push((
            <View key={i} style={styles.xGrid} />
        ));
    }

    let yGridItems: React.ReactNode[] = [];
    for (let i = 0; i < majorCountY; i++) {
        yGridItems.push((
            <View key={i} style={styles.yGrid} />
        ));
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
        borderLeftWidth: 1,
        borderColor: 'rgba(200, 210, 230, 0.5)',
    },
    yGrid: {
        flex: 1,
        borderTopWidth: 1,
        borderColor: 'rgba(200, 210, 230, 0.5)',
    },
});

export default ChartGrid;
