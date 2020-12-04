import {
    GridLayoutSource,
    GridLayoutSourceProps,
    IPoint,
} from 'evergrid';
import DataSource, { DataSourceInput } from './DataSource';
import { ChartDataType, IDataPointStyle } from '../types';
import { VectorUtil } from '../utils/vectorUtil';
import { PathCurves } from '../utils/svg';

export interface ILinePoint extends IPoint {
    clipped: boolean;
}

export interface ILineDataStyle extends IDataPointStyle {
    curve?: PathCurves;

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

    /**
     * Overlap as a fraction of the view size.
     * 
     * Some overlap is recommended to avoid clipping
     * points and ends of rounded lines.
     */
    overlap = 0.001;

    get type(): ChartDataType {
        return 'path';
    }

    get itemReuseID(): string {
        return this.id + '_path';
    }

    getContainerLocationRange(index: IPoint): [IPoint, IPoint] {
        let width = this.axes.x.layoutInfo.containerLength;
        let height = this.axes.y.layoutInfo.containerLength;
        let xOverlap = this.overlap * width;
        let yOverlap = this.overlap * height;
        let start = {
            x: index.x * width - xOverlap,
            y: index.y * height - yOverlap,
        };
        return [start, {
            x: start.x + width + xOverlap * 2,
            y: start.y + height + yOverlap * 2,
        }];
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
        let points: ILinePoint[] = [];
        let p0 = this.getItemLocation(this.data[0]);
        for (let i = 1; i < c; i++) {
            let p = this.getItemLocation(this.data[i]);
            let clip = VectorUtil.cohenSutherlandLineClip(
                p0.x, p0.y,
                p.x, p.y,
                rect[0].x, rect[0].y,
                rect[1].x, rect[1].y
            );
            if (clip) {
                points.push({
                    x: clip[0],
                    y: clip[1],
                    clipped: clip[0] !== p0.x || clip[1] !== p0.y,
                });
                if (clip[0] !== clip[2] || clip[1] !== clip[3]) {
                    points.push({
                        x: clip[2],
                        y: clip[3],
                        clipped: clip[2] !== p.x || clip[3] !== p.y,
                    });
                }
            }
            p0 = p;
        }

        if (points.length !== 0) {
            let width = rect[1].x - rect[0].x;
            let height = rect[1].y - rect[0].y;
            let scale = this.layout.getScale();
            let invertX = scale.x < 0;
            let invertY = scale.y < 0;
            points = points.map(p => {
                p.x = p.x - rect[0].x;
                p.y = p.y - rect[0].y;
                if (invertX) {
                    p.x = width - p.x;
                }
                if (invertY) {
                    p.y = height - p.y;
                }
                return p;
            });
        }

        return points;
    }

    getViewBox(): string {
        let overlapCoef = 1 + this.overlap;
        let width = this.axes.x.layoutInfo.containerLength * overlapCoef;
        let height = this.axes.y.layoutInfo.containerLength * overlapCoef;
        return `0 0 ${width} ${height}`
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
