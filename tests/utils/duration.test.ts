import moment from 'moment-timezone';
import {
    ceilDate,
    floorDate,
    interpolatedDate,
    roundDate,
} from '../../src/utils/duration';

const kDateFormat = 'YYYY-MM-DD HH:mm:ss';

describe('duration', () => {

    beforeAll(() => {
        // Fix time zone to test daylight savings
        let zoneName = 'NZ';
        expect(moment.tz.zone(zoneName)).toBeTruthy();
        moment.tz.setDefault(zoneName);
    });

    describe('interpolatedDate', () => {

        it('should change UTC offset accross daylight savings', () => {
            let start = moment('2020-04-01');
            let end = moment('2020-05-01');
            expect(start.utcOffset()).not.toBe(end.utcOffset());
            expect(interpolatedDate(start, end, 0).utcOffset()).toBe(start.utcOffset());
            expect(interpolatedDate(start, end, 1).utcOffset()).toBe(end.utcOffset());
        });
    });

    describe('roundDate', () => {

        // days

        it('should round date down with 1 day', () => {
            expect(roundDate(
                moment('2020-01-01T11:59'),
                1,
                'days'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 day with postive time zone', () => {
            let date = moment.utc('2020-01-01T09:59');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'days');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 day with negative time zone', () => {
            let date = moment.utc('2020-01-01T13:59');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'days');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 1 day', () => {
            expect(roundDate(
                moment('2020-01-01T12:00'),
                1,
                'days'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should round date up with 1 day with positive time zone', () => {
            let date = moment.utc('2020-01-01T10:00');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'days');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-02 00:00:00');
        });

        it('should round date up with 1 day with negative time zone', () => {
            let date = moment.utc('2020-01-01T14:00');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'days');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-02 00:00:00');
        });

        it('should round date down with 2 day', () => {
            expect(roundDate(
                moment('2020-01-01T23:59'),
                2,
                'days'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 2 day', () => {
            expect(roundDate(
                moment('2020-01-02T00:00'),
                2,
                'days'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        // months

        it('should return same date on edge with 1 month (31 days)', () => {
            expect(roundDate(
                moment('2020-01-01'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 month (31 days)', () => {
            expect(roundDate(
                moment('2020-01-16'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 month (31 days) with postive time zone', () => {
            let date = moment.utc('2020-01-16T21:59');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'months');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 1 month (31 days) with negative time zone', () => {
            let date = moment.utc('2020-01-17T01:59');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'months');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 1 month (31 days)', () => {
            expect(roundDate(
                moment('2020-01-17'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-02-01 00:00:00');
        });

        it('should round date up with 1 month (31 days) with postive time zone', () => {
            let date = moment.utc('2020-01-16T22:00');
            date.utcOffset(120);
            let roundedDate = roundDate(date, 1, 'months');
            expect(roundedDate.utcOffset()).toBe(120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-02-01 00:00:00');
        });

        it('should round date up with 1 month (31 days) with negative time zone', () => {
            let date = moment.utc('2020-01-17T02:00');
            date.utcOffset(-120);
            let roundedDate = roundDate(date, 1, 'months');
            expect(roundedDate.utcOffset()).toBe(-120);
            expect(roundedDate.format(kDateFormat))
                .toBe('2020-02-01 00:00:00');
        });

        it('should return same date on edge with 1 month (30 days) accross daylight savings', () => {
            expect(moment('2020-04-01T00:00').utcOffset()).not.toEqual(moment('2020-05-01T00:00').utcOffset());
            expect(roundDate(
                moment('2020-04-01T00:00'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-04-01 00:00:00');
        });

        it('should round date down with 1 month (30 days) accross daylight savings', () => {
            expect(moment('2020-04-01T00:00').utcOffset()).not.toEqual(moment('2020-05-01T00:00').utcOffset());
            expect(roundDate(
                moment('2020-04-15T11:59'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-04-01 00:00:00');
        });

        it('should round date up with 1 month (30 days) accross daylight savings', () => {
            expect(moment('2020-04-01T00:00').utcOffset()).not.toEqual(moment('2020-05-01T00:00').utcOffset());
            expect(roundDate(
                moment('2020-04-16'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-05-01 00:00:00');
        });

        it('should round date down with 2 month', () => {
            expect(roundDate(
                moment('2020-01-31T23:59'),
                2,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date up from middle with 2 month', () => {
            expect(roundDate(
                moment('2020-02-01T00:00'),
                2,
                'months'
            ).format(kDateFormat)).toBe('2020-03-01 00:00:00');
        });

        // errors

        it('should throw an error when a non-interger value is used', () => {
            expect(() => {
                roundDate(moment('2020-01-01'), 0.5, 'milliseconds');
            }).toThrow();
        });
    });

    describe('floorDate', () => {

        // days

        it('should round date down with 1 day', () => {
            expect(floorDate(
                moment('2020-01-01T11:59'),
                1,
                'days'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down from middle with 1 day', () => {
            expect(floorDate(
                moment('2020-01-01T12:00'),
                1,
                'days'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 2 day', () => {
            expect(floorDate(
                moment('2020-01-01T23:59'),
                2,
                'days'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down from middle with 2 day', () => {
            expect(floorDate(
                moment('2020-01-02T00:00'),
                2,
                'days'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        // months

        it('should round date down with 1 month (31 days)', () => {
            expect(floorDate(
                moment('2020-01-16T11:59'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down from middle with 1 month (31 days)', () => {
            expect(floorDate(
                moment('2020-01-16T12:00'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down with 2 month', () => {
            expect(floorDate(
                moment('2020-01-31T23:59'),
                2,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        it('should round date down from middle with 2 month', () => {
            expect(floorDate(
                moment('2020-02-01T00:00'),
                2,
                'months'
            ).format(kDateFormat)).toBe('2020-01-01 00:00:00');
        });

        // errors

        it('should throw an error when a non-interger value is used', () => {
            expect(() => {
                floorDate(moment('2020-01-01'), 0.5, 'milliseconds');
            }).toThrow();
        });
    });

    describe('ceilDate', () => {

        // days

        it('should round date up with 1 day', () => {
            expect(ceilDate(
                moment('2020-01-01T11:59'),
                1,
                'days'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should round date up from middle with 1 day', () => {
            expect(ceilDate(
                moment('2020-01-01T12:00'),
                1,
                'days'
            ).format(kDateFormat)).toBe('2020-01-02 00:00:00');
        });

        it('should round date up with 2 day', () => {
            expect(ceilDate(
                moment('2020-01-01T23:59'),
                2,
                'days'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        it('should round date up from middle with 2 day', () => {
            expect(ceilDate(
                moment('2020-01-02T00:00'),
                2,
                'days'
            ).format(kDateFormat)).toBe('2020-01-03 00:00:00');
        });

        // months

        it('should round date up with 1 month (31 days)', () => {
            expect(ceilDate(
                moment('2020-01-16T11:59'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-02-01 00:00:00');
        });

        it('should round date up from middle with 1 month (31 days)', () => {
            expect(ceilDate(
                moment('2020-01-16T12:00'),
                1,
                'months'
            ).format(kDateFormat)).toBe('2020-02-01 00:00:00');
        });

        it('should round date up with 2 month', () => {
            expect(ceilDate(
                moment('2020-01-31T23:59'),
                2,
                'months'
            ).format(kDateFormat)).toBe('2020-03-01 00:00:00');
        });

        it('should round date up from middle with 2 month', () => {
            expect(ceilDate(
                moment('2020-02-01T00:00'),
                2,
                'months'
            ).format(kDateFormat)).toBe('2020-03-01 00:00:00');
        });
    });
});
