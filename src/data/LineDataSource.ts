import {
    GridLayoutSource,
    GridLayoutSourceProps,
    IPoint,
} from 'evergrid';
import DataSource, {
    DataSourceInput,
    IItemsInLocationRangeOptions,
} from './DataSource';
import {
    ChartDataType,
    IDataItem,
    IDataPoint,
    IPointStyle,
    IStrokeStyle,
} from '../types';
import { VectorUtil } from '../utils/vectorUtil';
import {
    LinePath,
    PathCurve,
    CanvasUtil,
} from '../utils/canvas';

export interface ILinePoint extends IDataPoint {
    clipped: boolean;
}

export interface ILineDataStyle extends IPointStyle, IStrokeStyle {
    curve?: PathCurve;
}

export interface LineDataSourceInput {
    style?: ILineDataStyle;
}

export default class LineDataSource<T = any> extends DataSource<
    T, IPoint, GridLayoutSourceProps, GridLayoutSource
> {
    style: ILineDataStyle;

    constructor(input: LineDataSourceInput & DataSourceInput<T, IPoint, GridLayoutSourceProps>) {
        super(input);
        this.style = { ...input.style };
    }

    get type(): ChartDataType {
        return 'path';
    }

    get itemReuseID(): string {
        return this.id + '_path';
    }

    getDataPointsInRange(
        pointRange: [IPoint, IPoint],
        options?: IItemsInLocationRangeOptions,
    ): ILinePoint[] {
        if (!options?.partial) {
            return super.getDataPointsInRange(pointRange, options).map(p => {
                let lp = p as ILinePoint;
                return lp;
            });
        }
        // Add clipped lines
        const c = this.data.length;
        let points: ILinePoint[] = [];
        let p0 = this.getItemPoint(this.transform(this.data[0]));
        let iAdded = -1;
        for (let i = 1; i < c; i++) {
            let p = this.getItemPoint(this.transform(this.data[i]));
            let line = VectorUtil.cohenSutherlandLineClip(
                p0.x, p0.y,
                p.x, p.y,
                pointRange[0].x, pointRange[0].y,
                pointRange[1].x, pointRange[1].y
            );
            if (line) {
                let isPoint = line[0] === line[2] && line[1] === line[3];
                if (!isPoint) {
                    if (iAdded !== i - 1) {
                        points.push({
                            x: line[0],
                            y: line[1],
                            dataIndex: i - 1,
                            clipped: !VectorUtil.isPointInClosedRange(p0, pointRange),
                        });
                        iAdded = i - 1;
                    }
                    points.push({
                        x: line[2],
                        y: line[3],
                        dataIndex: i,
                        clipped: !VectorUtil.isPointInClosedRange(p, pointRange),
                    });
                    iAdded = i;
                }
            }
            p0 = p;
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
        return [start, {
            x: start.x + width,
            y: start.y + height,
        }];
    }

    /**
     * Returns the canvas view box for the specified
     * container in the form [x, y, width, height].
     * @param index 
     */
    getContainerCanvasRect(index: IPoint): number[] {
        let range = this.getContainerLocationRange(index);
        let scale = this.layout?.getScale() || { x: 1, y: 1};
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

        return [
            range[0].x,
            range[0].y,
            xLen,
            yLen,
        ];
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
        let points = this.getDataPointsInRange(rect, { partial: true });
        const pointsLen = points.length;
        if (pointsLen !== 0) {
            let scale = this.layout?.getScale() || { x: 1, y: 1 };
            for (let i = 0; i < pointsLen; i++) {
                let p = points[i];
                p.x *= scale.x;
                p.y *= scale.y;
            }
        }

        return points;
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
