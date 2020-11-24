import { AxisType } from "evergrid";
import moment from "moment";
import { IAxisOptions } from "../../types";
import Axis from "../Axis";
import { DateUnit } from "./dateBase";
import {
    dateTicks,
    decodeDate,
    IDateTickConstraints,
    optimizeDateScale,
} from "./dateScale";

const kBaseDateUnit: DateUnit = 'day';
const kOriginDate = moment().startOf('year');
const kDateScale = optimizeDateScale({
    baseUnit: kBaseDateUnit,
    originDate: kOriginDate,
});
const kDefaultTickConstraints: IDateTickConstraints = {
    ...kDateScale,
    // maxCount: 6,
}

export default class DateAxis extends Axis {

    constructor(axisType: AxisType, options?: IAxisOptions) {
        options = {
            tickGenerator: dateTicks,
            defaultTickConstraints: kDefaultTickConstraints,
            getLabel: x => {
                let date = decodeDate(x, kDateScale);
                // return formatDate(date, { unit: kSmallerDateUnit });
                return date.format('lll');
            },
            ...options,
        };
        super(axisType, options);
    }
}
