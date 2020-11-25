import moment from 'moment-timezone';
import DateScale from '../../../src/utils/date/DateScale';
import {
    DateTickInput,
    getDateTicks,
    getExpectedDateTicks,
} from './dateScaleUtil';
import {
    $,
    getExpectedLinearTicks,
    LinearTickInput,
} from '../linearScaleUtil';
import Decimal from 'decimal.js';

const k1 = new Decimal(1);
const k10 = new Decimal(10);

describe('DateScale', () => {

    beforeAll(() => {
        // Fix time zone to test DST
        let zoneName = 'NZ';
        expect(moment.tz.zone(zoneName)).toBeTruthy();
        moment.tz.setDefault(zoneName);
    });

    describe('encodeDate', () => {

        it('should scale and offset the date with day base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'day',
            });
            let x = scale.encodeDate(moment('2000-01-02 12:00'));
            expect(x.toString()).toBe('1.5');
        });

        it('should scale and offset the date with hour base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.encodeDate(moment('2000-01-01 02:30'));
            expect(x.toString()).toBe('2.5');
        });

        it('should scale and offset the date with hour base unit and near origin', () => {
            let scale = new DateScale({
                originDate: moment('1999-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.encodeDate(moment('2000-01-01 02:30'));
            expect(x.toString()).toBe('8762.5');
        });

        it('should scale and offset the date with hour base unit and default origin', () => {
            // Default origin is Unix Epoch.
            let scale = new DateScale({
                baseUnit: 'hour',
            });
            let x = scale.encodeDate(moment('2000-01-01 02:30'));
            expect(x.toString()).toBe('262970.5');
        });
    });

    describe('decodeDate', () => {

        it('should revert scale and offset the date with day base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'day',
            });
            let x = scale.decodeDate(new Decimal(1.5));
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-02 12:00');
        });

        it('should revert scale and offset the date with hour base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.decodeDate(new Decimal(2.5));
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should revert scale and offset the date with hour base unit and near origin', () => {
            let scale = new DateScale({
                originDate: moment('1999-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.decodeDate(new Decimal(8762.5));
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should revert scale and offset the date with hour base unit and default origin', () => {
            let scale = new DateScale({
                baseUnit: 'hour',
            });
            // Default origin is Unix Epoch.
            let x = scale.decodeDate(new Decimal(262970.5));
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });
    });

    describe('getTicks', () => {

        // divide into years

        it('should divide years into decades when not expanding', () => {
            let input: DateTickInput = {
                start: moment('1900-01-01'),
                end: moment('2000-01-01'),
                stride: moment.duration(10, 'year'),
                format: 'YYYY-MM-DD',
                constraints: {
                    baseUnit: 'year',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide years into 1 month intervals

        it('should divide 1 year into 1 month intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2021-01-01'),
                stride: moment.duration(1, 'month'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'month',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide months into 1 day intervals

        it('should divide 1 month (30 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-06-01'),
                end: moment('2020-07-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (30 days) into 1 day intervals accross DST when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-04-01'),
                end: moment('2020-05-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
            };
            expect(input.start.utcOffset()).not.toEqual(input.end.utcOffset());
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (31 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-02-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (28 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2019-02-01'),
                end: moment('2019-03-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (29 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-02-01'),
                end: moment('2020-03-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide months into 2 day intervals

        it('should divide 1 month (30 days) into 2 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-06-01'),
                end: moment('2020-07-01'),
                stride: moment.duration(2, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (28 days) into 2 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2019-02-01'),
                end: moment('2019-03-01'),
                stride: moment.duration(2, 'day'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                },
                expectedOverrides: {
                    start: moment('2019-02-01'),
                    end: moment('2019-03-01'),
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide days into hours

        it('should divide 1 day into hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-02'),
                stride: moment.duration(1, 'hour'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'hour',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 day into 3 hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-02'),
                stride: moment.duration(3, 'hour'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'hour',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 2 days into 12 hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-03'),
                stride: moment.duration(12, 'hour'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'hour',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide hours into minutes

        it('should divide 1 hour into 10 minutes when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00'),
                end: moment('2020-01-02 11:00'),
                stride: moment.duration(10, 'minute'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'minute',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 hour into 30 minutes when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00'),
                end: moment('2020-01-02 11:00'),
                stride: moment.duration(30, 'minute'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'minute',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 48 hours into 30 minutes when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00'),
                end: moment('2020-01-03 10:00'),
                stride: moment.duration(30, 'minute'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'minute',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide minutes into seconds

        it('should divide 1 minute into 10 seconds when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00'),
                end: moment('2020-01-01 10:01'),
                stride: moment.duration(10, 'second'),
                format: 'YYYY-MM-DD HH:mm:ss',
                constraints: {
                    baseUnit: 'minute',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide seconds into milliseconds

        it('should divide 1 second into 10 milliseconds when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00:00'),
                end: moment('2020-01-01 10:00:01'),
                stride: moment.duration(10, 'millisecond'),
                format: 'YYYY-MM-DD HH:mm:ss:SSS',
                constraints: {
                    baseUnit: 'second',
                },
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide milliseconds

        it('should divide 1 millisecond when not expanding', () => {
            // The default origin date is on unix epoch, but is in
            // the current time zone. Use the UTC unix epoch instead.
            let scale = new DateScale({
                baseUnit: 'millisecond',
                originDate: moment.unix(0),
            });

            let start = moment('2020-01-01 10:00:00:000');
            let end = moment('2020-01-01 10:00:00:001');

            let ticks = scale.getTicks(start, end, { minInterval: $(0.1) })
                .map(x => x.location.toString());

            let linearInput: LinearTickInput = {
                start: start.valueOf(),
                end: end.valueOf(),
                stride: 0.1,
            };

            expect(ticks).toEqual(getExpectedLinearTicks(linearInput));
        });

        // divide an empty duration

        it('should return empty array for an point duration', () => {
            let scale = new DateScale({
                baseUnit: 'millisecond',
            });
            
            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-01 10:00');
            let ticks = scale.getTicks(start, end, { minInterval: k1 })
                .map(x => x.location.toString());

            expect(ticks).toEqual([]);
        });

        it('should return empty array for a reverse duration', () => {
            let scale = new DateScale({
                baseUnit: 'hour',
            });

            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-01 09:00');
            let ticks = scale.getTicks(start, end, { minInterval: k1 })
                .map(x => x.location.toString());

            expect(ticks).toEqual([]);
        });

        // scaling

        it('should divide into days with day base unit', () => {
            let originDate = moment('2020-01-01');
            let scale = new DateScale({
                baseUnit: 'day',
                originDate,
            });

            let start = moment('2020-01-11');
            let end = moment('2020-01-16');
            let ticks = scale.getTicks(start, end, { minInterval: k1 })
                .map(x => x.location.toNumber());
            expect(ticks).toEqual([10, 11, 12, 13, 14, 15]);

            // Check that origin date has not been modified
            expect(originDate.format('YYYY-MM-DD')).toBe('2020-01-01')
        });

        it('should divide into hours with day base unit', () => {
            let originDate = moment('2020-01-01');
            let scale = new DateScale({
                baseUnit: 'day',
                originDate,
            });

            let start = moment('2020-01-11 00:00');
            let end = moment('2020-01-11 05:00');
            let ticks = scale.getTicks(start, end, {
                minDuration: moment.duration(1, 'hour'),
            });
            let locations = ticks.map(x => x.location.toFixed(6));
            let dates = ticks.map(x => x.value.format('YYYY-MM-DD HH:mm'));

            expect(locations).toEqual([
                10,
                k10.add(k1.div(24)),
                k10.add(k1.div(24).mul(2)),
                k10.add(k1.div(24).mul(3)),
                k10.add(k1.div(24).mul(4)),
                k10.add(k1.div(24).mul(5)),
            ].map(x => x.toFixed(6)));

            expect(dates).toEqual([
                '2020-01-11 00:00',
                '2020-01-11 01:00',
                '2020-01-11 02:00',
                '2020-01-11 03:00',
                '2020-01-11 04:00',
                '2020-01-11 05:00'
            ]);
        });

        // max count

        it('should divide days into hours but no more than max count', () => {
            let input: DateTickInput = {
                start: moment('2019-12-30T12:00'),
                end: moment('2019-12-30T18:00'),
                stride: moment.duration(3, 'hour'),
                format: 'YYYY-MM-DD HH:mm',
                constraints: {
                    baseUnit: 'day',
                    minDuration: undefined,
                    maxCount: $(5),
                },
            };
            let ticks = getDateTicks(input);
            expect(ticks.length).toBeLessThanOrEqual(5);
            expect(ticks).toEqual(getExpectedDateTicks(input));
        });
    });
});
