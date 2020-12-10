import {
    LayoutSource,
    IPoint,
    zeroPoint,
    weakref,
} from "evergrid";
import DataSource from "../data/DataSource";
import {
    axisTypeMap,
} from "./axis/axisUtil";
import {
    Axis,
    AxisManyInput,
    ChartLayout,
    Grid,
    IAxes,
    IChartGridInput,
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
    grid?: IChartGridInput | Grid;
    axes?: AxisManyInput;
}

export type PlotManyInput = (Plot | PlotOptions)[];

export default class Plot<X = any, Y = any, DX = any, DY = any> { 
    index: IPoint;
    dataSources: DataSource<X, Y>[];

    readonly xLayout: ScaleLayout<X, DX>;
    readonly yLayout: ScaleLayout<Y, DY>;

    /** Axis layout info. */
    readonly axes: IAxes<X, Y, DX, DY>;

    /** Grid layout info. */
    readonly grid: Grid;

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
        
        this.xLayout.configure(this, { isHorizontal: true });
        this.yLayout.configure(this, { isHorizontal: false });

        axisTypeMap(axisType => {
            let axis = this.axes[axisType];
            axis?.configure(this);
        });

        this.grid.configure(this);

        for (let dataSource of this.dataSources) {
            dataSource.configure(this);
        }
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

    private _validatedAxes(props: PlotOptions | undefined): IAxes<X, Y, DX, DY> {
        return Axis.createMany(props?.axes);
    }

    private _validatedGrid(props: PlotOptions | undefined): Grid {
        let gridOrOptions = props?.grid || {};
        if (gridOrOptions instanceof Grid) {
            return gridOrOptions;
        }
        return new Grid(gridOrOptions);
    }
}
