import {
    GridLayoutSource,
    IItemUpdateManyOptions,
    LayoutSource,
    FlatLayoutSource,
    LayoutSourceProps,
    weakref,
} from "evergrid";
import {
    kChartGridStyleLightDefaults,
    kGridReuseID,
} from '../const';
import {
    IChartGridStyle,
} from "../types";
import {
    PlotLayout,
} from "../internal";
import { Observable } from "../utils/observable";

export interface IChartGridInput {

    /**
     * Toggles grid visiblity.
     * Grid is visible by default.
     */
    hidden?: boolean;

    /**
     * Toggles vertical grid lines.
     * Vertical grid is hidden by default.
     */
    vertical?: boolean;

    /**
     * Toggles horizontal grid lines.
     * Horizontal grid is hidden by default.
     */
    horizontal?: boolean;

    style?: IChartGridStyle;
}

export default class Grid {
    hidden: boolean;
    vertical: boolean;
    horizontal: boolean;
    style: Required<IChartGridStyle>;

    layout?: LayoutSource;

    private _plotWeakRef = weakref<PlotLayout>();
    private _scaleLayoutUpdates?: {
        x: Observable.IObserver,
        y: Observable.IObserver,
    };

    constructor(options?: IChartGridInput) {
        let {
            hidden = false,
            vertical = false,
            horizontal = false,
            style = {
                ...kChartGridStyleLightDefaults,
                ...options?.style,
            },
        } = options || {};
        this.hidden = hidden;
        this.vertical = vertical;
        this.horizontal = horizontal;
        this.style = style;
    }

    get plot(): PlotLayout {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: PlotLayout) {
        if (!plot || !(plot instanceof PlotLayout)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(plot: PlotLayout) {
        this.plot = plot;
        this.layout = this._createGridLayout();

        const updateOptions: IItemUpdateManyOptions = {
            visible: true,
            queued: true,
            forceRender: true,
        };
        // FIXME: Do only one update if both x and y layouts change.
        this._scaleLayoutUpdates = {
            x: plot.xLayout.updates.addObserver(
                () => this.update(updateOptions)
            ),
            y: plot.yLayout.updates.addObserver(
                () => this.update(updateOptions)
            ),
        };
    }

    unconfigure() {
        this.layout = undefined;

        if (this._scaleLayoutUpdates) {
            this._scaleLayoutUpdates.x.cancel();
            this._scaleLayoutUpdates.y.cancel();
            this._scaleLayoutUpdates = undefined;
        }
    }

    update(updateOptions: IItemUpdateManyOptions) {
        this.layout?.updateItems(updateOptions);
    }

    private _createGridLayout(): LayoutSource | undefined {
        let {
            hidden,
            vertical,
            horizontal,
            plot,
        } = this;

        if (hidden) {
            vertical = false;
            horizontal = false;
        }

        if (!vertical && !horizontal) {
            return undefined;
        }

        let commonProps: LayoutSourceProps<any> = {
            ...this.plot.getLayoutSourceOptions(),
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
        }

        if (vertical && horizontal) {
            return new GridLayoutSource(commonProps);
        } else if (vertical) {
            // Grid lines are vertical,
            // containers are horizontal.
            return new FlatLayoutSource({
                ...commonProps,
                getItemViewLayout: () => ({
                    offset: { y: 0 },
                    size: { y: '100%' }
                }),
                horizontal: true,
                stickyEdge: 'bottom',
                itemOrigin: { x: 0, y: 1 },
            });
        } else if (horizontal) {
            // Grid lines are horizontal,
            // containers are vertical.
            return new FlatLayoutSource({
                ...commonProps,
                getItemViewLayout: () => ({
                    offset: { x: 0 },
                    size: { x: '100%' }
                }),
                horizontal: false,
                stickyEdge: 'left',
                itemOrigin: { x: 0, y: 0 },
            });
        }

        return undefined;
    }
}
