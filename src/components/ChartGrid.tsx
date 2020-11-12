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
    let cells: React.ReactNode[] = [];
    let width = `${1 / majorCountX * 100}%`;
    let height = `${1 / majorCountY * 100}%`;
    for (let i = 0; i < majorCountX; i++) {
        for (let j = 0; j < majorCountY; j++) {
            let key = `${i},${j}`;
            let left = `${i / majorCountX * 100}%`;
            let top = `${j / majorCountY * 100}%`;
            cells.push((
                <View key={key} style={[styles.majorGridCell, {
                    left, top, width, height
                }]} />
            ));
        }
    }
    return (
        <View style={styles.container}>
            {cells}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    majorGridCell: {
        position: 'absolute',
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: 'rgba(200, 210, 230, 0.5)',
    },
});

export default ChartGrid;
