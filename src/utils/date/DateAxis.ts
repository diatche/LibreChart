import { AxisType } from "evergrid";
import { Duration, Moment } from "moment";
import { IAxisOptions } from "../../types";
import Axis from "../Axis";
import DateScale from "./DateScale";

export default class DateAxis extends Axis<Moment, Duration> {

    constructor(axisType: AxisType, options?: IAxisOptions<Moment, Duration>) {
        options = {
            scale: new DateScale(),
            getTickLabel: ({ value: date }) => {
                // return formatDate(date, { unit: kSmallerDateUnit });
                return date.format('lll');
            },
            ...options,
        };
        super(axisType, options);
    }
}
