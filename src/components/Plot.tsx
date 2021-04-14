import React from 'react';
import Evergrid, {
    EvergridProps,
    IItem,
    IPoint,
    ItemRenderMap,
} from 'evergrid';
import { Axis, normalizedLabelSafe, PlotLayout } from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';
import ChartAxisContent from './ChartAxisContent';
import ChartAxisBackground from './ChartAxisBackground';
import LineDataSource, { ILineDataStyle } from '../data/LineDataSource';
import ChartLine from './ChartLine';
import { axisTypeMap } from '../layout/axis/axisUtil';
import RectDataSource from '../data/RectDataSource';
import ChartRect from './ChartRect';
import LabelDataSource from '../data/LabelDataSource';
import ChartLabel from './ChartLabel';

type ForwardEvergridProps = Partial<EvergridProps>;

export interface PlotProps extends ForwardEvergridProps {
    layout: PlotLayout;
}

interface ChartState {}

export default class Chart extends React.PureComponent<PlotProps, ChartState> {
    innerRef = React.createRef<Evergrid>();
    layout: PlotLayout;
    itemRenderMap: ItemRenderMap;

    constructor(props: PlotProps) {
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

    updateItemRenderMap() {
        let itemRenderMap: ItemRenderMap = {};

        // // Reference
        // if (this.layout.refLayout) {
        //     itemRenderMap[this.layout.refLayout.id] = {
        //         renderItem: () => null,
        //         context: null,
        //     };
        // }

        // Grid
        if (this.layout.grid.layout) {
            itemRenderMap[this.layout.grid.layout.id] = {
                renderItem: (item, layoutSource, context) =>
                    this.renderGrid(context),
                context: this.layout,
            };
        }

        // Axes
        axisTypeMap(axisType => {
            let axis = this.layout.axes[axisType];
            if (!axis) {
                return;
            }
            if (axis.contentLayout) {
                itemRenderMap[axis.contentLayout.id] = {
                    renderItem: (item, layoutSource, context) =>
                        this.renderAxisContent(item, context),
                    context: axis,
                };
            }
            if (axis.backgroundLayout) {
                itemRenderMap[axis.backgroundLayout.id] = {
                    renderItem: (item, layoutSource, context) =>
                        this.renderAxisBackground(item, context),
                    context: axis,
                };
            }
        });

        // Data
        for (let dataSource of this.layout.dataSources) {
            if (!dataSource.layout) {
                continue;
            }
            switch (dataSource.type) {
                case 'path':
                    itemRenderMap[dataSource.layout.id] = {
                        renderItem: (item, layoutSource, context) =>
                            this.renderPath(item, context),
                        context: dataSource as LineDataSource,
                    };
                    break;
                case 'point':
                    itemRenderMap[dataSource.layout.id] = {
                        renderItem: (item, layoutSource, context) => (
                            <ChartPoint
                                diameter={item.animated.viewLayout.size.x}
                            />
                        ),
                        context: dataSource as LineDataSource,
                    };
                    break;
                case 'rect':
                    itemRenderMap[dataSource.layout.id] = {
                        renderItem: (item, layoutSource, context) =>
                            this.renderRect(item, context),
                        context: dataSource as RectDataSource,
                    };
                    break;
                case 'label':
                    itemRenderMap[dataSource.layout.id] = {
                        renderItem: (item, layoutSource, context) =>
                            this.renderLabel(item, context),
                        context: dataSource as LabelDataSource,
                    };
                    break;
                default:
                    throw new Error(
                        `Unsupported data source type: ${dataSource.type}`
                    );
            }
        }
        this.itemRenderMap = itemRenderMap;
    }

    render() {
        // TODO: Add customisable style prop
        return (
            <Evergrid
                {...this.props}
                ref={this.innerRef}
                renderItem={this.itemRenderMap}
                layout={this.layout}
                style={this.props.style}
            />
        );
    }

    renderPath(
        item: IItem<IPoint>,
        dataSource: LineDataSource
    ): React.ReactNode {
        if (!dataSource.layout) {
            return null;
        }
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
        let pointStyles: (ILineDataStyle | undefined)[] | undefined;
        if (dataSource.itemStyle) {
            let hasItemStyle = false;
            pointStyles = points.map(p => {
                let itemStyle = dataSource.itemStyle!(
                    dataSource.data[p.dataIndex],
                    p
                );
                if (
                    !hasItemStyle &&
                    itemStyle &&
                    Object.keys(itemStyle).length !== 0
                ) {
                    hasItemStyle = true;
                }
                return itemStyle;
            });
            if (!hasItemStyle) {
                pointStyles = undefined;
            }
        }

        // console.debug(`${JSON.stringify(item.index)} rect: ` + JSON.stringify(rect));
        // console.debug(`${JSON.stringify(item.index)} path: ` + path);
        return (
            <ChartLine
                rect={rect}
                path={path}
                points={points}
                pointStyles={pointStyles}
                {...dataSource.style}
            />
        );
    }

    renderRect(
        item: IItem<number>,
        dataSource: RectDataSource
    ): React.ReactNode {
        let dataItem = dataSource.data[item.index];
        return (
            <ChartRect
                {...dataSource.style}
                {...dataSource.itemStyle?.(dataItem, item.index)}
            />
        );
    }

    renderLabel(
        item: IItem<number>,
        dataSource: LabelDataSource
    ): React.ReactNode {
        let dataItem = dataSource.data[item.index];
        let itemStyle = dataSource.getItemStyle(item.index);
        let label = normalizedLabelSafe(
            dataSource.getLabel(dataItem, itemStyle)
        );
        return (
            <ChartLabel
                {...itemStyle}
                {...label}
                alignX={itemStyle?.align?.x || label.align?.x}
                alignY={itemStyle?.align?.y || label.align?.y}
            />
        );
    }

    renderAxisContent(
        { index, reuseID }: IItem<any>,
        axis: Axis
    ): React.ReactNode {
        if (axis.hidden) {
            return null;
        }
        let scaleLayout = axis.scaleLayout;
        if (!scaleLayout) {
            return null;
        }
        let range = scaleLayout.getContainerRangeAtIndex(index);
        let ticks = scaleLayout.scale.getTicksInLocationRange(
            range[0],
            range[1]
        );
        let isInverted = scaleLayout.isInverted();
        let labelLength =
            (scaleLayout.layoutInfo.containerLength *
                scaleLayout.layoutInfo.viewScale) /
            ticks.length;
        return (
            <ChartAxisContent
                {...axis.style}
                axisType={axis.axisType}
                ticks={ticks}
                getTickLabel={tick => axis?.getTickLabel(tick) || ''}
                labelLength={labelLength}
                majorViewInterval={
                    scaleLayout.layoutInfo.majorViewInterval$ || 0
                }
                isInverted={isInverted}
                onOptimalThicknessChange={thickness =>
                    axis?.setOptimalThickness(thickness, index)
                }
            />
        );
    }

    renderAxisBackground({ reuseID }: IItem<any>, axis: Axis): React.ReactNode {
        if (axis.hidden) {
            return null;
        }
        return <ChartAxisBackground {...axis.style} axisType={axis.axisType} />;
    }

    renderGrid(plot: PlotLayout): React.ReactNode {
        if (plot.grid.hidden) {
            return null;
        }
        let xLayout = plot.grid.vertical ? plot.xLayout : undefined;
        let yLayout = plot.grid.horizontal ? plot.yLayout : undefined;
        if (!xLayout && !yLayout) {
            return null;
        }
        return (
            <ChartGrid
                {...plot.grid.style}
                majorCountX={xLayout?.layoutInfo.majorCount || 0}
                minorCountX={xLayout?.layoutInfo.minorCount || 0}
                majorCountY={yLayout?.layoutInfo.majorCount || 0}
                minorCountY={yLayout?.layoutInfo.minorCount || 0}
            />
        );
    }
}
