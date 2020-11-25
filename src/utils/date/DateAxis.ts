import { AxisType } from "evergrid";
import moment, { Duration, Moment } from "moment";
import { IAxisOptions } from "../../types";
import Axis from "../Axis";
import { DateUnit } from "./dateBase";
import DateScale from "./DateScale";

const kBaseDateUnit: DateUnit = 'day';
const kOriginDate = moment().startOf('year');

export default class DateAxis extends Axis<Moment, Duration> {

    constructor(axisType: AxisType, options?: IAxisOptions<Moment, Duration>) {
        options = {
            scale: new DateScale({
                baseUnit: kBaseDateUnit,
                originDate: kOriginDate,
            }),
            getTickLabel: ({ value: date }) => {
                // return formatDate(date, { unit: kSmallerDateUnit });
                return date.format('lll');
            },
            ...options,
        };
        super(axisType, options);
    }
}
