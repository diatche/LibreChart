import { AxisType } from "evergrid";
import moment from "moment";
import { Duration, Moment } from "moment";
import { TextStyle } from "react-native";
import { IAxisOptions, ITickLabel } from "../../types";
import Axis from "../Axis";
import {
    DateUnit,
    DateUnitMapping,
    kDateUnitsAsc,
    kDateUnitsLength,
    kDateUnitUniformMs,
    mapDateUnits,
} from "./dateBase";
import { formatDateDelta } from "./formatDate";
import DateScale from "./DateScale";
import {
    dateUnitsWithDuration,
    getUniformMs,
} from "./duration";

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
        // Find unit which has a normal loabel style
        let uniformMs = getUniformMs(duration);
        let normalIndex = 0;
        for (let i = 0; i < kDateUnitsLength; i++) {
            let dateUnit = kDateUnitsAsc[i];
            let unitDensity = uniformMs / kDateUnitUniformMs[dateUnit];
            if (dateUnit === 'month' && unitDensity < 1) {
                break;
            }
            if (unitDensity < 0.25) {
                break;
            }
            normalIndex = i;
        }

        return mapDateUnits((dateUnit: DateUnit, index: number): TextStyle => {
            if (index > normalIndex) {
                return {
                    color: this.style.majorLabelColor,
                    fontWeight: this.style.majorLabelFontWeight,
                };
            } else if (index < normalIndex) {
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
