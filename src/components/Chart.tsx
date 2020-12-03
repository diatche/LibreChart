import React from 'react';
import Evergrid, {
    EvergridProps,
    IItem,
} from 'evergrid'
import {
    kPointReuseID,
    kGridReuseID,
} from '../const';
import {
    ChartLayout,
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';
import ChartAxis from './ChartAxis';
import {
    kAxisBackgroundReuseIDSet,
    kAxisBackgroundReuseIDTypes,
    kAxisContentReuseIDSet,
    kAxisContentReuseIDTypes,
} from '../utils/axisConst';
import ChartAxisBackground from './ChartAxisBackground';

type ForwardEvergridProps = Partial<EvergridProps>;

export interface ChartProps extends ForwardEvergridProps {
    layout: ChartLayout;
}

interface ChartState {}

export default class Chart extends React.PureComponent<ChartProps, ChartState> {
    innerRef = React.createRef<Evergrid>();
    layout: ChartLayout;

    constructor(props: ChartProps) {
        super(props);
        this.layout = props.layout;

        // TODO: validate property changes
        // TODO: prevent changing axes on the fly
    }

    get innerView() {
        return this.innerRef.current;
    }

    componentDidMount() {
        this.layout.configure();
    }

    componentWillUnmount() {
        this.layout.unconfigure();
    }

    render() {
        return (
            <Evergrid
                {...this.props}
                ref={this.innerRef}
                renderItem={(item: IItem<any>) => this.renderItem(item)}
                layout={this.layout}
            />
        );
    }

    renderItem(item: IItem<any>) {
        if (!item.reuseID) {
            return null;
        }
        
        // let itemDebug = {
        //     reuseID: item.reuseID,
        //     index: item.index,
        //     contentLayout: item.contentLayout,
        // };
        // console.debug('rendering item: ' + JSON.stringify(itemDebug, null, 2));

        if (kAxisContentReuseIDSet.has(item.reuseID)) {
            return this.renderAxisContent(item);
        }
        if (kAxisBackgroundReuseIDSet.has(item.reuseID)) {
            return this.renderAxisBackground(item);
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

    renderAxisContent({ index, reuseID }: IItem<any>) {
        if (!reuseID) {
            return null;
        }
        let axisType = kAxisContentReuseIDTypes[reuseID];
        let axis = this.layout.axes[axisType];
        if (!axis || axis.hidden) {
            return null;
        }
        let range = axis.getContainerRangeAtIndex(index);
        let ticks = axis.scale.getTicksInLocationRange(range[0], range[1]);
        let isInverted = axis.isInverted();
        let labelLength = axis.layoutInfo.containerLength * axis.layoutInfo.viewScale / ticks.length - axis.style.labelMargin * 2;
        return (
            <ChartAxis
                {...axis.style}
                axisType={axisType}
                ticks={ticks}
                getTickLabel={tick => axis?.getTickLabel(tick) || ''}
                labelLength={labelLength}
                isInverted={isInverted}
                onOptimalThicknessChange={thickness => axis?.onOptimalThicknessChange(
                    thickness,
                    index,
                )}
            />
        );
    }

    renderAxisBackground({ reuseID }: IItem<any>) {
        if (!reuseID) {
            return null;
        }
        let axisType = kAxisBackgroundReuseIDTypes[reuseID];
        let axis = this.layout.axes[axisType];
        if (!axis || axis.hidden) {
            return null;
        }
        return (
            <ChartAxisBackground
                {...axis.style}
                axisType={axis.axisType}
                majorCount={axis.layoutInfo.majorCount}
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
