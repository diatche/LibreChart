import { IPoint, zeroPoint } from 'evergrid';
import { Animated } from 'react-native';
import { PlotLayout, PlotLayoutManyInput } from '../internal';
import { ChartTheme, PartialChartTheme } from '../theme';

export type PlotLayoutSizeComponent =
    | Animated.AnimatedInterpolation
    | Animated.Value
    | number
    | string
    | {
          flex: number;
      };

export type PlotLayoutSizeComponentInput = PlotLayoutSizeComponent | undefined;

export interface ChartLayoutCallbacks {
    onViewportSizeChanged?: (layout: ChartLayout) => void;
}

export interface ChartLayoutProps extends ChartLayoutCallbacks {
    rowHeights?: PlotLayoutSizeComponentInput[];
    columnWidths?: PlotLayoutSizeComponentInput[];
    plots: PlotLayoutManyInput;
    theme?: PartialChartTheme;
}

export default class ChartLayout {
    readonly rowHeights: PlotLayoutSizeComponent[];
    readonly columnWidths: PlotLayoutSizeComponent[];
    readonly containerSize$: Animated.ValueXY;
    readonly plots: PlotLayout[];
    readonly theme: PartialChartTheme;

    callbacks: ChartLayoutCallbacks;

    private _containerSize: IPoint;
    private _animatedSubscriptions: {
        [id: string]: Animated.Value | Animated.ValueXY;
    } = {};

    constructor(props?: ChartLayoutProps) {
        this.theme = props?.theme || {};
        this.callbacks = {};
        this.callbacks.onViewportSizeChanged = props?.onViewportSizeChanged;

        this._containerSize = zeroPoint();
        this.containerSize$ = new Animated.ValueXY();
        let sub = this.containerSize$.addListener(p => {
            if (p.x <= 0 || p.y <= 0) {
                // console.debug('Ignoring invalid containerSize value: ' + JSON.stringify(p));
                return;
            }
            if (
                Math.abs(p.x - this._containerSize.x) < 1 &&
                Math.abs(p.y - this._containerSize.y) < 1
            ) {
                return;
            }
            this._containerSize = p;
            this.didChangeContainerSize();
        });
        this._animatedSubscriptions[sub] = this.containerSize$;

        this.plots = this._validatedPlotLayouts(props);
        let plotIndexRange = this._getPlotLayoutIndexRange(this.plots);

        this.rowHeights = this._validatedPlotSizeComponents(props?.rowHeights, {
            relativeLength: this.containerSize$.y,
            count: plotIndexRange?.[1].y || 1,
        });

        this.columnWidths = this._validatedPlotSizeComponents(
            props?.columnWidths,
            {
                relativeLength: this.containerSize$.x,
                count: plotIndexRange?.[1].x || 1,
            },
        );
    }

    didChangeContainerSize() {
        this.callbacks.onViewportSizeChanged?.(this);
    }

    getPlot(index: IPoint): PlotLayout | undefined {
        // TODO: optimise this with a matrix lookup or table
        for (let plot of this.plots) {
            if (plot.index.x === index.x && plot.index.y === index.y) {
                return plot;
            }
        }
        return undefined;
    }

    configureChart() {
        for (let plot of this.plots) {
            plot.configurePlot(this);
        }
    }

    unconfigureChart() {
        for (let plot of this.plots) {
            plot.unconfigurePlot();
        }
    }

    private _validatedPlotSizeComponents(
        sizes: PlotLayoutSizeComponentInput[] | undefined,
        options: {
            count: number;
            relativeLength: Animated.Value;
        },
    ): PlotLayoutSizeComponent[] {
        let { count } = options;
        if (count < 1) {
            count = 1;
        }
        sizes = sizes || [];
        let flexTotal = count - sizes.length;

        const getFlex = (
            size: PlotLayoutSizeComponentInput | undefined,
        ): number | undefined => {
            if (typeof size === 'undefined') {
                return 1;
            } else if (typeof size === 'object' && 'flex' in size) {
                return size.flex;
            } else {
                return undefined;
            }
        };

        // Convert flex into animated
        for (let size of sizes) {
            let flex = getFlex(size);
            if (typeof flex !== 'undefined') {
                flexTotal += flex;
            }
        }
        let normSizes: PlotLayoutSizeComponent[] = [];
        for (let i = 0; i < count; i++) {
            let size = sizes[i];
            let flex = getFlex(size);
            if (typeof flex !== 'undefined') {
                normSizes.push({ flex });
            } else if (typeof size !== 'undefined') {
                normSizes.push(size);
            }
        }
        return normSizes;
    }

    private _validatedPlotLayouts(
        props: ChartLayoutProps | undefined,
    ): PlotLayout[] {
        return PlotLayout.createMany(props?.plots);
    }

    /**
     * Returns the plot index range.
     * Start is inclusive, end is exclusive.
     */
    private _getPlotLayoutIndexRange(
        plots: PlotLayout[],
    ): [IPoint, IPoint] | undefined {
        if (plots.length === 0) {
            return undefined;
        }
        let start = zeroPoint();
        let end = zeroPoint();
        for (let plot of plots) {
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
}
