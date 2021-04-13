import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import { ITickLabel } from '../types';

export interface ChartLabelProps extends ITickLabel {}

const ChartLabel = React.memo((props: ChartLabelProps) => {
    const { title, style, render, ...otherProps } = props;
    if (render) {
        return render(props);
    }
    return (
        <Animated.View {...otherProps} style={styles.container}>
            <Animated.View style={styles.innerContainer}>
                <Animated.Text
                    selectable={false}
                    style={style}
                    numberOfLines={1}
                >
                    {title || ''}
                </Animated.Text>
            </Animated.View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignContent: 'center',
        justifyContent: 'center',
    },
    innerContainer: {
        alignSelf: 'center',
    },
});

export default ChartLabel;
