import { IPoint } from "evergrid";
import * as d3 from 'd3-shape';

// TODO: Add other curves

export type PathCurves = 'linear' | 'natural' | 'monotoneX' | d3.CurveFactory;

const kLine = d3.line<IPoint>(p => p.x, p => p.y);

export namespace SvgUtil {

    export const pathWithPoints = (
        points: IPoint[],
        options?: {
            curve?: PathCurves;
        },
    ): string => {
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
        let line = kLine.curve(curveFactory);
        return line(points) || '';
    };
}
