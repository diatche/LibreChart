import Decimal from "decimal.js";
import { LinearScale } from "..";
import {
    ITickScale,
    ITickScaleConstraints,
} from "./Scale";

const k1 = new Decimal(1);

export default class DiscreteScale extends LinearScale {

    getTickScale(
        start: Decimal,
        end: Decimal,
        constraints?: ITickScaleConstraints<Decimal>
    ): ITickScale<Decimal> {
        start = start.floor();
        return {
            origin: {
                value: start,
                location: start,
            },
            interval: {
                value: k1,
                location: k1,
            },
        }
    }
}
