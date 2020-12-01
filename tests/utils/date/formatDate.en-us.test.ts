import moment from 'moment';
import {
    formatDate,
    formatDateDelta,
} from '../../../src/utils/date/formatDate';

let thisYear = '';

describe('dateFormat (en-us)', () => {

    beforeEach(() => {
        moment.locale('en-us');
        thisYear = moment().format('YYYY');
    });

    afterEach(() => {
        moment.locale('en-us');
    });

    describe('formatDate', () => {

        // Years
        it('should format years', () => {
            expect(formatDate(moment('2020-06-04 06:00'), {
                unit: 'year',
            })).toBe('2020');
        });

        // Months
        it('should format months', () => {
            expect(formatDate(moment('2010-06-04 06:00'), {
                unit: 'month',
            })).toBe('Jun 2010');
        });

        it('should format months correctly with this year', () => {
            expect(formatDate(moment(thisYear + '-06-04 06:00'), {
                unit: 'month',
            })).toBe('Jun');
        });

        // // Weeks
        // it('should format weeks as days', () => {
        //     expect(formatDate(moment('2019-01-16 06:00'), {
        //         unit: 'week',
        //     })).toBe('01/16/2019');
        // });

        // it('should format weeks correctly with this year', () => {
        //     expect(formatDate(moment('2019-01-16 06:00'), {
        //         unit: 'week',
        //         now: moment('2019-02-06'),
        //     })).toBe('Jan 16');
        // });

        // Days
        it('should format days', () => {
            expect(formatDate(moment('2010-06-04 06:00'), {
                unit: 'day',
            })).toBe('06/04/2010');
        });

        it('should format days correctly with this year', () => {
            expect(formatDate(moment(thisYear + '-06-04 06:00'), {
                unit: 'day',
            })).toBe('Jun 4');
        });

        it('should format non relative today', () => {
            expect(formatDate(moment('2010-06-04 06:00'), {
                unit: 'day',
                relativeDay: false,
                now: moment('2011-06-04 07:00'),
            })).toBe('06/04/2010');
        });

        it('should format relative today', () => {
            expect(formatDate(moment('2010-06-04 06:00'), {
                unit: 'day',
                relativeDay: true,
                now: moment('2010-06-04 07:00'),
            })).toBe('Today');
        });

        it('should format relative yesterday', () => {
            expect(formatDate(moment('2010-06-03 06:00'), {
                unit: 'day',
                relativeDay: true,
                now: moment('2010-06-04 07:00'),
            })).toBe('Yesterday');
        });

        it('should format relative tomorrow', () => {
            expect(formatDate(moment('2010-06-05 06:00'), {
                unit: 'day',
                relativeDay: true,
                now: moment('2010-06-04 07:00'),
            })).toBe('Tomorrow');
        });

        // Hours
        it('should format morning hours', () => {
            expect(formatDate(moment('2010-06-04 06:00'), {
                unit: 'hour',
            })).toBe('06/04/2010, 6 AM');
        });

        it('should format morning hours correctly with this year', () => {
            expect(formatDate(moment(thisYear + '-06-04 06:00'), {
                unit: 'hour',
            })).toBe('Jun 4, 6 AM');
        });

        it('should format noon', () => {
            expect(formatDate(moment('2010-06-04 12:00'), {
                unit: 'hour',
            })).toBe('06/04/2010, 12 PM');
        });

        it('should format evening hours', () => {
            expect(formatDate(moment('2010-06-04 17:00'), {
                unit: 'hour',
            })).toBe('06/04/2010, 5 PM');
        });

        it('should format hours with relative today', () => {
            expect(formatDate(moment('2010-06-04 06:00'), {
                unit: 'hour',
                relativeDay: true,
                now: moment('2010-06-04 07:00'),
            })).toBe('Today, 6 AM');
        });

        // Minutes
        it('should format morning minutes', () => {
            expect(formatDate(moment('2010-06-04 06:15'), {
                unit: 'minute',
            })).toBe('06/04/2010, 6:15 AM');
        });

        // Seconds
        it('should format seconds', () => {
            expect(formatDate(moment('2010-06-04 06:15:34'), {
                unit: 'second',
            })).toBe('06/04/2010, 6:15:34 AM');
        });

        // Milliseconds
        it('should throw with milliseconds', () => {
            expect(() => {
                formatDate(moment('2010-06-04 06:15:34.567'), {
                    unit: 'millisecond',
                })
            }).toThrow();
        });
    });

    describe('formatDateDelta', () => {

        // Years
        it('should format date delta with years', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:00'),
                moment.duration(1, 'year'),
            )).toEqual({ title: '2020', unit: 'year' });
        });

        // Months
        it('should format date delta with 1 month this year', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:00'),
                moment.duration(1, 'month'),
                { now: moment('2020-10-01') },
            )).toEqual({ title: 'Jun', unit: 'month' });
        });

        it('should format date delta with 1 month over this years boundary', () => {
            expect(formatDateDelta(
                moment('2020-01-01 06:00'),
                moment.duration(1, 'month'),
            )).toEqual({ title: '2020', unit: 'year' });
        });

        it('should format date delta with 1 month over last years boundary', () => {
            expect(formatDateDelta(
                moment('2019-01-01 06:00'),
                moment.duration(1, 'month'),
            )).toEqual({ title: '2019', unit: 'year' });
        });

        // Days of the month
        it('should format date delta with days of the month', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:00'),
                moment.duration(1, 'day'),
            )).toEqual({ title: 'Jun 4', unit: 'day' });
        });

        it('should format date delta with 1 day over month boundary', () => {
            expect(formatDateDelta(
                moment('2020-06-01 06:00'),
                moment.duration(1, 'day'),
            )).toEqual({ title: 'Jun', unit: 'month' });
        });

        it('should format date delta with 2 day over month boundary', () => {
            expect(formatDateDelta(
                moment('2020-06-01 06:00'),
                moment.duration(2, 'day'),
            )).toEqual({ title: 'Jun 1', unit: 'month' });
        });

        // Week
        it('should format date delta with weeks', () => {
            // Week starts on Sunday
            expect(formatDateDelta(
                moment('2019-01-13 06:00'), // Sunday
                moment.duration(1, 'week'),
            )).toEqual({ title: 'Jan 13', unit: 'day' });
        });

        // Days of the week
        it('should format date delta with days of the week', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:00'),
                moment.duration(1, 'day'),
                { weekdays: true },
            )).toEqual({ title: 'Th', unit: 'day' });
        });

        // Hours
        it('should format date delta with morning hours', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:00'),
                moment.duration(1, 'hour'),
            )).toEqual({ title: '6 AM', unit: 'hour' });
        });

        it('should format date delta with noon', () => {
            expect(formatDateDelta(
                moment('2020-06-04 12:00'),
                moment.duration(1, 'hour'),
            )).toEqual({ title: '12 PM', unit: 'hour' });
        });

        it('should format date delta with evening hours', () => {
            expect(formatDateDelta(
                moment('2020-06-04 17:00'),
                moment.duration(1, 'hour'),
            )).toEqual({ title: '5 PM', unit: 'hour' });
        });

        // Minutes
        it('should format date delta with morning minutes', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:15'),
                moment.duration(1, 'minute'),
            )).toEqual({ title: '6:15 AM', unit: 'minute' });
        });

        it('should format date delta with noon', () => {
            expect(formatDateDelta(
                moment('2020-06-04 12:00'),
                moment.duration(1, 'minute'),
            )).toEqual({ title: '12 PM', unit: 'hour' });
        });

        it('should format date delta with evening minutes', () => {
            expect(formatDateDelta(
                moment('2020-06-04 17:45'),
                moment.duration(1, 'minute'),
            )).toEqual({ title: '5:45 PM', unit: 'minute' });
        });

        // Seconds
        it('should format date delta with seconds', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:15:34'),
                moment.duration(1, 'second'),
            )).toEqual({ title: '6:15:34 AM', unit: 'second' });
        });

        // Milliseconds
        it('should format date delta with seconds', () => {
            expect(formatDateDelta(
                moment('2020-06-04 06:15:34.567'),
                moment.duration(1, 'millisecond'),
            )).toEqual({ title: '567⁻³', unit: 'millisecond' });
        });
    });
});
