import Evergrid, {
    AxisType,
    AxisTypeMapping,
    axisTypeMap,
    GridLayoutSource,
    IItemUpdateManyOptions,
    LayoutSource,
    kAllAxisTypes,
    isAxisType,
    isAxisHorizontal,
    FlatLayoutSource,
    LayoutSourceProps,
} from "evergrid";
import DataSource from "./DataSource";
import {
    kChartGridStyleLightDefaults,
    kGridReuseID,
} from '../const';
import { Chart } from "../internal";
import debounce from 'lodash.debounce';
import {
    IChartGrid,
    IChartGridInput,
} from "../types";
import Axis, { AxisManyInput } from "./Axis";

const kGridUpdateDebounceInterval = 100;

export interface LayoutEngineProps {
    dataSources?: DataSource[];
    grid?: IChartGridInput;
    axes?: AxisManyInput;
}

export default class LayoutEngine { 
    dataSources: DataSource[] = [];

    /** Axis layout info. */
    readonly axes: Partial<AxisTypeMapping<Axis>>;

    /** Grid layout info. */
    readonly grid: IChartGrid;

    constructor(props?: LayoutEngineProps) {
        this.dataSources = props?.dataSources || [];
        this.axes = this._validatedAxes(props);
        this.grid = this._validatedGrid(this.axes, props);
    }

    getHorizontalGridAxis(): Axis | undefined {
        if (!this.grid.horizontalAxis) {
            return undefined;
        }
        return this.axes[this.grid.horizontalAxis];
    }

    getVerticalGridAxis(): Axis | undefined {
        if (!this.grid.verticalAxis) {
            return undefined;
        }
        return this.axes[this.grid.verticalAxis];
    }
    
    configure(chart: Chart) {
        this.update(chart);
    }

    unconfigure(chart: Chart) {

    }

    scheduleUpdate(chart: Chart) {
        this._debouncedUpdate(chart);

        // Also schedule thickness updates
        // to reduce jank.
        for (let axisType of kAllAxisTypes) {
            this.axes[axisType]?.scheduleThicknessUpdate();
        }
    }
    
    private _debouncedUpdate = debounce(
        (chart: Chart) => this.update(chart),
        kGridUpdateDebounceInterval,
    );

    update(chart: Chart) {
        let view = chart.innerView;
        if (!view) {
            return;
        }

        this._update(view);
    }

    private _update(view: Evergrid) {
        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
            // animated: true,
            // timing: {
            //     duration: 200,
            // }
        };

        let changes = axisTypeMap(axisType => this.axes[axisType]?.update(
            view,
            updateOptions,
        ));
        
        if (
            this.grid.layout && (
                this.grid.horizontalAxis && changes[this.grid.horizontalAxis]
                || this.grid.verticalAxis && changes[this.grid.verticalAxis]
            )
        ) {
            this.grid.layout.updateItems(view, updateOptions);
        }
    }

    getLayoutSources(): LayoutSource[] {
        // The order of layout sources determines
        // their z-order.
        return [
            // Grid in back by default
            this.grid.layout,
            // Data above grid and below axes
            ...this.dataSources.map(d => d.layout),
            // Horizontal axes below vertical axes
            this.axes.bottomAxis?.layout,
            this.axes.topAxis?.layout,
            this.axes.rightAxis?.layout,
            this.axes.leftAxis?.layout,
        ].filter(s => !!s) as LayoutSource[];
    }

    private _validatedAxes(props: LayoutEngineProps | undefined): Partial<AxisTypeMapping<Axis>> {
        return Axis.createMany(props?.axes);
    }

    private _validatedGrid(
        axes: Partial<AxisTypeMapping<Axis>>,
        props: LayoutEngineProps | undefined,
    ): IChartGrid {
        let grid: IChartGrid = {
            hidden: false,
            ...props?.grid,
            layout: this._createGridLayout(axes, props),
            style: {
                ...kChartGridStyleLightDefaults,
                ...props?.grid?.style,
            },
        };
        LayoutEngine._validateGridAxes(grid, axes);
        return grid;
    }

    private _createGridLayout(
        axes: Partial<AxisTypeMapping<Axis>>,
        props: LayoutEngineProps | undefined,
    ): LayoutSource | undefined {
        let {
            horizontalAxis: xAxisType,
            verticalAxis: yAxisType,
            ...otherProps
        } = props?.grid || {};
        let xAxis = xAxisType && axes[xAxisType];
        let yAxis = yAxisType && axes[yAxisType];

        if (!xAxis && !yAxis) {
            return undefined;
        }

        let commonProps: LayoutSourceProps<any> = {
            ...otherProps,
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
                getItemViewLayout: (i, view) => ({
                    offset: { y: 0 },
                    size: { y: view.containerSize$.y }
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
                getItemViewLayout: (i, view) => ({
                    offset: { x: 0 },
                    size: { x: view.containerSize$.x }
                }),
                stickyEdge: 'left',
                itemOrigin: { x: 0, y: 0 },
            });
        }

        return undefined;
    }

    private static _validateGridAxes(
        grid: IChartGrid,
        axes: Partial<AxisTypeMapping<Axis>>,
    ) {
        let requiredAxisTypes: AxisType[] = [];
        let axisType = grid.horizontalAxis;
        if (axisType) {
            if (!isAxisType(axisType) || !isAxisHorizontal(axisType)) {
                throw new Error('Invalid horizontal grid axis type');
            }
            requiredAxisTypes.push(axisType);
        }
        axisType = grid.verticalAxis;
        if (axisType) {
            if (!isAxisType(axisType) || isAxisHorizontal(axisType)) {
                throw new Error('Invalid vertical grid axis type');
            }
            requiredAxisTypes.push(axisType);
        }

        for (axisType of requiredAxisTypes) {
            if (!axes[axisType]) {
                throw new Error(`The grid is using the axis "${axisType}", but the axis is null. Set the property "axes.${axisType}" to valid axis instance.`);
            }
        }
    }
}
