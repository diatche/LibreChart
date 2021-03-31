import React from 'react';
import { ChartLayout, Plot } from '../internal';
import { Animated, StyleSheet, ViewProps, ViewStyle } from 'react-native';
import { PlotProps } from './Plot';

export interface ChartProps extends Animated.AnimatedProps<ViewProps> {
    layout: ChartLayout;
}

interface ChartState {}

export default class Chart extends React.PureComponent<ChartProps, ChartState> {
    layout: ChartLayout;

    constructor(props: ChartProps) {
        super(props);
        this.layout = props.layout;
        this.layout.configureChart();

        // TODO: validate property changes
        // TODO: prevent changing axes on the fly
    }

    render() {
        let styleFromTheme: ViewStyle = {};
        if (this.props.layout.theme?.backgroundColor) {
            styleFromTheme.backgroundColor = this.props.layout.theme?.backgroundColor;
        }
        let rows: React.ReactNode[] = [];
        for (let i = 0; i < this.layout.rowHeights.length; i++) {
            let heightInfo = this.layout.rowHeights[i];

            let rowStyle: Animated.AnimatedProps<ViewStyle> = {};
            if (typeof heightInfo === 'object' && 'flex' in heightInfo) {
                rowStyle.flex = heightInfo.flex;
            } else {
                rowStyle.height = heightInfo;
            }

            let rowPlots: React.ReactNode[] = [];
            for (let j = 0; j < this.layout.columnWidths.length; j++) {
                let widthInfo = this.layout.columnWidths[j];
                let plot = this.layout.getPlot({ x: j, y: i });
                if (!plot) {
                    throw new Error(`Plot not found at row ${i}, column ${j}`);
                }

                let columnStyle: PlotProps['style'] = {};
                if (typeof widthInfo === 'object' && 'flex' in widthInfo) {
                    columnStyle.flex = widthInfo.flex;
                } else {
                    columnStyle.width = widthInfo;
                }

                // Render plot inside row
                rowPlots.push(
                    <Plot key={j} layout={plot} style={columnStyle} />,
                );
            }
            // Render row
            rows.push(
                <Animated.View key={i} style={[styles.row, rowStyle]}>
                    {rowPlots}
                </Animated.View>,
            );
        }

        // Render rows
        return (
            <Animated.View
                {...this.props}
                onLayout={Animated.event(
                    [
                        {
                            nativeEvent: {
                                layout: {
                                    width: this.props.layout.containerSize$.x,
                                    height: this.props.layout.containerSize$.y,
                                },
                            },
                        },
                    ],
                    {
                        // listener: event => {},
                        useNativeDriver: false,
                    },
                )}
                style={[styles.container, styleFromTheme, this.props.style]}
            >
                {rows}
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        alignContent: 'stretch',
    },
    row: {
        flexDirection: 'row',
        alignContent: 'stretch',
    },
});
