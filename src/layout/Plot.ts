import {
    GridLayoutSource,
    IItemUpdateManyOptions,
    LayoutSource,
    FlatLayoutSource,
    LayoutSourceProps,
    IPoint,
    zeroPoint,
    weakref,
} from "evergrid";
import DataSource from "../data/DataSource";
import {
    kChartGridStyleLightDefaults,
    kGridReuseID,
} from '../const';
import {
    IChartGridStyle,
} from "../types";
import {
    axisTypeMap,
    isAxisHorizontal,
} from "./axis/axisUtil";
import {
    AxisTypeMapping,
} from "./axis/axisTypes";
import {
    Axis,
    AxisManyInput,
    ChartLayout,
    ScaleLayout,
} from "../internal";

export interface PlotOptions<X = any, Y = any, DX = any, DY = any> {
    /**
     * Location index of the plot with the top left
     * corner having a location { x: 0, y: 0 } and the
     * next plot under it having a location { x: 0, y: 1 }
     * and so on.
     */
    index?: IPoint;
    xLayout?: ScaleLayout<X, DX>;
    yLayout?: ScaleLayout<Y, DY>;
    dataSources?: DataSource<X, Y>[];
    grid?: IChartGridInput;
    axes?: AxisManyInput;
}

export type PlotManyInput = (Plot | PlotOptions)[];

export interface IChartGridInput {

    /**
     * Toggles grid visiblity.
     * Grid is visible by default.
     */
    hidden?: boolean;

    /**
     * Toggles vertical grid lines.
     * Vertical grid is hidden by default.
     */
    vertical?: boolean;

    /**
     * Toggles horizontal grid lines.
     * Horizontal grid is hidden by default.
     */
    horizontal?: boolean;

    style?: IChartGridStyle;
}

export interface IChartGrid extends IChartGridInput {
    hidden: boolean;
    vertical: boolean;
    horizontal: boolean;
    layout?: LayoutSource;
    style: Required<IChartGridStyle>;
}

export default class Plot<X = any, Y = any, DX = any, DY = any> { 
    index: IPoint;
    dataSources: DataSource<X, Y>[];

    readonly xLayout: ScaleLayout<X, DX>;
    readonly yLayout: ScaleLayout<Y, DY>;

    /** Axis layout info. */
    readonly axes: Partial<AxisTypeMapping<Axis>>;

    /** Grid layout info. */
    readonly grid: IChartGrid;

    private _chartWeakRef = weakref<ChartLayout>();

    constructor(options?: PlotOptions<X, Y, DX, DY>) {
        this.index = options?.index || zeroPoint();
        this.xLayout = options?.xLayout || new ScaleLayout<X, DX>();
        this.yLayout = options?.yLayout || new ScaleLayout<Y, DY>();
        this.dataSources = options?.dataSources || [];
        this.axes = this._validatedAxes(options);
        this.grid = this._validatedGrid(options);
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

    get chart(): ChartLayout {
        return this._chartWeakRef.getOrFail();
    }

    set chart(chart: ChartLayout) {
        if (!chart || !(chart instanceof ChartLayout)) {
            throw new Error('Invalid chart');
        }
        this._chartWeakRef.set(chart);
    }

    configure(chart: ChartLayout) {
        this.chart = chart;
        
        this.xLayout.configure(this);
        this.yLayout.configure(this);

        axisTypeMap(axisType => {
            let axis = this.axes[axisType];
            axis?.configure(this);
        });

        this.grid.layout = this._createGridLayout(this.grid);

        for (let dataSource of this.dataSources) {
            dataSource.configure(this);
        }

        this.update();
    }

    unconfigure() {
        axisTypeMap(axisType => {
            let axis = this.axes[axisType];
            axis?.unconfigure();
        });
    
        this.grid.layout = undefined;

        for (let dataSource of this.dataSources) {
            dataSource.unconfigure();
        }
    }

    update() {
        let xChanged = this.xLayout.update();
        let yChanged = this.yLayout.update();
        if (!xChanged && !yChanged) {
            return;
        }
        let allChanged = xChanged && yChanged;

        if (this.xLayout.layoutInfo.recenteringOffset || this.yLayout.layoutInfo.recenteringOffset) {
            // FIXME: We are assuming that the plot controls
            // the chart, but this may be an independent plot.
            this.chart.scrollBy({
                offset: {
                    x: this.xLayout.layoutInfo.recenteringOffset,
                    y: this.yLayout.layoutInfo.recenteringOffset,
                }
            });
        }

        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
            // animated: true,
            // timing: {
            //     duration: 200,
            // }
        };
        
        axisTypeMap(axisType => {
            let axis = this.axes[axisType];
            if (axis && (allChanged || (isAxisHorizontal(axisType) ? xChanged : yChanged))) {
                axis.update(updateOptions);
            };
        });

        for (let dataSource of this.dataSources) {
            dataSource.layout?.updateItems(updateOptions);
        }
        
        this.grid.layout?.updateItems(updateOptions);
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

    private _validatedGrid(props: PlotOptions | undefined): IChartGrid {
        return {
            hidden: false,
            vertical: false,
            horizontal: false,
            ...props?.grid,
            style: {
                ...kChartGridStyleLightDefaults,
                ...props?.grid?.style,
            },
        };
    }

    private _createGridLayout(grid: IChartGrid): LayoutSource | undefined {
        let {
            hidden,
            vertical,
            horizontal,
        } = grid;

        if (hidden) {
            vertical = false;
            horizontal = false;
        }

        if (!vertical && !horizontal) {
            return undefined;
        }

        let commonProps: LayoutSourceProps<any> = {
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
        }

        if (vertical && horizontal) {
            return new GridLayoutSource({
                ...commonProps,
                itemSize: {
                    x: this.xLayout.layoutInfo.containerLength$,
                    y: this.yLayout.layoutInfo.containerLength$,
                },
            });
        } else if (vertical) {
            return new FlatLayoutSource({
                ...commonProps,
                itemSize: {
                    x: this.xLayout.layoutInfo.containerLength$,
                    y: this.yLayout.layoutInfo.containerLength$,
                },
                getItemViewLayout: () => ({
                    offset: { y: 0 },
                    size: { y: '100%' }
                }),
                horizontal: true,
                stickyEdge: 'bottom',
                itemOrigin: { x: 0, y: 1 },
            });
        } else if (horizontal) {
            return new FlatLayoutSource({
                ...commonProps,
                itemSize: {
                    x: this.xLayout.layoutInfo.containerLength$,
                    y: this.yLayout.layoutInfo.containerLength$,
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
}
