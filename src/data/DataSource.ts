import {
    IItemUpdateManyOptions,
    IPoint,
    isPointInRange,
    LayoutSource,
    weakref,
    zeroPoint,
} from 'evergrid';
import {
    ChartDataType,
    IDataSourceRect,
    IDataRect,
    IRect,
} from '../types';
import { PlotLayout } from '../internal';
import { Observable } from '../utils/observable';
import { VectorUtil } from '../utils/vectorUtil';

let _idCounter = 0;

export interface DataSourceProps<
    T,
    X = any,
    Y = any,
> {
    data?: T[];
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
}

export interface DataSourceInput<
    T,
    X = any,
    Y = any,
> extends DataSourceProps<T, X, Y> {
    noCopy?: boolean;
}

export interface IItemsInLocationRangeOptions {
    partial?: boolean;
}

export default abstract class DataSource<
    T = any,
    X = any,
    Y = any,
> implements DataSourceProps<T, X, Y> {
    id: string;
    data: T[];
    transform: (item: T, index: number) => IDataSourceRect<X, Y>;
    layout?: LayoutSource;

    private _plotWeakRef = weakref<PlotLayout<X, Y>>();
    private _scaleLayoutUpdates?: {
        x: Observable.IObserver,
        y: Observable.IObserver,
    };

    constructor(input: DataSourceInput<T, X, Y>) {
        this.id = `${(++_idCounter)}`;
        if (input.noCopy && !input.data) {
            throw new Error('Cannot use "noCopy" with null data.');
        }
        this.data = input.noCopy ? input.data! : [...input.data!];
        this.transform = input.transform;
    }

    get plot(): PlotLayout<X, Y> {
        return this._plotWeakRef.getOrFail();
    }

    set plot(plot: PlotLayout<X, Y>) {
        if (!plot || !(plot instanceof PlotLayout)) {
            throw new Error('Invalid plot');
        }
        this._plotWeakRef.set(plot);
    }

    configure(plot: PlotLayout<X, Y>) {
        this.plot = plot;
        this.layout = this.createLayoutSource();

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

    abstract get type(): ChartDataType;

    abstract get itemReuseID(): string;

    abstract createLayoutSource(): LayoutSource;

    getDataBoundingRectInRange(pointRange: [IPoint, IPoint]): [IPoint, IPoint] | undefined {
        // Get data range
        let rects = this.getDataRectsInRange(
            pointRange,
            { partial: true },
        );
        if (rects.length === 0) {
            return undefined;
        }
        let min = zeroPoint();
        let max = zeroPoint();

        min = { ...rects[0] };
        max = {
            x: rects[0].x + rects[0].width,
            y: rects[0].y + rects[0].height,
        };
        for (let r of rects) {
            let x2 = r.x + r.width;
            let y2 = r.y + r.height;
            if (r.x < min.x) {
                min.x = r.x;
            }
            if (x2 > max.x) {
                max.x = x2;
            }
            if (r.y < min.y) {
                min.y = r.y;
            }
            if (y2 > max.y) {
                max.y = y2;
            }
        }

        return [min, max];
    }

    getDataRectsInRange(
        pointRange: [IPoint, IPoint],
        options?: IItemsInLocationRangeOptions,
    ): IDataRect[] {
        let points: IDataRect[] = [];
        let xLen = pointRange[1].x - pointRange[0].x;
        let yLen = pointRange[1].y - pointRange[0].y;
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            let r = this.getItemRect(this.transform(this.data[i], i));
            if (r.width === 0 && r.height === 0 ? isPointInRange(r, pointRange) : VectorUtil.rectsIntersect(
                r.x,
                r.y,
                r.width,
                r.height,
                pointRange[0].x,
                pointRange[0].y,
                xLen,
                yLen,
            )) {
                points.push({
                    ...r,
                    dataIndex: i,
                });
            }
        }
        return points;
    }

    getItemsIndexesInLocationRange(pointRange: [IPoint, IPoint]): number[] {
        let indexes: number[] = [];
        let xLen = pointRange[1].x - pointRange[0].x;
        let yLen = pointRange[1].y - pointRange[0].y;
        const c = this.data.length;
        for (let i = 0; i < c; i++) {
            let r = this.getItemRect(this.transform(this.data[i], i));
            if (r.width === 0 && r.height === 0 ? isPointInRange(r, pointRange) : VectorUtil.rectsIntersect(
                r.x,
                r.y,
                r.width,
                r.height,
                pointRange[0].x,
                pointRange[0].y,
                xLen,
                yLen,
            )) {
                indexes.push(i);
            }
        }
        return indexes;
    }

    getItemRect(item: IDataSourceRect<X, Y>): IRect {
        let plot = this.plot;

        let x = plot.xLayout.scale.locationOfValue(item.x).toNumber();
        let x2 = typeof item.x2 !== 'undefined'
            ? plot.xLayout.scale.locationOfValue(item.x2).toNumber()
            : x;
        
        let y = plot.yLayout.scale.locationOfValue(item.y).toNumber();
        let y2 = typeof item.y2 !== 'undefined'
            ? plot.yLayout.scale.locationOfValue(item.y2).toNumber()
            : y;

        return {
            x,
            y,
            width: x2 - x,
            height: y2 - y,
        };
    }
}
