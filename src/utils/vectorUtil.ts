
export namespace VectorUtil {

    const INSIDE = 0; // 0000
    const LEFT = 1;   // 0001
    const RIGHT = 2;  // 0010
    const BOTTOM = 4; // 0100
    const TOP = 8;    // 1000

    // export interface IPoint {
    //     x: number;
    //     y: number;
    // };

    // export interface IVector {
    //     start: IPoint;
    //     end: IPoint;
    // };

    /**
     * Cohen–Sutherland clipping algorithm clips a line from
     * P0 = (x0, y0) to P1 = (x1, y1) against a rectangle with 
     * diagonal from (xmin, ymin) to (xmax, ymax).
     * 
     * Source: https://en.wikipedia.org/wiki/Cohen–Sutherland_algorithm
     * 
     * @param x0 
     * @param y0 
     * @param x1 
     * @param y1 
     * @param xmin 
     * @param ymin 
     * @param xmax 
     * @param ymax 
     * @returns The clipped line described by `[x0, y0, x1, y1]`, if the line intersects the rectangle, otherwise `undefined`.
     */
    export const cohenSutherlandLineClip = (
        x0: number,
        y0: number,
        x1: number,
        y1: number,
        xmin: number,
        ymin: number,
        xmax: number,
        ymax: number,
    ): [number, number, number, number] | undefined => {
        if (xmin > xmax || ymin > ymax) {
            return undefined;
        }
        // compute outcodes for P0, P1, and whatever point lies outside the clip rectangle
        let outcode0 = _computeOutCode(x0, y0, xmin, ymin, xmax, ymax);
        let outcode1 = _computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
        let accept = false;

        while (true) {
            if (!(outcode0 | outcode1)) {
                // bitwise OR is 0: both points inside window; trivially accept and exit loop
                accept = true;
                break;
            } else if (outcode0 & outcode1) {
                // bitwise AND is not 0: both points share an outside zone (LEFT, RIGHT, TOP,
                // or BOTTOM), so both must be outside window; exit loop (accept is false)
                break;
            } else {
                // failed both tests, so calculate the line segment to clip
                // from an outside point to an intersection with clip edge
                let x = 0;
                let y = 0;

                // At least one endpoint is outside the clip rectangle; pick it.
                let outcodeOut = outcode1 > outcode0 ? outcode1 : outcode0;

                // Now find the intersection point;
                // use formulas:
                //   slope = (y1 - y0) / (x1 - x0)
                //   x = x0 + (1 / slope) * (ym - y0), where ym is ymin or ymax
                //   y = y0 + slope * (xm - x0), where xm is xmin or xmax
                // No need to worry about divide-by-zero because, in each case, the
                // outcode bit being tested guarantees the denominator is non-zero
                if (outcodeOut & TOP) {           // point is above the clip window
                    x = x0 + (x1 - x0) * (ymax - y0) / (y1 - y0);
                    y = ymax;
                } else if (outcodeOut & BOTTOM) { // point is below the clip window
                    x = x0 + (x1 - x0) * (ymin - y0) / (y1 - y0);
                    y = ymin;
                } else if (outcodeOut & RIGHT) {  // point is to the right of clip window
                    y = y0 + (y1 - y0) * (xmax - x0) / (x1 - x0);
                    x = xmax;
                } else if (outcodeOut & LEFT) {   // point is to the left of clip window
                    y = y0 + (y1 - y0) * (xmin - x0) / (x1 - x0);
                    x = xmin;
                }

                // Now we move outside point to intersection point to clip
                // and get ready for next pass.
                if (outcodeOut == outcode0) {
                    x0 = x;
                    y0 = y;
                    outcode0 = _computeOutCode(x0, y0, xmin, ymin, xmax, ymax);
                } else {
                    x1 = x;
                    y1 = y;
                    outcode1 = _computeOutCode(x1, y1, xmin, ymin, xmax, ymax);
                }
            }
        }

        return accept ? [x0, y0, x1, y1] : undefined;
    }

    /**
     * Compute the bit code for a point (x, y) using the clip
     * bounded diagonally by (xmin, ymin), and (xmax, ymax).
     * 
     * Source: https://en.wikipedia.org/wiki/Cohen–Sutherland_algorithm
     * 
     * @param x 
     * @param y 
     * @param xmin 
     * @param ymin 
     * @param xmax 
     * @param ymax 
     */
    const _computeOutCode = (
        x: number,
        y: number,
        xmin: number,
        ymin: number,
        xmax: number,
        ymax: number,
    ): number => {
        // initialised as being inside of clip window
        let code = INSIDE;

        if (x < xmin) {
            // to the left of clip window
            code |= LEFT;
        } else if (x > xmax) {
            // to the right of clip window
            code |= RIGHT;
        }
        if (y < ymin) {
            // below the clip window
            code |= BOTTOM;
        }
        else if (y > ymax) {
            // above the clip window
            code |= TOP;
        }

        return code;
    }

    // export const lineIntersectsRect = (line: IVector, rect: IVector): boolean => {
    //     return vectorsIntersect(line, rectTopVector(rect))
    //         || vectorsIntersect(line, rectLeftVector(rect))
    //         || vectorsIntersect(line, rectRightVector(rect))
    //         || vectorsIntersect(line, rectBottomVector(rect));
    // };

    // export const vectorsIntersect = (v1: IVector, v2: IVector): boolean => {

    // };

    // export const rectTopVector = (rect: IVector): IVector => {
    //     return {
    //         start: { ...rect.start },
    //         end: {
    //             x: rect.end.x,
    //             y: rect.start.y,
    //         },
    //     };
    // }

    // export const rectLeftVector = (rect: IVector): IVector => {
    //     return {
    //         start: { ...rect.start },
    //         end: {
    //             x: rect.start.x,
    //             y: rect.end.y,
    //         },
    //     };
    // }

    // export const rectRightVector = (rect: IVector): IVector => {
    //     return {
    //         start: {
    //             x: rect.end.x,
    //             y: rect.start.y,
    //         },
    //         end: { ...rect.end },
    //     };
    // }

    // export const rectBottomVector = (rect: IVector): IVector => {
    //     return {
    //         start: {
    //             x: rect.start.x,
    //             y: rect.end.y,
    //         },
    //         end: { ...rect.end },
    //     };
    // }
}
