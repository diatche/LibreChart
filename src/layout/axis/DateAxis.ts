import { Duration, Moment } from 'moment';
import { StyleProp, TextStyle } from 'react-native';
import { ITickLabel } from '../../types';
import Axis, { IAxisExtraOptions } from './Axis';
import {
    DateUnitMapping,
    dateUnitsWithDuration,
    formatDateDelta,
    getTickStyles,
} from '../../utils/date';
import { IAxisOptions } from './axisTypes';

export interface IDateAxisOptions extends IAxisOptions<Moment> {
    locale?: string;
}

export default class DateAxis extends Axis<Moment, Duration> {
    locale?: string;
    private _tickStyles?: DateUnitMapping<StyleProp<TextStyle>>;

    constructor(options: Partial<IDateAxisOptions> & IAxisExtraOptions) {
        options = {
            getTickLabel: tick => {
                let duration = this.scaleLayout?.scale.tickScale.interval.value;
                if (!duration) {
                    return '';
                }
                const [interval, unit] = dateUnitsWithDuration(duration);
                let labelFormat = formatDateDelta(tick.value, duration, {
                    locale: this.locale,
                });
                let label: ITickLabel = {
                    title: labelFormat.title,
                    textStyle: this._tickStyles?.[labelFormat.unit || unit],
                };
                return label;
            },
            ...options,
        };
        super(options);
        this.locale = options.locale;
    }

    willUpdateLayout() {
        super.willUpdateLayout();
        if (!this.scaleLayout) {
            return;
        }
        this._tickStyles = getTickStyles(
            this.scaleLayout?.scale.tickScale.interval.value,
            this.style
        );
    }
}
