import { AxisType } from "evergrid";
import moment from "moment";
import { Duration, Moment } from "moment";
import { ColorValue, TextStyle } from "react-native";
import { IAxisOptions, ITickLabel } from "../../types";
import Axis from "../Axis";
import { DateUnit, DateUnitMapping, mapDateUnits } from "./dateBase";
import { formatDateDelta } from "./dateFormat";
import DateScale from "./DateScale";
import { dateUnitsWithDuration } from "./duration";

export default class DateAxis extends Axis<Moment, Duration> {
    private _unitLabelStyle?: DateUnitMapping<TextStyle>;

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
                    style: this._unitLabelStyle?.[labelFormat.unit || unit],
                };
                return label;
            },
            ...options,
        };
        super(axisType, options);
    }

    didChangeLayout() {
        super.didChangeLayout();
        this._unitLabelStyle = this.createUnitLabelColors(
            this.scale.tickScale.interval.valueInterval
        );
    }

    createUnitLabelColors(duration: moment.Duration): DateUnitMapping<TextStyle> {
        return mapDateUnits((dateUnit: DateUnit): TextStyle => {
            let unitDuration = duration.as(dateUnit);
            if (unitDuration < 0.1) {
                return {
                    color: this.style.majorLabelColor,
                    fontWeight: this.style.majorLabelFontWeight,
                };
            } else if (unitDuration > 2) {
                return {
                    color: this.style.minorLabelColor,
                    fontWeight: this.style.minorLabelFontWeight,
                };
            } else {
                return {
                    color: this.style.labelColor,
                    fontWeight: this.style.labelFontWeight,
                };
            }
        });
    }
}
