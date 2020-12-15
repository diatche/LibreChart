import {
    LayoutSource,
    EvergridLayout,
    EvergridLayoutCallbacks,
    EvergridLayoutProps,
    IPoint,
    ILayout,
    zeroPoint,
} from "evergrid";
import debounce from 'lodash.debounce';
import {
    Cancelable,
} from "../types";
import { Animated, InteractionManager } from "react-native";
import { Plot, PlotManyInput, ScaleLayout } from "../internal";

const kGridUpdateDebounceInterval = 100;

/** Rows and nested columns. */
export type PlotSizeMatrix = number[][];

export interface ChartLayoutProps extends EvergridLayoutCallbacks, Omit<EvergridLayoutProps, 'layoutSources'> {
    plotSizes?: number[][];
    plots: PlotManyInput;
}

export default class ChartLayout extends EvergridLayout { 
    // plotSizeMatrix: PlotSizeMatrix;
    readonly plots: Plot[];

    /** Unique list of scale layouts. */
    private _scaleLayouts: ScaleLayout[] = [];

    constructor(props?: ChartLayoutProps) {
        super(props);
        if (!props?.anchor) {
            this.anchor$.setValue({ x: 0.5, y: 0.5 });
        }
        this.plots = this._validatedPlots(props);
        // this.plotSizeMatrix = this._validatedPlotSizeMatrix(this.plots, props);
        this._updateScaleLayouts();
    }

    /**
     * Returns the plot index range.
     * Start is inclusive, end is exclusive.
     */
    getPlotIndexRange(): [IPoint, IPoint] | undefined {
        if (this.plots.length === 0) {
            return undefined;
        }
        let start = zeroPoint();
        let end = zeroPoint();
        for (let plot of this.plots) {
            let i = plot.index;
            if (i.x < start.x) {
                start.x = i.x;
            }
            if (i.y < start.y) {
                start.y = i.y;
            }
            if (i.x >= end.x) {
                end.x = i.x + 1;
            }
            if (i.y >= end.y) {
                end.y = i.y + 1;
            }
        }
        return [start, end];
    }

    getPlotLayout$(index: IPoint): ILayout<Animated.ValueXY> {
        // TODO: calculate layout from props
        let indexRange = this.getPlotIndexRange();
        if (!indexRange) {
            return {
                offset: new Animated.ValueXY(),
                size: new Animated.ValueXY(),
            };
        }
        // Spread plots evenly
        let xTotalLen = indexRange[1].x - indexRange[0].x;
        let yTotalLen = indexRange[1].y - indexRange[0].y;
        return {
            offset: new Animated.ValueXY({
                x: 0,
                y: 0,
                // x: 10,
                // y: 10,
                // x: index.x - indexRange[0].x,
                // y: index.y - indexRange[0].y,
            }),
            size: new Animated.ValueXY({
                // x: 600,
                // y: 400,
                x: this.containerSize$.x,
                y: this.containerSize$.y,
            }),
            //  {
            //     x: Animated.divide(this.containerSize$.x, xTotalLen),
            //     y: Animated.divide(this.containerSize$.y, yTotalLen),
            // },
        };
    }

    didInitChart() {
        for (let plot of this.plots) {
            plot.configure(this);
        }
        this.setLayoutSources(this._getChartLayoutSources());
        this.updateChart();
    }

    unconfigureChart() {
        for (let plot of this.plots) {
            plot.unconfigure();
        }
    }

    didChangeViewportSize() {
        super.didChangeViewportSize();
        this.scheduleChartUpdate();
    }

    didChangeScale() {
        super.didChangeScale();
        this.scheduleChartUpdate();
    }

    scheduleChartUpdate() {
        if (this._scheduledChartUpdate) {
            return;
        }

        this._scheduledChartUpdate = InteractionManager.runAfterInteractions(() => (
            this._debouncedChartUpdate()
        ));
    }

    cancelChartUpdate() {
        if (this._scheduledChartUpdate) {
            this._scheduledChartUpdate.cancel();
            this._scheduledChartUpdate = undefined;
        }
        this._debouncedChartUpdate.cancel();
    }
    
    private _scheduledChartUpdate?: Cancelable;

    private _debouncedChartUpdate = debounce(
        () => this.updateChart(),
        kGridUpdateDebounceInterval,
    );

    updateChart() {
        this.cancelChartUpdate();
        
        let hChanged: ScaleLayout | undefined;
        let vChanged: ScaleLayout | undefined;
        for (let scaleLayout of this._scaleLayouts) {
            if (scaleLayout.update() && !scaleLayout.custom) {
                if (scaleLayout.isHorizontal) {
                    hChanged = scaleLayout;
                } else {
                    vChanged = scaleLayout;
                }
            }
        }

        if (hChanged?.layoutInfo.recenteringOffset || vChanged?.layoutInfo.recenteringOffset) {
            this.scrollBy({
                offset: {
                    x: hChanged?.layoutInfo.recenteringOffset,
                    y: vChanged?.layoutInfo.recenteringOffset,
                }
            });
        }
    }

    private _updateScaleLayouts() {
        let scaleLayouts: ScaleLayout[] = [];
        for (let plot of this.plots) {
            if (scaleLayouts.indexOf(plot.xLayout) < 0) {
                scaleLayouts.push(plot.xLayout);
            }
            if (scaleLayouts.indexOf(plot.yLayout) < 0) {
                scaleLayouts.push(plot.yLayout);
            }
        }
        this._scaleLayouts = scaleLayouts;
    }

    private _getChartLayoutSources(): LayoutSource[] {
        if (!this.plots) {
            return [];
        }

        // The order of layout sources determines
        // their z-order.
        // Order from bottom to top:
        // ref, grid, data, h-axes, v-axes.
        let refs: LayoutSource[] = [];
        let grids: LayoutSource[] = [];
        let data: LayoutSource[] = [];
        let hAxes: LayoutSource[] = [];
        let vAxes: LayoutSource[] = [];
        for (let plot of this.plots) {
            refs = [...refs, ...plot.getRefLayoutSources()];
            grids = [...grids, ...plot.getGridLayoutSources()];
            data = [...data, ...plot.getDataLayoutSources()];
            hAxes = [...hAxes, ...plot.getHorizontalAxisLayoutSources()];
            vAxes = [...vAxes, ...plot.getVerticalAxisLayoutSources()];
        }
        return [
            ...refs,
            ...grids,
            ...data,
            ...hAxes,
            ...vAxes,
        ];
    }

    // private _validatedPlotSizeMatrix(plots: Plot[], props: ChartLayoutProps | undefined): PlotSizeMatrix {
    //     let mInput = props?.plotSizeMatrix || [];
    //     let m: PlotSizeMatrix = [];
    //     for (let plot of plots) {
    //         let { x: j, y: i } = plot.index;
    //         while (m.length <= i) {
    //             m.push([]);
    //         }
    //         while (m[i].length <= j) {
    //             m[i].push(0);
    //         }
    //         m[i][j] = 
    //     }
    // }

    private _validatedPlots(props: ChartLayoutProps | undefined): Plot[] {
        return Plot.createMany(props?.plots);
    }
}
