import { IPoint } from 'evergrid';
import * as d3 from 'd3-shape';

// TODO: Add other curves

export type PathCurve = 'linear' | 'natural' | 'monotoneX' | d3.CurveFactory;
export type LinePath = d3.Line<IPoint>;

const kLine: LinePath = d3.line<IPoint>(
    p => p.x,
    p => p.y
);

export namespace CanvasUtil {
    export const getCurve = (options?: {
        curve?: PathCurve;
    }): d3.CurveFactory => {
        const { curve = d3.curveLinear } = options || {};
        let curveFactory: d3.CurveFactory;
        if (typeof curve === 'string') {
            switch (curve) {
                case 'linear':
                    curveFactory = d3.curveLinear;
                    break;
                case 'natural':
                    curveFactory = d3.curveNatural;
                    break;
                case 'monotoneX':
                    curveFactory = d3.curveMonotoneX;
                    break;
                default:
                    throw new Error('Invalid mode');
            }
        } else {
            curveFactory = curve;
        }
        return curveFactory;
    };

    export const createLinePath = (options?: {
        curve?: PathCurve;
    }): LinePath => {
        return kLine.curve(getCurve(options));
    };

    export const pathWithPoints = (
        points: IPoint[],
        options?: {
            curve?: PathCurve;
        }
    ): string => {
        let line = createLinePath(options);
        return line(points) || '';
    };
}
