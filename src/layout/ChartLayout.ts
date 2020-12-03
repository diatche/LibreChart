import {
    GridLayoutSource,
    IItemUpdateManyOptions,
    LayoutSource,
    FlatLayoutSource,
    LayoutSourceProps,
    EvergridLayout,
    EvergridLayoutCallbacks,
    EvergridLayoutProps,
} from "evergrid";
import DataSource from "./DataSource";
import {
    kChartGridStyleLightDefaults,
    kGridReuseID,
} from '../const';
import debounce from 'lodash.debounce';
import {
    IChartGrid,
    IChartGridInput,
} from "../types";
import Axis, { AxisManyInput } from "./axis/Axis";
import { InteractionManager } from "react-native";
import {
    axisTypeMap,
    isAxisHorizontal,
    isAxisType,
} from "./axis/axisUtil";
import {
    AxisType,
    AxisTypeMapping,
} from "./axis/axisTypes";
import { kAllAxisTypes } from "./axis/axisConst";

const kGridUpdateDebounceInterval = 100;

export interface ChartLayoutProps extends EvergridLayoutCallbacks, EvergridLayoutProps {
    dataSources?: DataSource[];
    grid?: IChartGridInput;
    axes?: AxisManyInput;
}

export default class ChartLayout extends EvergridLayout { 
    dataSources: DataSource[];

    /** Axis layout info. */
    readonly axes: Partial<AxisTypeMapping<Axis>>;

    /** Grid layout info. */
    readonly grid: IChartGrid;

    constructor(props?: ChartLayoutProps) {
        super(props);
        if (!props?.anchor) {
            this.anchor$.setValue({ x: 0.5, y: 0.5 });
        }
        this.dataSources = props?.dataSources || [];
        this.axes = this._validatedAxes(props);
        this.grid = this._validatedGrid(this.axes, props);
        this.setLayoutSources(props?.layoutSources || []);
    }

    setLayoutSources(layoutSources: LayoutSource[]) {
        super.setLayoutSources([
            ...this._getChartLayoutSources(),
            ...layoutSources,
        ]);
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

    configure() {
        this.updateChart();
    }

    unconfigure() {}

    didChangeViewportSize() {
        super.didChangeViewportSize();
        this.scheduleChartUpdate();
    }

    didChangeScale() {
        super.didChangeScale();
        this.scheduleChartUpdate();
    }

    scheduleChartUpdate() {
        InteractionManager.runAfterInteractions(() => {
            this._debouncedChartUpdate();

            // Also schedule thickness updates
            // to reduce redundant updates.
            for (let axisType of kAllAxisTypes) {
                this.axes[axisType]?.scheduleThicknessUpdate();
            }
        });
    }
    
    private _debouncedChartUpdate = debounce(
        () => this.updateChart(),
        kGridUpdateDebounceInterval,
    );

    updateChart() {
        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
            // animated: true,
            // timing: {
            //     duration: 200,
            // }
        };

        let anyChanges = false;
        let changes = axisTypeMap(axisType => {
            let changed = this.axes[axisType]?.update(
                updateOptions,
            );
            if (changed) {
                anyChanges = true;
            }
            return changed;
        });
        if (!anyChanges) {
            return;
        }

        for (let dataSource of this.dataSources) {
            dataSource.layout.updateItems(updateOptions);
        }
        
        if (
            this.grid.layout && (
                this.grid.horizontalAxis && changes[this.grid.horizontalAxis]
                || this.grid.verticalAxis && changes[this.grid.verticalAxis]
            )
        ) {
            this.grid.layout.updateItems(updateOptions);
        }
    }

    private _getChartLayoutSources(): LayoutSource[] {
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

    private _validatedAxes(props: ChartLayoutProps | undefined): Partial<AxisTypeMapping<Axis>> {
        return Axis.createMany(props?.axes);
    }

    private _validatedGrid(
        axes: Partial<AxisTypeMapping<Axis>>,
        props: ChartLayoutProps | undefined,
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
        ChartLayout._validateGridAxes(grid, axes);
        return grid;
    }

    private _createGridLayout(
        axes: Partial<AxisTypeMapping<Axis>>,
        props: ChartLayoutProps | undefined,
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
                getItemViewLayout: () => ({
                    offset: { y: 0 },
                    size: { y: this.containerSize$.y }
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
                getItemViewLayout: () => ({
                    offset: { x: 0 },
                    size: { x: this.containerSize$.x }
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
