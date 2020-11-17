import Decimal from "decimal.js";
import { IDecimalPoint } from "../types";

export const zeroDecimalPoint = (): IDecimalPoint => ({
    x: new Decimal(0),
    y: new Decimal(0),
});
