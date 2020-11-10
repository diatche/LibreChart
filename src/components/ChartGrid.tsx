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
    for (let i = 0; i < majorCountX; i++) {
        for (let j = 0; j < majorCountY; j++) {
            let key = `${i},${j}`;
            cells.push((
                <View key={key} style={styles.majorGridCell} />
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
        flex: 1,
        borderTopWidth: 1,
        borderLeftWidth: 1,
        borderColor: 'rgba(200, 210, 230, 0.5)',
    },
});

export default ChartGrid;
