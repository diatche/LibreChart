import React from 'react';
import Evergrid, {
    EvergridProps,
    IItem,
    IPoint,
} from 'evergrid'
import {
    kGridReuseID,
} from '../const';
import {
    ChartLayout,
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';
import ChartAxisContent from './ChartAxisContent';
import {
    kAxisBackgroundReuseIDSet,
    kAxisBackgroundReuseIDTypes,
    kAxisContentReuseIDSet,
    kAxisContentReuseIDTypes,
} from '../layout/axis/axisConst';
import ChartAxisBackground from './ChartAxisBackground';
import ChartCanvasLine from './ChartCanvasLine';
import LineDataSource from '../data/LineDataSource';
import { IDataPointStyle } from '../types';
import ChartLine from './ChartLine';

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
            case kGridReuseID:
                return this.renderGrid();
        }

        for (let dataSource of this.layout.dataSources) {
            if (dataSource.ownsItem(item)) {
                switch (dataSource.type) {
                    case 'path':
                        return this.renderPath(item, dataSource as LineDataSource);
                    case 'point':
                        return <ChartPoint diameter={item.animated.viewLayout.size.x} />;
                }
            }
        }

        console.warn(`Unknown item reuse ID: ${item.reuseID}`);
        return null;
    }

    renderPath(item: IItem<IPoint>, dataSource: LineDataSource) {
        let points = dataSource.getCanvasPointsInContainer(item.index);
        if (points.length === 0) {
            return null;
        }
        let line = dataSource.getCanvasLinePath();
        let path = line(points);
        if (!path) {
            return null;
        }
        let pointsToDraw = points;
        let pointsLen = pointsToDraw.length;
        if (pointsLen !== 0) {
            if (pointsToDraw[0].clipped && pointsToDraw[pointsLen - 1].clipped) {
                pointsToDraw = pointsToDraw.slice(1, -1);
            } else if (pointsToDraw[0].clipped) {
                pointsToDraw = pointsToDraw.slice(1);
            } else if (pointsToDraw[pointsLen - 1].clipped) {
                pointsToDraw = pointsToDraw.slice(0, -1);
            }
        }
        let pointStyles: (IDataPointStyle | undefined)[] | undefined = pointsToDraw.map(p => dataSource.data[p.dataIndex].style);
        if (!pointStyles.find(s => s && Object.keys(s).length !== 0)) {
            pointStyles = undefined;
        }

        // console.debug(`${JSON.stringify(item.index)} viewBox: ` + dataSource.getViewBox());
        // console.debug(`${JSON.stringify(item.index)} path: ` + path);
        // console.debug(`${JSON.stringify(item.index)} point styles: ` + JSON.stringify(pointStyles, null, 2));
        return (
            <ChartLine
                // line={line}
                path={path}
                points={pointsToDraw}
                pointStyles={pointStyles}
                overlap={dataSource.overlap}
                viewBox={dataSource.getViewBox()}
                scale={dataSource.layout.root.scale$.x}
                {...dataSource.style}
            />
        );
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
            <ChartAxisContent
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
