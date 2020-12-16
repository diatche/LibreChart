import React from 'react';
import {
    ChartLayout,
    Plot,
} from '../internal';
import {
    Animated,
    ViewProps,
} from 'react-native';

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
        let rows: React.ReactNode[] = [];
        for (let i = 0; i < this.layout.rowHeights.length; i++) {
            let height = this.layout.rowHeights[i];
            let rowPlots: React.ReactNode[] = [];
            for (let j = 0; j < this.layout.columnWidths.length; j++) {
                let width = this.layout.columnWidths[j];
                let plot = this.layout.getPlot({ x: j, y: i });
                if (!plot) {
                    throw new Error(`Plot not found at row ${i}, column ${j}`);
                }
                rowPlots.push(
                    <Plot
                        key={j}
                        layout={plot}
                        style={{
                            width,
                            height,
                        }}
                    />
                );
            }
            rows.push(
                <Animated.View
                    key={i}
                    style={{
                        width: '100%',
                        height,
                    }}
                >
                    {rowPlots}
                </Animated.View>
            )
        }

        return (
            <Animated.View
                {...this.props}
                onLayout={Animated.event([{
                    nativeEvent: {
                        layout: {
                            width: this.props.layout.containerSize$.x,
                            height: this.props.layout.containerSize$.y,
                        }
                    }
                }])}
                style={{ flex: 1 }}
            >
                {rows}
            </Animated.View>
        );
    }
}
