import {
    GridLayoutSource,
    IItemUpdateManyOptions,
    LayoutSource,
    FlatLayoutSource,
    LayoutSourceProps,
    IPoint,
    zeroPoint,
} from "evergrid";
import DataSource from "../data/DataSource";
import {
    kChartGridStyleLightDefaults,
    kGridReuseID,
} from '../const';
import {
    IChartGridStyle,
} from "../types";
import Axis, { AxisManyInput } from "./axis/Axis";
import {
    axisTypeMap,
    isAxisHorizontal,
} from "./axis/axisUtil";
import {
    AxisType,
    AxisTypeMapping,
} from "./axis/axisTypes";

export interface PlotOptions {
    /**
     * Location index of the plot with the top left
     * corner having a location { x: 0, y: 0 } and the
     * next plot under it having a location { x: 0, y: 1 }
     * and so on.
     */
    index?: IPoint;
    dataSources?: DataSource[];
    grid?: IChartGridInput;
    axes?: AxisManyInput;
}

export type PlotManyInput = (Plot | PlotOptions)[];

export interface IChartGridInput {
    /**
     * Toggles grid visiblity.
     * Grid is visible by default.
     **/
    hidden?: boolean;

    horizontalAxis?: AxisType | Axis;
    verticalAxis?: AxisType | Axis;

    style?: IChartGridStyle;
}

export interface IChartGrid extends IChartGridInput {
    hidden: boolean;
    layout?: LayoutSource;
    horizontalAxis?: Axis;
    verticalAxis?: Axis;
    style: Required<IChartGridStyle>;
}

export default class Plot { 
    index: IPoint;
    dataSources: DataSource[];

    /** Axis layout info. */
    readonly axes: Partial<AxisTypeMapping<Axis>>;

    /** Grid layout info. */
    readonly grid: IChartGrid;

    constructor(options?: PlotOptions) {
        this.index = options?.index || zeroPoint();
        this.dataSources = options?.dataSources || [];
        this.axes = this._validatedAxes(options);
        this.grid = this._validatedGrid(this.axes, options);
    }

    static createMany(input: PlotManyInput | undefined): Plot[] {
        if (!input) {
            return [];
        }

        let plot: Plot;
        let index = zeroPoint();
        let indexes = new Set<string>();
        let plots: Plot[] = [];
        for (let plotOrOptions of input) {
            if (plotOrOptions instanceof Plot) {
                plot = plotOrOptions;
            } else {
                // Shift plots down by default
                index.y += 1;
                plot = new Plot({
                    index: { ...index },
                    ...plotOrOptions,
                });
            }
            let indexStr = `{ x: ${index.x}, y: ${index.y} }`;
            if (indexes.has(indexStr)) {
                throw new Error(`There are more than one plot at index: ${indexStr}`);
            }
            indexes.add(indexStr);
            index = { ...plot.index };
            plots.push(plot);
        }
        return plots;
    }

    updatePlot() {
        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
            // animated: true,
            // timing: {
            //     duration: 200,
            // }
        };

        let anyChanges = false;
        let changes = axisTypeMap(axisType => {
            let changed = this.axes[axisType]?.update(
                updateOptions,
            );
            if (changed) {
                anyChanges = true;
            }
            return changed;
        });
        if (!anyChanges) {
            return;
        }

        for (let dataSource of this.dataSources) {
            dataSource.layout.updateItems(updateOptions);
        }
        
        if (
            this.grid.layout && (
                this.grid.horizontalAxis && changes[this.grid.horizontalAxis.axisType]
                || this.grid.verticalAxis && changes[this.grid.verticalAxis.axisType]
            )
        ) {
            this.grid.layout.updateItems(updateOptions);
        }
    }

    getLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            // Grid in back by default
            this.grid?.layout,
            // Data above grid and below axes
            ...(this.dataSources || []).map(d => d.layout),
            // Horizontal axes below vertical axes
            this.axes?.bottomAxis?.backgroundLayout,
            this.axes?.bottomAxis?.contentLayout,
            this.axes?.topAxis?.backgroundLayout,
            this.axes?.topAxis?.contentLayout,
            this.axes?.rightAxis?.backgroundLayout,
            this.axes?.rightAxis?.contentLayout,
            this.axes?.leftAxis?.backgroundLayout,
            this.axes?.leftAxis?.contentLayout,
        ].filter(s => !!s) as LayoutSource[];
    }

    private _validatedAxes(props: PlotOptions | undefined): Partial<AxisTypeMapping<Axis>> {
        return Axis.createMany(props?.axes);
    }

    private _validatedGrid(
        axes: Partial<AxisTypeMapping<Axis>>,
        props: PlotOptions | undefined,
    ): IChartGrid {
        let gridAxes = Plot._validatedGridAxes(props?.grid, axes);
        let grid: IChartGrid = {
            hidden: false,
            ...props?.grid,
            horizontalAxis: gridAxes.horizontalAxis,
            verticalAxis: gridAxes.verticalAxis,
            style: {
                ...kChartGridStyleLightDefaults,
                ...props?.grid?.style,
            },
        };
        grid.layout = this._createGridLayout(grid, props);
        return grid;
    }

    private _createGridLayout(
        grid: IChartGrid,
        props: PlotOptions | undefined,
    ): LayoutSource | undefined {
        let {
            horizontalAxis: xAxis,
            verticalAxis: yAxis,
        } = grid;

        if (!xAxis && !yAxis) {
            return undefined;
        }

        let commonProps: LayoutSourceProps<any> = {
            ...props?.grid,
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
        }

        if (xAxis && yAxis) {
            return new GridLayoutSource({
                ...commonProps,
                itemSize: {
                    x: xAxis.layoutInfo.containerLength$,
                    y: yAxis.layoutInfo.containerLength$,
                },
            });
        } else if (xAxis) {
            return new FlatLayoutSource({
                ...commonProps,
                itemSize: {
                    x: xAxis.layoutInfo.containerLength$,
                    y: xAxis.layoutInfo.containerLength$,
                },
                getItemViewLayout: () => ({
                    offset: { y: 0 },
                    size: { y: '100%' }
                }),
                horizontal: true,
                stickyEdge: 'bottom',
                itemOrigin: { x: 0, y: 1 },
            });
        } else if (yAxis) {
            return new FlatLayoutSource({
                ...commonProps,
                itemSize: {
                    x: yAxis.layoutInfo.containerLength$,
                    y: yAxis.layoutInfo.containerLength$,
                },
                getItemViewLayout: () => ({
                    offset: { x: 0 },
                    size: { x: '100%' }
                }),
                stickyEdge: 'left',
                itemOrigin: { x: 0, y: 0 },
            });
        }

        return undefined;
    }

    private static _validatedGridAxes(
        grid: IChartGridInput | undefined,
        axes: Partial<AxisTypeMapping<Axis>>,
    ): Pick<IChartGrid, 'horizontalAxis' | 'verticalAxis'> {
        let {
            horizontalAxis: xAxisOrType,
            verticalAxis: yAxisOrType,
        } = grid || {};

        let xAxis: Axis | undefined;
        if (xAxisOrType && typeof xAxisOrType === 'string') {
            xAxis = axes[xAxisOrType];
            if (!xAxis) {
                throw new Error(`The grid is using the axis "${xAxisOrType}", but the axis is null. Set the property "axes.${xAxisOrType}" to valid axis instance.`);
            }
        } else {
            xAxis = xAxisOrType;
        }
        if (xAxis && !isAxisHorizontal(xAxis.axisType)) {
            throw new Error('Invalid horizontal grid axis type');
        }

        let yAxis: Axis | undefined;
        if (yAxisOrType && typeof yAxisOrType === 'string') {
            yAxis = axes[yAxisOrType];
            if (!yAxis) {
                throw new Error(`The grid is using the axis "${yAxisOrType}", but the axis is null. Set the property "axes.${yAxisOrType}" to valid axis instance.`);
            }
        } else {
            yAxis = yAxisOrType;
        }
        if (yAxis && isAxisHorizontal(yAxis.axisType)) {
            throw new Error('Invalid vertical grid axis type');
        }
        return {
            horizontalAxis: xAxis,
            verticalAxis: yAxis,
        };
    }
}
