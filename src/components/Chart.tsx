import React from 'react';
import {
    ChartLayout,
    Plot,
    PlotLayout,
} from '../internal';
import { View, ViewProps } from 'react-native';

export interface ChartProps extends ViewProps {
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
        let plots: React.ReactNode[] = [];
        for (let i = 0; i < this.layout.plots.length; i++) {
            plots.push(this.renderPlot(
                this.layout.plots[i],
                { key: i }
            ));
        }

        return (
            <View
                {...this.props}
                style={this.props.style}
            >
                {plots}
            </View>
        );
    }

    renderPlot(
        plot: PlotLayout,
        props: {
            key: number | string;
        }
    ) {
        return (
            <Plot
                {...props}
                layout={plot}
                style={{
                    flex: 1,
                    // borderWidth: 2,
                    // borderColor: 'gray',
                }}
            />
        );
    }
}
