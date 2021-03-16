import moment from 'moment';
import * as dateLocale from '../../../src/utils/date/dateLocale';

describe('dateLocale (ru)', () => {
    beforeEach(() => {
        moment.locale('ru');
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
                lastDay: '[Вчера]',
                lastWeek: 'll',
                nextDay: '[Завтра]',
                nextWeek: 'll',
                sameDay: '[Сегодня]',
                sameElse: 'll',
            });
        });
    });

    describe('longYearFormat', () => {
        it('should return the year format', () => {
            expect(dateLocale.longYearFormat()).toBe('YYYY г.');
        });
    });
});
