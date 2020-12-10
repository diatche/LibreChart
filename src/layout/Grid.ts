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
    Plot,
} from "../internal";

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

    private _plotWeakRef = weakref<Plot>();

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

    get plot(): Plot {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: Plot) {
        if (!plot || !(plot instanceof Plot)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(plot: Plot) {
        this.plot = plot;
        this.layout = this._createGridLayout();
    }

    unconfigure() {

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
            shouldRenderItem: () => false,
            reuseID: kGridReuseID,
        }

        if (vertical && horizontal) {
            return new GridLayoutSource({
                ...commonProps,
                itemSize: {
                    x: plot.xLayout.layoutInfo.containerLength$,
                    y: plot.yLayout.layoutInfo.containerLength$,
                },
            });
        } else if (vertical) {
            return new FlatLayoutSource({
                ...commonProps,
                itemSize: {
                    x: plot.xLayout.layoutInfo.containerLength$,
                    y: plot.yLayout.layoutInfo.containerLength$,
                },
                getItemViewLayout: () => ({
                    offset: { y: 0 },
                    size: { y: '100%' }
                }),
                horizontal: true,
                stickyEdge: 'bottom',
                itemOrigin: { x: 0, y: 1 },
            });
        } else if (horizontal) {
            return new FlatLayoutSource({
                ...commonProps,
                itemSize: {
                    x: plot.xLayout.layoutInfo.containerLength$,
                    y: plot.yLayout.layoutInfo.containerLength$,
                },
                getItemViewLayout: () => ({
                    offset: { x: 0 },
                    size: { x: '100%' }
                }),
                stickyEdge: 'left',
                itemOrigin: { x: 0, y: 0 },
            });
        }

        return undefined;
    }
}
