import moment from 'moment';
import * as dateLocale from '../../../src/utils/date/dateLocale';

describe('dateLocale (en-us)', () => {
    beforeEach(() => {
        moment.locale('en-us');
    });

    afterEach(() => {
        moment.locale('en-us');
    });

    describe('getCalendarFormat', () => {
        it('should return calendar format with empty time format', () => {
            let format = dateLocale.getCalendarFormat({
                dateFormat: 'll',
                timeFormat: undefined,
            });
            expect(format).toEqual({
                lastDay: '[Yesterday]',
                lastWeek: 'll',
                nextDay: '[Tomorrow]',
                nextWeek: 'll',
                sameDay: '[Today]',
                sameElse: 'll',
            });
        });
    });

    describe('longYearFormat', () => {
        it('should return the year format', () => {
            expect(dateLocale.longYearFormat()).toBe('YYYY');
        });
    });
});
