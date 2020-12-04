import { Decimal } from "decimal.js";
import { IPoint } from "evergrid";
import { IDecimalPoint } from "../types";

export namespace SvgUtil {

    export const pathWithPoints = (points: IPoint[]): string => {
        return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${new Decimal(p.x).toFixed(4)} ${new Decimal(p.y).toFixed(4)}`).join(' ');
    };
}
