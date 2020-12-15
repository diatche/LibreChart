import {
    LayoutSource,
    IPoint,
    zeroPoint,
    weakref,
    GridLayoutSource,
    LayoutSourceProps,
    ILayout,
    EvergridLayoutCallbacks,
    EvergridLayoutProps,
    EvergridLayout,
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
import { Animated, InteractionManager } from "react-native";
import { Cancelable } from "../types";
import debounce from "lodash.debounce";

const kGridUpdateDebounceInterval = 100;

export interface PlotLayoutOptions<X = any, Y = any, DX = any, DY = any> extends EvergridLayoutCallbacks, Omit<EvergridLayoutProps, 'layoutSources'> {
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

export type PlotLayoutManyInput = (PlotLayout | PlotLayoutOptions)[];

export default class PlotLayout<X = any, Y = any, DX = any, DY = any> extends EvergridLayout { 
    index: IPoint;
    dataSources: DataSource<X, Y>[];

    readonly xLayout: ScaleLayout<X, DX>;
    readonly yLayout: ScaleLayout<Y, DY>;

    /** Axis layout info. */
    readonly axes: IAxes<X, Y, DX, DY>;

    /** Grid layout info. */
    readonly grid: Grid;

    // /** Reference grid layout (not displayed). */
    // refLayout?: GridLayoutSource;

    private _chartWeakRef = weakref<ChartLayout>();

    constructor(options?: PlotLayoutOptions<X, Y, DX, DY>) {
        super(options);
        if (!options?.anchor) {
            this.anchor$.setValue({ x: 0.5, y: 0.5 });
        }
        
        this.index = options?.index || zeroPoint();
        this.xLayout = options?.xLayout || new ScaleLayout<X, DX>();
        this.yLayout = options?.yLayout || new ScaleLayout<Y, DY>();
        this.dataSources = options?.dataSources || [];
        this.axes = this._validatedAxes(options);
        this.grid = this._validatedGrid(options);
    }

    static createMany(input: PlotLayoutManyInput | undefined): PlotLayout[] {
        if (!input) {
            return [];
        }

        let plot: PlotLayout;
        let index = zeroPoint();
        let indexes = new Set<string>();
        let plots: PlotLayout[] = [];
        for (let plotOrOptions of input) {
            if (plotOrOptions instanceof PlotLayout) {
                plot = plotOrOptions;
            } else {
                // Shift plots down by default
                index.y += 1;
                plot = new PlotLayout({
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

    configurePlot(chart: ChartLayout) {
        this.chart = chart;
        
        // this.refLayout = this._createRefLayout();

        this.xLayout.configure(this, { isHorizontal: true });
        this.yLayout.configure(this, { isHorizontal: false });

        // this.scrollToOffset({
        //     offset: {
        //         x: -this.xLayout.scale.locationOfValue(this.xLayout.scale.zeroValue()).toNumber(),
        //         y: -this.yLayout.scale.locationOfValue(this.yLayout.scale.zeroValue()).toNumber(),
        //     }
        // });

        axisTypeMap(axisType => {
            let axis = this.axes[axisType];
            axis?.configure(this);
        });

        this.grid.configure(this);

        for (let dataSource of this.dataSources) {
            dataSource.configure(this);
        }

        this.setLayoutSources(this.getLayoutSources());
        this.updatePlot();
    }

    unconfigurePlot() {
        axisTypeMap(axisType => {
            let axis = this.axes[axisType];
            axis?.unconfigure();
        });
    
        this.grid.layout = undefined;

        for (let dataSource of this.dataSources) {
            dataSource.unconfigure();
        }

        // this.refLayout = undefined;
    }

    didChangeViewportSize() {
        super.didChangeViewportSize();
        this.schedulePlotUpdate();
    }

    didChangeScale() {
        super.didChangeScale();
        this.schedulePlotUpdate();
    }

    schedulePlotUpdate() {
        if (this._scheduledPlotUpdate) {
            return;
        }

        this._scheduledPlotUpdate = InteractionManager.runAfterInteractions(() => (
            this._debouncedPlotUpdate()
        ));
    }

    cancelPlotUpdate() {
        if (this._scheduledPlotUpdate) {
            this._scheduledPlotUpdate.cancel();
            this._scheduledPlotUpdate = undefined;
        }
        this._debouncedPlotUpdate.cancel();
    }
    
    private _scheduledPlotUpdate?: Cancelable;

    private _debouncedPlotUpdate = debounce(
        () => this.updatePlot(),
        kGridUpdateDebounceInterval,
    );

    updatePlot() {
        this.cancelPlotUpdate();
        
        this.xLayout.update();
        this.yLayout.update();

        this.scrollBy({
            offset: {
                x: this.xLayout.layoutInfo.recenteringOffset,
                y: this.yLayout.layoutInfo.recenteringOffset,
            }
        });
    }

    // getVisibleLocationRange(): [IPoint, IPoint] {
    //     return this.refLayout?.getVisibleLocationRange() || [zeroPoint(), zeroPoint()];
    // }

    getLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            // ...this.getRefLayoutSources(),
            ...this.getGridLayoutSources(),
            ...this.getDataLayoutSources(),
            ...this.getHorizontalAxisLayoutSources(),
            ...this.getVerticalAxisLayoutSources(),
        ];
    }

    // getRefLayoutSources(): LayoutSource[] {
    //     let layout = this.refLayout;
    //     return !!layout ? [layout] : [];
    // }

    getGridLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        let layout = this.grid?.layout;
        return !!layout ? [layout] : [];
    }

    getDataLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return (this.dataSources || [])
            .map(d => d.layout)
            .filter(s => !!s) as LayoutSource[];
    }

    getHorizontalAxisLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            this.axes?.bottomAxis?.backgroundLayout,
            this.axes?.bottomAxis?.contentLayout,
            this.axes?.topAxis?.backgroundLayout,
            this.axes?.topAxis?.contentLayout,
        ].filter(s => !!s) as LayoutSource[];
    }

    getVerticalAxisLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            this.axes?.rightAxis?.backgroundLayout,
            this.axes?.rightAxis?.contentLayout,
            this.axes?.leftAxis?.backgroundLayout,
            this.axes?.leftAxis?.contentLayout,
        ].filter(s => !!s) as LayoutSource[];
    }

    getLayout$(): ILayout<Animated.ValueXY> {
        return this.chart.getPlotLayout$(this);
    }

    getLayoutSourceOptions(layout?: ILayout<Animated.ValueXY>): Omit<LayoutSourceProps<any>, 'shouldRenderItem'> {
        // layout = layout || this.getLayout$();
        return {
            itemSize: {
                x: this.xLayout.layoutInfo.containerLength$,
                y: this.yLayout.layoutInfo.containerLength$,
            },
            // viewportOffset: layout.offset,
            // viewportSize: layout.size,
            // clipToBounds: false,
        };
    }

    private _validatedAxes(props: PlotLayoutOptions | undefined): IAxes<X, Y, DX, DY> {
        return Axis.createMany(props?.axes);
    }

    private _validatedGrid(props: PlotLayoutOptions | undefined): Grid {
        let gridOrOptions = props?.grid || {};
        if (gridOrOptions instanceof Grid) {
            return gridOrOptions;
        }
        return new Grid(gridOrOptions);
    }

    // private _createRefLayout(): GridLayoutSource {
    //     return new GridLayoutSource({
    //         ...this.getLayoutSourceOptions(),
    //         shouldRenderItem: () => false,
    //         reuseID: kRefLayoutReuseID,
    //     });
    // }
}
