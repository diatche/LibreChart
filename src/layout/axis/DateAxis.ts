import { Moment } from "moment";
import { TextStyle } from "react-native";
import { ITickLabel } from "../../types";
import Axis from "./Axis";
import {
    DateUnitMapping,
    dateUnitsWithDuration,
    formatDateDelta,
    getTickStyles,
} from "../../utils/date";
import {
    AxisType,
    IAxisOptions,
} from "./axisTypes";

export default class DateAxis extends Axis<Moment> {
    private _tickStyles?: DateUnitMapping<TextStyle>;

    constructor(axisType: AxisType, options?: IAxisOptions<Moment>) {
        options = {
            getTickLabel: tick => {
                let duration = this.scaleLayout.scale.tickScale.interval.valueInterval;
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

    willUpdateLayout() {
        super.willUpdateLayout();
        this._tickStyles = getTickStyles(
            this.scaleLayout.scale.tickScale.interval.valueInterval,
            this.style,
        );
    }
}
