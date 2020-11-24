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
    IGridLayoutSourceProps,
} from "../types";
import Axis, { AxisManyInput } from "./Axis";

const kGridUpdateDebounceInterval = 100;

export interface LayoutEngineProps {
    dataSources?: DataSource[];
    grid?: IChartGridInput & IGridLayoutSourceProps;
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
    ): GridLayoutSource | undefined {
        let {
            horizontalAxis,
            verticalAxis,
            ...otherProps
        } = props?.grid || {};
        return new GridLayoutSource({
            itemSize: view => ({
                x: horizontalAxis && axes[horizontalAxis]?.layoutInfo.containerLength$
                    || view.containerSize$.x,
                y: verticalAxis && axes[verticalAxis]?.layoutInfo.containerLength$
                    || view.containerSize$.y,
            }),
            ...otherProps,
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
        });
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
