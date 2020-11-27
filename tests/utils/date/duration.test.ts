import moment from 'moment-timezone';
import {
    ceilDate,
    dateIntervalLength,
    dateUnitsWithDuration,
    floorDate,
    getRoundingOriginDate,
    interpolatedDate,
    roundDate,
    stepDateLinear,
} from '../../../src/utils/date/duration';

const kDateFormat = 'YYYY-MM-DD HH:mm:ss';

describe('duration', () => {

    beforeAll(() => {
        // Fix time zone to test DST
        let zoneName = 'NZ';
        expect(moment.tz.zone(zoneName)).toBeTruthy();
        moment.tz.setDefault(zoneName);
    });

    describe('dateIntervalLength', () => {

        it('should diff whole days', () => {
            let diff = dateIntervalLength(
                moment('2020-01-01'),
                moment('2020-01-02'),
                'day'
            );
            expect(diff).toBe(1);
        });

        it('should diff partial days', () => {
            let diff = dateIntervalLength(
                moment('2020-01-01'),
                moment('2020-01-02 12:00'),
                'day'
            );
            expect(diff).toBe(1.5);
        });

        it('should diff days with DST boundaries', () => {
            let diff = dateIntervalLength(
                moment('2020-04-01'),
                moment('2020-04-29 12:00'),
                'day'
            );
            expect(diff).toBe(28.5);
        });

        it('should diff whole hours', () => {
            let diff = dateIntervalLength(
                moment('2020-01-01'),
                moment('2020-01-02'),
                'hour'
            );
            expect(diff).toBe(24);
        });

        it('should diff hours with DST boundaries', () => {
            let diff = dateIntervalLength(
                moment('2020-04-01'),
                moment('2020-04-29'),
                'hour'
            );
            expect(diff).toBe(672);
        });

        it('should diff minutes', () => {
            let diff = dateIntervalLength(
                moment('2020-01-01T10:00'),
                moment('2020-01-01T10:01'),
                'minute'
            );
            expect(diff).toBe(1);
        });

        it('should diff seconds', () => {
            let diff = dateIntervalLength(
                moment('2020-01-01T10:00'),
                moment('2020-01-01T10:01'),
                'second'
            );
            expect(diff).toBe(60);
        });
    })

    describe('interpolatedDate', () => {

        it('should work with floats', () => {
            let start = moment('2020-01-01');
            let end = moment('2020-01-02');
            let date = interpolatedDate(start, end, 0.5);
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-01-01 12:00');
        });

        it('should change UTC offset accross DST', () => {
            let start = moment('2020-04-01');
            let end = moment('2020-05-01');
            expect(start.utcOffset()).not.toBe(end.utcOffset());
            expect(interpolatedDate(start, end, 0).utcOffset()).toBe(start.utcOffset());
            expect(interpolatedDate(start, end, 1).utcOffset()).toBe(end.utcOffset());
        });
    });

    describe('stepDateLinear', () => {

        it('should return same date with step 0 days', () => {
            let start = moment('2020-01-01');
            let date = stepDateLinear(start, 0, 'day');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-01-01 00:00');
        });

        it('should return next date with step 1 days', () => {
            let start = moment('2020-01-01');
            let date = stepDateLinear(start, 1, 'day');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-01-02 00:00');
        });

        it('should return middle date with step 0.5 days', () => {
            let start = moment('2020-01-01');
            let date = stepDateLinear(start, 0.5, 'day');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-01-01 12:00');
        });

        it('should step whole days with large step (with DST boundary)', () => {
            let start = moment('2020-04-01');
            let date = stepDateLinear(start, 28.5, 'day');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-04-29 12:00');
        });

        it('should return next date with step 1 hours', () => {
            let start = moment('2020-01-01');
            let date = stepDateLinear(start, 1, 'hour');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-01-01 01:00');
        });

        it('should return correct date with hours step over DST boundary', () => {
            let start = moment('2020-04-01');
            let date = stepDateLinear(start, 672, 'hour');
            expect(date.format('YYYY-MM-DD HH:mm')).toBe('2020-04-29 00:00');
        });
    });

    describe('roundDate', () => {

        // milliseconds

        it('should round date to same value with 1 millisecond', () => {
            expect(roundDate(
                moment.unix(0.001),
                1,
                'millisecond'
            ).valueOf()).toBe(1);
        });

        it('should round date up from middle with 2 millisecond', () => {
            expect(roundDate(
                moment.unix(0.001),
                2,
                'millisecond'
            ).valueOf()).toBe(2);
        });

        // hours

        it('should round date down with 1 hour', () => {
            expect(roundDate(
                moment('2020-01-08T00:29'),
                1,
                'hour'
            ).format(kDateFormat)).toBe('2020-01-08 00:00:00');
        });

        it('should round date up from middle with 1 hour', () => {
            expect(roundDate(
                moment('2020-01-08T00:30'),
                1,
                'hour'
            ).format(kDateFormat)).toBe('2020-01-08 01:00:00');
        });

        it('should round date down with 2 hour', () => {
            expect(roundDate(
                moment('2020-01-08T00:59'),
                2,
                'hour'
            ).format(kDateFormat)).toBe('2020-01-08 00:00:00');
        });

        it('should round date up from middle with 2 hour', () => {
            expect(roundDate(
                moment('2020-01-08T01:00'),
                2,
                'hour'
            ).format(kDateFormat)).toBe('2020-01-08 02:00:00');
        });

        // days

        it('should round date down with 1 day', () => {
            expect(roundDate(
                moment('2020-01-01T11:59'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 day with postive time zone', () => {
            let date = moment.utc('2020-01-01T09:59');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'day');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 day with negative time zone', () => {
            let date = moment.utc('2020-01-01T13:59');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'day');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 1 day', () => {
            expect(roundDate(
                moment('2020-01-01T12:00'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should round date up with 1 day with positive time zone', () => {
            let date = moment.utc('2020-01-01T10:00');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'day');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-02 00:00:00');
        });

        it('should round date up with 1 day with negative time zone', () => {
            let date = moment.utc('2020-01-01T14:00');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'day');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-02 00:00:00');
        });

        it('should round to same date on boundary with 1 day', () => {
            expect(roundDate(
                moment('2020-01-02'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should round date down with 2 day', () => {
            expect(roundDate(
                moment('2020-01-01T23:59'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 2 day', () => {
            expect(roundDate(
                moment('2020-01-02T00:00'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        // months

        it('should return same date on edge with 1 month (31 days)', () => {
            expect(roundDate(
                moment('2020-01-01'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 month (31 days)', () => {
            expect(roundDate(
                moment('2020-01-15'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 month (31 days) with postive time zone', () => {
            let date = moment.utc('2020-01-15T21:59');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'month');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 month (31 days) with negative time zone', () => {
            let date = moment.utc('2020-01-15T01:59');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'month');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 1 month (31 days)', () => {
            expect(roundDate(
                moment('2020-01-17'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-02-01 00:00:00');
        });

        it('should round date up with 1 month (31 days) with postive time zone', () => {
            let date = moment.utc('2020-01-16T22:00');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'month');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-02-01 00:00:00');
        });

        it('should round date up with 1 month (31 days) with negative time zone', () => {
            let date = moment.utc('2020-01-17T02:00');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'month');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-02-01 00:00:00');
        });

        it('should return same date on edge with 1 month (30 days) accross DST', () => {
            expect(moment('2020-04-01T00:00').utcOffset()).not.toEqual(moment('2020-05-01T00:00').utcOffset());
            expect(roundDate(
                moment('2020-04-01T00:00'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-04-01 00:00:00');
        });

        it('should round date down with 1 month (30 days) accross DST', () => {
            expect(moment('2020-04-01T00:00').utcOffset()).not.toEqual(moment('2020-05-01T00:00').utcOffset());
            expect(roundDate(
                moment('2020-04-15T11:59'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-04-01 00:00:00');
        });

        it('should round date up with 1 month (30 days) accross DST', () => {
            expect(moment('2020-04-01T00:00').utcOffset()).not.toEqual(moment('2020-05-01T00:00').utcOffset());
            expect(roundDate(
                moment('2020-04-17'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-05-01 00:00:00');
        });

        it('should round date down with 2 month', () => {
            expect(roundDate(
                moment('2020-01-29T23:59'),
                2,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 2 month', () => {
            expect(roundDate(
                moment('2020-02-01T00:00'),
                2,
                'month'
            ).format(kDateFormat)).toBe('2020-03-01 00:00:00');
        });

        // years

        it('should round old date down with 1 years', () => {
            expect(roundDate(
                moment('1900-06-01'),
                1,
                'year'
            ).format(kDateFormat)).toBe('1900-01-01 00:00:00');
        });

        it('should round old date up from middle with 1 years', () => {
            expect(roundDate(
                moment('1900-07-01'),
                1,
                'year'
            ).format(kDateFormat)).toBe('1901-01-01 00:00:00');
        });

        it('should round old date down with 10 years', () => {
            expect(roundDate(
                moment('1904-01-01'),
                10,
                'year'
            ).format(kDateFormat)).toBe('1900-01-01 00:00:00');
        });

        it('should round old date up from middle with 10 years', () => {
            expect(roundDate(
                moment('1905-01-01'),
                10,
                'year'
            ).format(kDateFormat)).toBe('1910-01-01 00:00:00');
        });

        // errors

        it('should throw an error when a negative value is used', () => {
            expect(() => {
                roundDate(moment('2020-01-01'), -1, 'millisecond');
            }).toThrow();
        });
    });

    describe('floorDate', () => {

        // days

        it('should floor date down with 1 day', () => {
            expect(floorDate(
                moment('2020-01-01T11:59'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should floor date down from middle with 1 day', () => {
            expect(floorDate(
                moment('2020-01-01T12:00'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should floor same date on boundary with 1 day', () => {
            expect(floorDate(
                moment('2020-01-02'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should floor date down with 2 day', () => {
            expect(floorDate(
                moment('2020-01-01T23:59'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should floor date down from middle with 2 day', () => {
            expect(floorDate(
                moment('2020-01-02T00:00'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        // months

        it('should floor date down with 1 month (31 days)', () => {
            expect(floorDate(
                moment('2020-01-16T11:59'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should floor date down from middle with 1 month (31 days)', () => {
            expect(floorDate(
                moment('2020-01-16T12:00'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should floor date down with 2 month', () => {
            expect(floorDate(
                moment('2020-01-31T23:59'),
                2,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should floor date down from middle with 2 month', () => {
            expect(floorDate(
                moment('2020-02-01T00:00'),
                2,
                'month'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        // errors

        it('should throw an error when a negative value is used', () => {
            expect(() => {
                floorDate(moment('2020-01-01'), -1, 'millisecond');
            }).toThrow();
        });
    });

    describe('ceilDate', () => {

        // days

        it('should ceil date up with 1 day', () => {
            expect(ceilDate(
                moment('2020-01-01T11:59'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should ceil date up from middle with 1 day', () => {
            expect(ceilDate(
                moment('2020-01-01T12:00'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should ceil same date on boundary with 1 day', () => {
            expect(ceilDate(
                moment('2020-01-02'),
                1,
                'day'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should ceil date up with 2 day', () => {
            expect(ceilDate(
                moment('2020-01-01T23:59'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        it('should ceil date up from middle with 2 day', () => {
            expect(ceilDate(
                moment('2020-01-02T00:00'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        it('should ceil same date on boundary with 2 day', () => {
            expect(ceilDate(
                moment('2020-01-03'),
                2,
                'day'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        // months

        it('should ceil date up with 1 month (31 days)', () => {
            expect(ceilDate(
                moment('2020-01-16T11:59'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-02-01 00:00:00');
        });

        it('should ceil date up from middle with 1 month (31 days)', () => {
            expect(ceilDate(
                moment('2020-01-16T12:00'),
                1,
                'month'
            ).format(kDateFormat)).toBe('2020-02-01 00:00:00');
        });

        it('should ceil date up with 2 month', () => {
            expect(ceilDate(
                moment('2020-01-31T23:59'),
                2,
                'month'
            ).format(kDateFormat)).toBe('2020-03-01 00:00:00');
        });

        it('should ceil date up from middle with 2 month', () => {
            expect(ceilDate(
                moment('2020-02-01T00:00'),
                2,
                'month'
            ).format(kDateFormat)).toBe('2020-03-01 00:00:00');
        });
    });

    describe('dateUnitsWithDuration', () => {

        it('should convert valid durations', () => {
            expect(dateUnitsWithDuration(moment.duration(0))).toEqual([0, 'millisecond']);
            expect(dateUnitsWithDuration(moment.duration(2))).toEqual([2, 'millisecond']);
            expect(dateUnitsWithDuration(moment.duration(2, 'ms'))).toEqual([2, 'millisecond']);

            expect(dateUnitsWithDuration(moment.duration(2, 'second'))).toEqual([2, 'second']);
            expect(dateUnitsWithDuration(moment.duration(0, 'second'))).toEqual([0, 'millisecond']);

            expect(dateUnitsWithDuration(moment.duration(2, 'minute'))).toEqual([2, 'minute']);
            expect(dateUnitsWithDuration(moment.duration(2, 'hour'))).toEqual([2, 'hour']);
            expect(dateUnitsWithDuration(moment.duration(2, 'day'))).toEqual([2, 'day']);
            expect(dateUnitsWithDuration(moment.duration(2, 'month'))).toEqual([2, 'month']);
            expect(dateUnitsWithDuration(moment.duration(2, 'year'))).toEqual([2, 'year']);
        });

        it('should throw with invalid durations', () => {
            expect(() => {
                dateUnitsWithDuration(moment.duration(1, 'week'));
            }).toThrow();

            expect(() => {
                let duration = moment.duration(
                    moment('2020-02-01').diff(moment('2020-03-01'))
                );
                dateUnitsWithDuration(duration);
            }).toThrow();
        });
    });
});
