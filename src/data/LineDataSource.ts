import {
    GridLayoutSource,
    GridLayoutSourceProps,
    IPoint,
} from 'evergrid';
import DataSource, { DataSourceInput } from './DataSource';
import { ChartDataType, IDataPointStyle } from '../types';
import { VectorUtil } from '../utils/vectorUtil';
import {
    LinePath,
    PathCurve,
    CanvasUtil,
} from '../utils/canvas';

export interface ILinePoint extends IPoint {
    dataIndex: number;
    clipped: boolean;
}

export interface ILineDataStyle extends IDataPointStyle {
    curve?: PathCurve;

    /** Stroke width in view coordinates. */
    strokeWidth?: number;
    strokeColor?: string | number;
    /** Stroke dash array in view coordinates. */
    strokeDashArray?: number[];
}

export interface LineDataSourceInput {
    style?: ILineDataStyle;
}

export default class LineDataSource<X = any, Y = any> extends DataSource<
    X, Y, IPoint, GridLayoutSourceProps, GridLayoutSource
> {
    style: ILineDataStyle;

    constructor(input: LineDataSourceInput & DataSourceInput<X, Y, IPoint, GridLayoutSourceProps>) {
        super(input);
        this.style = { ...input.style };
    }

    get type(): ChartDataType {
        return 'path';
    }

    get itemReuseID(): string {
        return this.id + '_path';
    }

    getContainerLocationRange(index: IPoint): [IPoint, IPoint] {
        let width = this.axes.x.layoutInfo.containerLength;
        let height = this.axes.y.layoutInfo.containerLength;
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
        let xLen = range[1].x - range[0].x;
        let yLen = range[1].y - range[0].y;
        let rect = [
            range[0].x,
            range[0].y,
            xLen,
            yLen,
        ];

        let scale = this.layout.getScale();
        if (scale.x < 0) {
            rect[0] = -xLen - rect[0];
        }
        if (scale.y < 0) {
            rect[1] = -yLen - rect[1];
        }
        
        return rect;
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

        // let scale = this.layout.getScale();
        // let xScaleSign = scale.x >= 0 ? 1 : -1;
        // let yScaleSign = scale.y >= 0 ? 1 : -1;

        // let points: ILinePoint[] = this.data.map((item, i) => {
        //     let p = this.getItemLocation(item);
        //     let clipped = p.x >= rect[0].x && p.x < rect[1].x && p.y >= rect[0].y && p.y < rect[1].y;

        //     if (xScaleSign < 0 || yScaleSign < 0) {
        //         p.x *= xScaleSign;
        //         p.y *= yScaleSign;
        //     }

        //     return {
        //         x: p.x,
        //         y: p.y,
        //         dataIndex: i,
        //         clipped,
        //     };
        // });

        let points: ILinePoint[] = [];
        let p0 = this.getItemLocation(this.data[0]);
        let iAdded = -1;
        for (let i = 1; i < c; i++) {
            let p = this.getItemLocation(this.data[i]);
            let line = VectorUtil.cohenSutherlandLineClip(
                p0.x, p0.y,
                p.x, p.y,
                rect[0].x, rect[0].y,
                rect[1].x, rect[1].y
            );
            if (line) {
                let isPoint = line[0] === line[2] && line[1] === line[3];
                if (!isPoint) {
                    if (iAdded !== i - 1) {
                        points.push({
                            x: line[0],
                            y: line[1],
                            dataIndex: i - 1,
                            clipped: !VectorUtil.isPointInClosedRange(p0, rect),
                        });
                        iAdded = i - 1;
                    }
                    points.push({
                        x: line[2],
                        y: line[3],
                        dataIndex: i,
                        clipped: !VectorUtil.isPointInClosedRange(p, rect),
                    });
                    iAdded = i;
                }
            }
            p0 = p;
        }

        const pointsLen = points.length;
        if (pointsLen !== 0) {
            let scale = this.layout.getScale();
            let xScaleSign = scale.x >= 0 ? 1 : -1;
            let yScaleSign = scale.y >= 0 ? 1 : -1;
            if (xScaleSign < 0 || yScaleSign < 0) {
                for (let i = 0; i < pointsLen; i++) {
                    let p = points[i];
                    p.x *= xScaleSign;
                    p.y *= yScaleSign;
                }
            }
        }

        return points;
    }

    getCanvasLinePath(): LinePath {
        return CanvasUtil.createLinePath(this.style);
    }

    createLayoutSource(props?: GridLayoutSourceProps) {
        return new GridLayoutSource({
            reuseID: this.itemReuseID,
            itemSize: {
                x: this.axes.x.layoutInfo.containerLength$,
                y: this.axes.y.layoutInfo.containerLength$,
            },
            ...props,
            shouldRenderItem: () => true,
        });
    }
}
