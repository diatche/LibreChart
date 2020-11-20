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
    kReuseIDAxes,
} from '../const';
import {
    LayoutEngine,
    LayoutEngineProps
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';
import ChartAxis from './ChartAxis';

type ForwardEvergridProps = Partial<EvergridProps>;

export interface ChartProps extends ForwardEvergridProps, LayoutEngineProps {

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
                return this.renderGrid();
            default: 
                return null;
        }
    }

    renderAxis({ index, reuseID }: IItem<any>) {
        if (!reuseID) {
            return null;
        }
        let axisType = kReuseIDAxes[reuseID];
        let axis = this.layout.axes[axisType];
        if (!axis?.show) {
            return null;
        }
        let range = this.layout.getAxisContainerRangeAtIndex(index, axisType);
        let tickLocations = this.layout.getAxisTickLocations(range[0], range[1], axisType);
        let isInverted = this.layout.isAxisInverted(axisType, this);
        return (
            <ChartAxis
                {...axis.style}
                type={axisType}
                tickLocations={tickLocations}
                getLabel={value => axis?.getLabel(value) || ''}
                isInverted={isInverted}
                onOptimalThicknessChange={thickness => this.layout.onOptimalAxisThicknessChange(
                    thickness,
                    index,
                    axisType,
                    this,
                )}
            />
        );
    }

    renderGrid() {
        if (!this.layout.grid.show) {
            return null;
        }
        let hAxis = this.layout.getHorizontalGridAxis();
        let vAxis = this.layout.getVerticalGridAxis();
        if (!hAxis && !vAxis) {
            return null;
        }
        return (
            <ChartGrid
                {...this.layout.grid.style}
                majorCountX={hAxis?.majorCount || 0}
                minorCountX={hAxis?.minorCount || 0}
                majorCountY={vAxis?.majorCount || 0}
                minorCountY={vAxis?.minorCount || 0}
            />
        );
    }
}
