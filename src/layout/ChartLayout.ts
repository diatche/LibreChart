import {
    IPoint,
    ILayout,
    zeroPoint,
} from "evergrid";
import { Animated } from "react-native";
import {
    PlotLayout,
    PlotLayoutManyInput,
} from "../internal";

/** Rows and nested columns. */
export type PlotLayoutSizeMatrix = number[][];

export interface ChartLayoutProps {
    plotSizes?: number[][];
    plots: PlotLayoutManyInput;
}

export default class ChartLayout { 
    // plotSizeMatrix: PlotLayoutSizeMatrix;
    readonly plots: PlotLayout[];

    constructor(props?: ChartLayoutProps) {
        this.plots = this._validatedPlotLayouts(props);
        // this.plotSizeMatrix = this._validatedPlotLayoutSizeMatrix(this.plots, props);
    }

    /**
     * Returns the plot index range.
     * Start is inclusive, end is exclusive.
     */
    getPlotLayoutIndexRange(): [IPoint, IPoint] | undefined {
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

    getPlotLayout$(plot: PlotLayout): ILayout<Animated.ValueXY> {
        // TODO: calculate layout from props
        return {
            offset: new Animated.ValueXY(),
            size: plot.containerSize$,
        };

        // let indexRange = this.getPlotLayoutIndexRange();
        // if (!indexRange) {
        //     return {
        //         offset: new Animated.ValueXY(),
        //         size: new Animated.ValueXY(),
        //     };
        // }
        // // Spread plots evenly
        // let xTotalLen = indexRange[1].x - indexRange[0].x;
        // let yTotalLen = indexRange[1].y - indexRange[0].y;
        // return {
        //     offset: new Animated.ValueXY({
        //         x: 0,
        //         y: 0,
        //         // x: 10,
        //         // y: 10,
        //         // x: plot.index.x - indexRange[0].x,
        //         // y: plot.index.y - indexRange[0].y,
        //     }),
        //     size: new Animated.ValueXY({
        //         x: 600,
        //         y: 400,
        //         // x: this.containerSize$.x,
        //         // y: this.containerSize$.y,
        //     }),
        //     //  {
        //     //     x: Animated.divide(this.containerSize$.x, xTotalLen),
        //     //     y: Animated.divide(this.containerSize$.y, yTotalLen),
        //     // },
        // };
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

    // private _validatedPlotLayoutSizeMatrix(plots: PlotLayout[], props: ChartLayoutProps | undefined): PlotLayoutSizeMatrix {
    //     let mInput = props?.plotSizeMatrix || [];
    //     let m: PlotLayoutSizeMatrix = [];
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

    private _validatedPlotLayouts(props: ChartLayoutProps | undefined): PlotLayout[] {
        return PlotLayout.createMany(props?.plots);
    }
}
