import React from 'react';
import { StyleSheet, Animated } from 'react-native';

export interface ChartPointProps {
    diameter: Animated.Animated;
}

/**
 * OUTDATED
 */
const ChartPoint = React.memo(({ diameter }: ChartPointProps) => {
    return (
        <Animated.View
            style={[
                styles.point,
                {
                    borderRadius: Animated.divide(diameter, 2),
                },
            ]}
        />
    );
});

const styles = StyleSheet.create({
    point: {
        flex: 1,
        backgroundColor: 'rgb(100, 150, 200)',
    },
});

export default ChartPoint;
