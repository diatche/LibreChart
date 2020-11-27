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

        // TODO: validate property changes
        // TODO: prevent changing axes on the fly
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
        if (!axis || axis.hidden) {
            return null;
        }
        let range = axis.getContainerRangeAtIndex(index);
        let ticks = axis.scale.getTicksInLocationRange(range[0], range[1]);
        let isInverted = axis.isInverted(this);
        return (
            <ChartAxis
                {...axis.style}
                type={axisType}
                ticks={ticks}
                getTickLabel={tick => axis?.getTickLabel(tick) || ''}
                isInverted={isInverted}
                onOptimalThicknessChange={thickness => axis?.onOptimalThicknessChange(
                    thickness,
                    index,
                )}
            />
        );
    }

    renderGrid() {
        if (this.layout.grid.hidden) {
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
                majorCountX={hAxis?.layoutInfo.majorCount || 0}
                minorCountX={hAxis?.layoutInfo.minorCount || 0}
                majorCountY={vAxis?.layoutInfo.majorCount || 0}
                minorCountY={vAxis?.layoutInfo.minorCount || 0}
            />
        );
    }
}
