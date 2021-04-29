import { GridLayoutSource, GridLayoutSourceProps, IPoint } from 'evergrid';
import DataSource, {
    DataSourceInput,
    IItemsInLocationRangeOptions,
} from './DataSource';
import { ChartDataType, IDataRect, IPointStyle, IStrokeStyle } from '../types';
import { VectorUtil } from '../utils/vectorUtil';
import { LinePath, PathCurve, CanvasUtil } from '../utils/canvas';
import PlotLayout from '../layout/PlotLayout';
import { Animated } from 'react-native';

export interface ILinePoint extends IDataRect {
    clipped: boolean;
    originalPoint: IPoint;
}

export interface ILineDataStyle extends IPointStyle, IStrokeStyle {
    curve?: PathCurve;
}

export interface LineDataSourceInput<T, X = number, Y = number>
    extends DataSourceInput<T, X, Y> {
    style?: ILineDataStyle;
    itemStyle?: (item: T, info: ILinePoint) => ILineDataStyle | undefined;
}

export default class LineDataSource<
    T = any,
    X = number,
    Y = number
> extends DataSource<T, X, Y> {
    style: ILineDataStyle;
    itemStyle?: (item: T, info: ILinePoint) => ILineDataStyle | undefined;

    private _scale$?: Animated.ValueXY;
    private _scaleUpdates?: string;

    constructor(input: LineDataSourceInput<T, X, Y>) {
        super(input);
        this.style = { ...input.style };
        this.itemStyle = input.itemStyle;
    }

    get type(): ChartDataType {
        return 'path';
    }

    get itemReuseID(): string {
        return this.id + '_path';
    }

    configure(plot: PlotLayout<X, Y>) {
        super.configure(plot);
        this._scale$ = plot.scale$;
        this._scaleUpdates = this._scale$.addListener(() =>
            this.setNeedsUpdate({ visible: true, forceRender: true })
        );
    }

    unconfigure() {
        super.unconfigure();
        if (this._scaleUpdates) {
            this._scale$?.removeListener(this._scaleUpdates);
        }
    }

    getDataRectsInRange(
        pointRange: [IPoint, IPoint],
        options?: IItemsInLocationRangeOptions
    ): ILinePoint[] {
        const c = this.data.length;
        if (c === 0) {
            return [];
        }
        if (!options?.partial || c === 1) {
            return super.getDataRectsInRange(pointRange, options).map(p => ({
                ...p,
                clipped: false,
                originalPoint: p,
            }));
        }
        // Add clipped lines
        let points: ILinePoint[] = [];
        let r0 = this.getItemRect(this.transform(this.data[0], 0));
        let iAdded = -1;
        for (let i = 1; i < c; i++) {
            let r = this.getItemRect(this.transform(this.data[i], i));
            let line = VectorUtil.cohenSutherlandLineClip(
                r0.x,
                r0.y,
                r.x,
                r.y,
                pointRange[0].x,
                pointRange[0].y,
                pointRange[1].x,
                pointRange[1].y
            );
            if (line) {
                let isPoint = line[0] === line[2] && line[1] === line[3];
                if (!isPoint) {
                    if (iAdded !== i - 1) {
                        points.push({
                            x: line[0],
                            y: line[1],
                            width: 0,
                            height: 0,
                            dataIndex: i - 1,
                            clipped: !VectorUtil.isPointInClosedRange(
                                r0,
                                pointRange
                            ),
                            originalPoint: r0,
                        });
                        iAdded = i - 1;
                    }
                    points.push({
                        x: line[2],
                        y: line[3],
                        width: 0,
                        height: 0,
                        dataIndex: i,
                        clipped: !VectorUtil.isPointInClosedRange(
                            r,
                            pointRange
                        ),
                        originalPoint: r,
                    });
                    iAdded = i;
                }
            }
            r0 = r;
        }

        return points;
    }

    getContainerLocationRange(index: IPoint): [IPoint, IPoint] {
        let plot = this.plot;
        let width = plot.xLayout.layoutInfo.containerLength;
        let height = plot.yLayout.layoutInfo.containerLength;
        let start = {
            x: index.x * width,
            y: index.y * height,
        };
        return [
            start,
            {
                x: start.x + width,
                y: start.y + height,
            },
        ];
    }

    /**
     * Returns the canvas view box for the specified
     * container in the form [x, y, width, height].
     * @param index
     */
    getContainerCanvasRect(index: IPoint): number[] {
        let range = this.getContainerLocationRange(index);
        let scale = this.layout?.getScale() || { x: 1, y: 1 };
        for (let i = 0; i < 2; i++) {
            let p = range[i];
            p.x *= scale.x;
            p.y *= scale.y;
        }

        let xLen = range[1].x - range[0].x;
        let yLen = range[1].y - range[0].y;

        if (xLen < 0) {
            range[0].x += xLen;
            xLen = -xLen;
        }
        if (yLen < 0) {
            range[0].y += yLen;
            yLen = -yLen;
        }

        return [range[0].x, range[0].y, xLen, yLen];
    }

    /**
     * Returns point locations in canvas coordinates.
     * @param index
     */
    getCanvasPointsInContainer(index: IPoint): ILinePoint[] {
        const c = this.data.length;
        if (c === 0) {
            return [];
        }
        let rect = this.getContainerLocationRange(index);
        let dataRects = this.getDataRectsInRange(rect, { partial: true });
        const pointsLen = dataRects.length;
        if (pointsLen !== 0) {
            let scale = this.layout?.getScale() || { x: 1, y: 1 };
            let absScale: IPoint = {
                x: Math.abs(scale.x),
                y: Math.abs(scale.y),
            };
            for (let i = 0; i < pointsLen; i++) {
                let r = dataRects[i];
                r.x *= scale.x;
                r.y *= scale.y;
                r.width *= absScale.x;
                r.height *= absScale.y;
                r.originalPoint.x *= scale.x;
                r.originalPoint.y *= scale.y;
            }
        }

        return dataRects;
    }

    getCanvasLinePath(): LinePath {
        return CanvasUtil.createLinePath(this.style);
    }

    createLayoutSource(props?: GridLayoutSourceProps) {
        return new GridLayoutSource({
            ...this.plot.getLayoutSourceOptions(),
            reuseID: this.itemReuseID,
            ...props,
            shouldRenderItem: () => true,
        });
    }
}
