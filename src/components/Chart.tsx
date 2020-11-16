import React from 'react';
import Evergrid, {
    EvergridProps,
    LayoutSource,
    IItem,
    isAxisType,
} from 'evergrid'
import {
    kPointReuseID,
    kGridReuseID,
    kAxisDirection,
    kAxisReuseIDs,
    kReuseIDAxes,
    kAxisStyleLightDefaults,
} from '../const';
import {
    LayoutEngine,
    LayoutEngineProps
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';
import ChartAxis from './ChartAxis';
import { IChartStyle } from '../types';

type ForwardEvergridProps = Partial<EvergridProps>;

export interface ChartProps extends ForwardEvergridProps, LayoutEngineProps, IChartStyle {

}

interface ChartState {}

export default class Chart extends React.PureComponent<ChartProps, ChartState> {
    innerRef = React.createRef<Evergrid>();
    layout: LayoutEngine;

    constructor(props: ChartProps) {
        super(props);
        this.layout = new LayoutEngine(props);
    }

    get innerView() {
        return this.innerRef.current;
    }

    componentDidMount() {
        this.layout.configure(this);
    }

    componentWillUnmount() {
        this.layout.unconfigure(this);
    }

    getLayoutSources(): LayoutSource[] {
        return [
            ...this.layout.getLayoutSources(),
            ...this.props.layoutSources || [],
        ];
    }

    getChartStyle(): Required<IChartStyle> {
        // TODO: cache labels until prop change
        return {
            ...kAxisStyleLightDefaults,
            ...this.props,
        };
    }

    updateLayout() {
        this.layout.scheduleUpdate(this);
    }

    render() {
        return (
            <Evergrid
                anchor={{ x: 0.5, y: 0.5 }}
                {...this.props}
                ref={this.innerRef}
                layoutSources={this.getLayoutSources()}
                renderItem={(item: IItem<any>) => this.renderItem(item)}
                onViewportSizeChanged={() => this.updateLayout()}
                onScaleChanged={() => this.updateLayout()}
            />
        );
    }

    renderItem(item: IItem<any>) {
        if (item.reuseID && isAxisType(kReuseIDAxes[item.reuseID])) {
            return this.renderAxis(item);
        }

        switch (item.reuseID) {
            case kPointReuseID:
                return <ChartPoint diameter={item.animated.viewLayout.size.x} />;
            case kGridReuseID:
                return (
                    <ChartGrid
                        majorCountX={this.layout.gridInfo.majorCount.x}
                        majorCountY={this.layout.gridInfo.majorCount.y}
                    />
                );
            default: 
                return null;
        }
    }

    renderAxis({ index, reuseID }: IItem<any>) {
        if (!reuseID) {
            return null;
        }
        let axisType = kReuseIDAxes[reuseID];
        let chartStyle = this.getChartStyle();
        let direction = kAxisDirection[axisType];
        let range = this.layout.getGridContainerRangeAtIndex(index, direction);
        let tickLocations = this.layout.getTickLocations(range[0], range[1], direction);
        let isInverted = this.layout.isAxisInverted(direction, this);
        return (
            <ChartAxis
                {...chartStyle}
                type={axisType}
                tickLocations={tickLocations}
                isInverted={isInverted}
                thicknessStep={this.layout.axisInfo[axisType].thicknessStep}
                onOptimalThicknessChange={thickness => this.layout.onOptimalAxisThicknessChange(
                    thickness,
                    index,
                    axisType,
                    this,
                )}
            />
        );
    }
}
