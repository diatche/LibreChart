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
import { Plot, PlotManyInput } from "../internal";

const kGridUpdateDebounceInterval = 100;

export interface ChartLayoutProps extends EvergridLayoutCallbacks, Omit<EvergridLayoutProps, 'layoutSources'> {
    plots: PlotManyInput;
}

export default class ChartLayout extends EvergridLayout { 
    readonly plots: Plot[];

    constructor(props?: ChartLayoutProps) {
        super(props);
        if (!props?.anchor) {
            this.anchor$.setValue({ x: 0.5, y: 0.5 });
        }
        this.plots = this._validatedPlots(props);
    }

    didInitChart() {
        for (let plot of this.plots) {
            plot.configure(this);
        }
        this.setLayoutSources(this._getChartLayoutSources());
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

        for (let plot of this.plots) {
            plot.update();
        }
    }

    private _getChartLayoutSources(): LayoutSource[] {
        if (!this.plots) {
            return [];
        }
        // The order of layout sources determines
        // their z-order.
        let layoutSources: LayoutSource[] = [];
        for (let plot of this.plots) {
            layoutSources = layoutSources.concat(plot.getLayoutSources());
        }
        return layoutSources;
    }

    private _validatedPlots(props: ChartLayoutProps | undefined): Plot[] {
        return Plot.createMany(props?.plots);
    }
}
