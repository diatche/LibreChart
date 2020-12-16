import React from 'react';
import Evergrid, {
    EvergridProps,
    IItem,
    IPoint,
    ItemRenderMap,
} from 'evergrid'
import {
    ChartLayout,
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';
import ChartAxisContent from './ChartAxisContent';
import {
    kAxisBackgroundReuseIDTypes,
    kAxisContentReuseIDTypes,
} from '../layout/axis/axisConst';
import ChartAxisBackground from './ChartAxisBackground';
import LineDataSource from '../data/LineDataSource';
import { IDataPointStyle } from '../types';
import ChartLine from './ChartLine';
import Plot from '../layout/Plot';
import { axisTypeMap } from '../layout/axis/axisUtil';

type ForwardEvergridProps = Partial<EvergridProps>;

export interface ChartProps extends ForwardEvergridProps {
    layout: ChartLayout;
}

interface ChartState {}

export default class Chart extends React.PureComponent<ChartProps, ChartState> {
    innerRef = React.createRef<Evergrid>();
    layout: ChartLayout;
    itemRenderMap: ItemRenderMap;

    constructor(props: ChartProps) {
        super(props);
        this.layout = props.layout;

        this.itemRenderMap = {};
        this.updateItemRenderMap();

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

    updateItemRenderMap() {
        let itemRenderMap: ItemRenderMap = {};
        for (let plot of this.layout.plots) {
            // Grid
            if (plot.grid.layout) {
                itemRenderMap[plot.grid.layout.id] = {
                    renderItem: (item, layoutSource, context) => (
                        this.renderGrid(context)
                    ),
                    context: plot,
                };
            }

            // Axes
            axisTypeMap(axisType => {
                let axis = plot.axes[axisType];
                if (!axis) {
                    return;
                }
                if (axis.contentLayout) {
                    itemRenderMap[axis.contentLayout.id] = {
                        renderItem: (item, layoutSource, context) => (
                            this.renderAxisContent(item, context)
                        ),
                        context: plot,
                    };
                }
                if (axis.backgroundLayout) {
                    itemRenderMap[axis.backgroundLayout.id] = {
                        renderItem: (item, layoutSource, context) => (
                            this.renderAxisBackground(item, context)
                        ),
                        context: plot,
                    };
                }
            });

            // Data
            for (let dataSource of plot.dataSources) {
                switch (dataSource.type) {
                    case 'path':
                        itemRenderMap[dataSource.layout.id] = {
                            renderItem: (item, layoutSource, context) => (
                                this.renderPath(item, context)
                            ),
                            context: dataSource as LineDataSource,
                        };
                        break;
                    case 'point':
                        itemRenderMap[dataSource.layout.id] = {
                            renderItem: (item, layoutSource, context) => (
                                <ChartPoint diameter={item.animated.viewLayout.size.x} />
                            ),
                            context: dataSource as LineDataSource,
                        };
                        break;
                }
            }
        }
        this.itemRenderMap = itemRenderMap;
    }

    render() {
        return (
            <Evergrid
                {...this.props}
                ref={this.innerRef}
                renderItem={this.itemRenderMap}
                layout={this.layout}
            />
        );
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
        let rect = dataSource.getContainerCanvasRect(item.index);
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

        // console.debug(`${JSON.stringify(item.index)} rect: ` + JSON.stringify(rect));
        // console.debug(`${JSON.stringify(item.index)} path: ` + path);
        return (
            <ChartLine
                rect={rect}
                path={path}
                points={pointsToDraw}
                pointStyles={pointStyles}
                scale={dataSource.layout.root.scale$}
                {...dataSource.style}
            />
        );
    }

    renderAxisContent({ index, reuseID }: IItem<any>, plot: Plot) {
        if (!reuseID) {
            return null;
        }
        let axisType = kAxisContentReuseIDTypes[reuseID];
        let axis = plot.axes[axisType];
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

    renderAxisBackground({ reuseID }: IItem<any>, plot: Plot) {
        if (!reuseID) {
            return null;
        }
        let axisType = kAxisBackgroundReuseIDTypes[reuseID];
        let axis = plot.axes[axisType];
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

    renderGrid(plot: Plot) {
        if (plot.grid.hidden) {
            return null;
        }
        let hAxis = plot.grid.horizontalAxis;
        let vAxis = plot.grid.verticalAxis;
        if (!hAxis && !vAxis) {
            return null;
        }
        return (
            <ChartGrid
                {...plot.grid.style}
                majorCountX={hAxis?.layoutInfo.majorCount || 0}
                minorCountX={hAxis?.layoutInfo.minorCount || 0}
                majorCountY={vAxis?.layoutInfo.majorCount || 0}
                minorCountY={vAxis?.layoutInfo.minorCount || 0}
            />
        );
    }
}
