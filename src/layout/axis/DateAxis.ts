import { Duration, Moment } from 'moment';
import { TextStyle } from 'react-native';
import { ITickLabel } from '../../types';
import Axis, { IAxisExtraOptions } from './Axis';
import {
    DateUnitMapping,
    dateUnitsWithDuration,
    formatDateDelta,
    getTickStyles,
} from '../../utils/date';
import { IAxisOptions } from './axisTypes';

export default class DateAxis extends Axis<Moment, Duration> {
    private _tickStyles?: DateUnitMapping<TextStyle>;

    constructor(options: IAxisOptions<Moment> & IAxisExtraOptions) {
        options = {
            getTickLabel: tick => {
                let duration = this.scaleLayout?.scale.tickScale.interval.value;
                if (!duration) {
                    return '';
                }
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
        super(options);
    }

    willUpdateLayout() {
        super.willUpdateLayout();
        if (!this.scaleLayout) {
            return;
        }
        this._tickStyles = getTickStyles(
            this.scaleLayout?.scale.tickScale.interval.value,
            this.style,
        );
    }
}
