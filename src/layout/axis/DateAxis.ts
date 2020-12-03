import moment from "moment";
import { Duration, Moment } from "moment";
import { TextStyle } from "react-native";
import { ITickLabel } from "../../types";
import Axis from "./Axis";
import {
    DateUnitMapping,
    dateUnitsWithDuration,
    formatDateDelta,
    getTickStyles,
} from "../../utils/date";
import DateScale from "../../scale/DateScale";
import {
    AxisType,
    IAxisOptions,
} from "./axisTypes";

export default class DateAxis extends Axis<Moment, Duration> {
    private _tickStyles?: DateUnitMapping<TextStyle>;

    constructor(axisType: AxisType, options?: IAxisOptions<Moment, Duration>) {
        options = {
            scale: new DateScale({
                originDate: moment().startOf('year'),
            }),
            getTickLabel: tick => {
                let duration = this.scale.tickScale.interval.valueInterval;
                const [interval, unit] = dateUnitsWithDuration(duration);
                let labelFormat = formatDateDelta(tick.value, duration);
                let label: ITickLabel = {
                    title: labelFormat.title,
                    style: this._tickStyles?.[labelFormat.unit || unit],
                };
                return label;
            },
            ...options,
        };
        super(axisType, options);
    }

    didChangeLayout() {
        super.didChangeLayout();
        this._tickStyles = getTickStyles(
            this.scale.tickScale.interval.valueInterval,
            this.style,
        );
    }
}
