import {
    LayoutSource,
    EvergridLayout,
    EvergridLayoutCallbacks,
    EvergridLayoutProps,
} from "evergrid";
import debounce from 'lodash.debounce';
import {
    Cancelable,
} from "../types";
import { InteractionManager } from "react-native";
import { Plot, PlotManyInput, ScaleLayout } from "../internal";

const kGridUpdateDebounceInterval = 100;

export interface ChartLayoutProps extends EvergridLayoutCallbacks, Omit<EvergridLayoutProps, 'layoutSources'> {
    plots: PlotManyInput;
}

export default class ChartLayout extends EvergridLayout { 
    readonly plots: Plot[];

    /** Unique list of scale layouts. */
    private _scaleLayouts: ScaleLayout[] = [];

    constructor(props?: ChartLayoutProps) {
        super(props);
        if (!props?.anchor) {
            this.anchor$.setValue({ x: 0.5, y: 0.5 });
        }
        this.plots = this._validatedPlots(props);
        this._updateScaleLayouts();
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
        // Order from bottom to top: grid, data, h-axes, v-axes.
        let grids: LayoutSource[] = [];
        let data: LayoutSource[] = [];
        let hAxes: LayoutSource[] = [];
        let vAxes: LayoutSource[] = [];
        for (let plot of this.plots) {
            grids = [...grids, ...plot.getGridLayoutSources()];
            data = [...data, ...plot.getDataLayoutSources()];
            hAxes = [...hAxes, ...plot.getHorizontalAxisLayoutSources()];
            vAxes = [...vAxes, ...plot.getVerticalAxisLayoutSources()];
        }
        return [
            ...grids,
            ...data,
            ...hAxes,
            ...vAxes,
        ];
    }

    private _validatedPlots(props: ChartLayoutProps | undefined): Plot[] {
        return Plot.createMany(props?.plots);
    }
}
