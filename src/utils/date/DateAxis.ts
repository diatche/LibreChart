import { AxisType } from "evergrid";
import { Duration, Moment } from "moment";
import { IAxisOptions } from "../../types";
import Axis from "../Axis";
import { formatDateDelta } from "./dateFormat";
import DateScale from "./DateScale";
import { dateUnitsWithDuration } from "./duration";

export default class DateAxis extends Axis<Moment, Duration> {

    constructor(axisType: AxisType, options?: IAxisOptions<Moment, Duration>) {
        options = {
            scale: new DateScale(),
            getTickLabel: ({ value: date }) => {
                // let [value, unit] = dateUnitsWithDuration(this.scale.tickScale.interval.valueInterval);
                return formatDateDelta(date, this.scale.tickScale.interval.valueInterval);
            },
            ...options,
        };
        super(axisType, options);
    }
}
