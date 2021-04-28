import moment from 'moment-timezone';
import DateScale from '../../src/scale/DateScale';
import {
    DateTickInput,
    getDateTicks,
    getExpectedDateTicks,
} from './dateScaleUtil';
import { getExpectedLinearTicks, LinearTickInput } from './linearScaleUtil';
import Decimal from 'decimal.js';

const k1 = new Decimal(1);
const k10 = new Decimal(10);

const kDateFormat = 'YYYY-MM-DD';
const kDateTimeFormat = 'YYYY-MM-DD HH:mm';

describe('DateScale', () => {
    beforeAll(() => {
        // Fix time zone to test DST
        let zoneName = 'NZ';
        expect(moment.tz.zone(zoneName)).toBeTruthy();
        moment.tz.setDefault(zoneName);
    });

    describe('compareValues', () => {
        it('should return the correct order', () => {
            let scale = new DateScale({
                baseUnit: 'millisecond',
            });
            expect(scale.compareValues(moment.unix(1), moment.unix(2))).toBe(
                -1000
            );
            expect(scale.compareValues(moment.unix(1), moment.unix(1))).toBe(0);
            expect(scale.compareValues(moment.unix(2), moment.unix(1))).toBe(
                1000
            );
        });
    });

    describe('nextValue', () => {
        it('should return the next value with whole interval', () => {
            let scale = new DateScale({
                baseUnit: 'day',
            });
            expect(
                scale.nextValue(moment('2020-01-01')).format('YYYY-MM-DD HH:mm')
            ).toBe('2020-01-02 00:00');
        });

        it('should return the next value with partial interval', () => {
            let scale = new DateScale({
                baseUnit: 'hour',
            });
            scale.updateTickScale(
                moment('2020-01-01'),
                moment('2020-01-01 01:00'),
                {
                    minInterval: {
                        value: moment.duration(10, 'minute'),
                    },
                }
            );
            expect(
                scale.nextValue(moment('2020-01-01')).format('YYYY-MM-DD HH:mm')
            ).toBe('2020-01-01 00:10');
        });
    });

    describe('locationOfValue', () => {
        it('should scale and offset the date with day base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'day',
            });
            let x = scale.locationOfValue(moment('2000-01-02 12:00'));
            expect(x.toString()).toBe('1.5');
        });

        it('should scale and offset the date with hour base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.locationOfValue(moment('2000-01-01 02:30'));
            expect(x.toString()).toBe('2.5');
        });

        it('should scale and offset the date with hour base unit and near origin', () => {
            let scale = new DateScale({
                originDate: moment('1999-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.locationOfValue(moment('2000-01-01 02:30'));
            expect(x.toString()).toBe('8762.5');
        });

        it('should scale and offset the date with hour base unit and default origin', () => {
            // Default origin is Unix Epoch.
            let scale = new DateScale({
                baseUnit: 'hour',
            });
            let x = scale.locationOfValue(moment('2000-01-01 02:30'));
            expect(x.toString()).toBe('262970.5');
        });

        it('should convert location to correct date with half days', () => {
            let scale = new DateScale({
                baseUnit: 'day',
                originDate: moment('2020-01-01'),
            });
            scale.tickScale = {
                origin: {
                    value: moment('2019-12-29'),
                    location: -3,
                },
                interval: {
                    value: moment.duration(0.5, 'day'),
                    location: 0.5,
                },
            };
            expect(
                scale.locationOfValue(moment('2020-01-01 00:00')).toString()
            ).toBe('0');
            expect(
                scale.locationOfValue(moment('2020-01-02 12:00')).toString()
            ).toBe('1.5');
            expect(
                scale.locationOfValue(moment('2020-01-04 00:00')).toString()
            ).toBe('3');
            expect(
                scale.locationOfValue(moment('2020-01-07 00:00')).toString()
            ).toBe('6');
            expect(
                scale.locationOfValue(moment('2020-01-11 12:00')).toString()
            ).toBe('10.5');
            expect(
                scale.locationOfValue(moment('2019-12-30 12:00')).toString()
            ).toBe('-1.5');
            expect(
                scale.locationOfValue(moment('2019-12-29 00:00')).toString()
            ).toBe('-3');
            expect(
                scale.locationOfValue(moment('2019-12-26 00:00')).toString()
            ).toBe('-6');
            expect(
                scale.locationOfValue(moment('2019-12-21 12:00')).toString()
            ).toBe('-10.5');
        });
    });

    describe('valueAtLocation', () => {
        it('should revert scale and offset the date with day base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'day',
            });
            let x = scale.valueAtLocation(1.5);
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-02 12:00');
        });

        it('should revert scale and offset the date with hour base unit', () => {
            let scale = new DateScale({
                originDate: moment('2000-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.valueAtLocation(2.5);
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should revert scale and offset the date with hour base unit and near origin', () => {
            let scale = new DateScale({
                originDate: moment('1999-01-01'),
                baseUnit: 'hour',
            });
            let x = scale.valueAtLocation(8762.5);
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should revert scale and offset the date with hour base unit and default origin', () => {
            let scale = new DateScale({
                baseUnit: 'hour',
            });
            // Default origin is Unix Epoch.
            let x = scale.valueAtLocation(262970.5);
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should convert date to correct location with half days', () => {
            let scale = new DateScale({
                baseUnit: 'day',
                originDate: moment('2020-01-01'),
            });
            scale.tickScale = {
                origin: {
                    value: moment('2019-12-29'),
                    location: -3,
                },
                interval: {
                    value: moment.duration(0.5, 'day'),
                    location: 0.5,
                },
            };

            expect(scale.valueAtLocation(0).format(kDateTimeFormat)).toBe(
                '2020-01-01 00:00'
            );
            expect(scale.valueAtLocation(1.5).format(kDateTimeFormat)).toBe(
                '2020-01-02 12:00'
            );
            expect(scale.valueAtLocation(3).format(kDateTimeFormat)).toBe(
                '2020-01-04 00:00'
            );
            expect(scale.valueAtLocation(6).format(kDateTimeFormat)).toBe(
                '2020-01-07 00:00'
            );
            expect(scale.valueAtLocation(10.5).format(kDateTimeFormat)).toBe(
                '2020-01-11 12:00'
            );
            expect(scale.valueAtLocation(-1.5).format(kDateTimeFormat)).toBe(
                '2019-12-30 12:00'
            );
            expect(scale.valueAtLocation(-3).format(kDateTimeFormat)).toBe(
                '2019-12-29 00:00'
            );
            expect(scale.valueAtLocation(-6).format(kDateTimeFormat)).toBe(
                '2019-12-26 00:00'
            );
            expect(scale.valueAtLocation(-10.5).format(kDateTimeFormat)).toBe(
                '2019-12-21 12:00'
            );
        });
    });

    describe('updateTickScale', () => {
        it('should should update scale correctly with half days with whole origin', () => {
            let scale = new DateScale({
                baseUnit: 'day',
                originDate: moment('2020-01-01'),
                // minorTickDepth: 1,
            });

            scale.updateTickScale(
                moment('2019-12-29T06:41'),
                moment('2020-01-04T07:18'),
                {
                    minInterval: {
                        value: moment.duration(0.4, 'day'),
                    },
                    expand: true,
                }
            );

            // Origin should be 2 days before 2020-01-01
            expect(
                scale.tickScale.origin.value.format(kDateTimeFormat)
            ).toEqual('2019-12-29 00:00');
            expect(scale.tickScale.origin.location).toBe(-3);

            // Scale should be half a day
            expect(scale.tickScale.interval.value.asDays()).toBe(0.5);
            expect(scale.tickScale.interval.location).toBe(0.5);
        });

        it('should should update scale correctly with half days with fractional origin', () => {
            let scale = new DateScale({
                baseUnit: 'day',
                originDate: moment('2020-01-01'),
                // minorTickDepth: 1,
            });

            scale.updateTickScale(
                moment('2019-12-29T16:41'),
                moment('2020-01-04T07:18'),
                {
                    minInterval: {
                        value: moment.duration(0.4, 'day'),
                    },
                    expand: true,
                }
            );

            // Origin should be 2.5 days before 2020-01-01
            expect(
                scale.tickScale.origin.value.format(kDateTimeFormat)
            ).toEqual('2019-12-29 12:00');
            expect(scale.tickScale.origin.location).toBe(-2.5);

            // Scale should be half a day
            expect(scale.tickScale.interval.value.asDays()).toBe(0.5);
            expect(scale.tickScale.interval.location).toBe(0.5);
        });
    });

    describe('getTicksInLocationRange', () => {
        it('should return correct ticks 5 days apart', () => {
            let scale = new DateScale({
                baseUnit: 'day',
                originDate: moment('2020-01-01'),
            });

            scale.tickScale = {
                origin: {
                    value: moment('2019-12-12'),
                    location: -20,
                },
                interval: {
                    value: moment.duration(5, 'day'),
                    location: 5,
                },
            };

            let ticks = scale.getTicksInLocationRange(-45, 0).map(t => ({
                value: t.value.format(kDateTimeFormat),
                location: t.location,
            }));

            expect(ticks).toEqual([
                { value: '2019-11-17 00:00', location: -45 },
                { value: '2019-11-22 00:00', location: -40 },
                { value: '2019-11-27 00:00', location: -35 },
                { value: '2019-12-02 00:00', location: -30 },
                { value: '2019-12-07 00:00', location: -25 },
                { value: '2019-12-12 00:00', location: -20 },
                { value: '2019-12-17 00:00', location: -15 },
                { value: '2019-12-22 00:00', location: -10 },
                { value: '2019-12-27 00:00', location: -5 },
            ]);
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

        it('should not divide 1 millisecond when not expanding', () => {
            // The default origin date is on unix epoch, but is in
            // the current time zone. Use the UTC unix epoch instead.
            let scale = new DateScale({
                baseUnit: 'millisecond',
                originDate: moment.unix(0),
            });

            let start = moment('2020-01-01 10:00:00:000');
            let end = moment('2020-01-01 10:00:00:001');

            let ticks = scale
                .getTicks(start, end, {
                    minInterval: { location: 0.1 },
                })
                .map(x => x.location.toString());

            let linearInput: LinearTickInput = {
                start: start.valueOf(),
                end: end.valueOf(),
                stride: 1,
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
            let ticks = scale
                .getTicks(start, end, {
                    minInterval: { location: 1 },
                })
                .map(x => x.location.toString());

            expect(ticks).toEqual([]);
        });

        it('should return empty array for a reverse duration', () => {
            let scale = new DateScale({
                baseUnit: 'hour',
            });

            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-01 09:00');
            let ticks = scale
                .getTicks(start, end, {
                    minInterval: { location: 1 },
                })
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
            let ticks = scale
                .getTicks(start, end, {
                    minInterval: { location: 1 },
                })
                .map(x => x.location);
            expect(ticks).toEqual([10, 11, 12, 13, 14, 15]);

            // Check that origin date has not been modified
            expect(originDate.format('YYYY-MM-DD')).toBe('2020-01-01');
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
                minInterval: { value: moment.duration(1, 'hour') },
            });
            let locations = ticks.map(x => x.location.toFixed(6));
            let dates = ticks.map(x => x.value.format('YYYY-MM-DD HH:mm'));

            expect(dates).toEqual([
                '2020-01-11 00:00',
                '2020-01-11 01:00',
                '2020-01-11 02:00',
                '2020-01-11 03:00',
                '2020-01-11 04:00',
                '2020-01-11 05:00',
            ]);

            expect(locations).toEqual(
                [
                    10,
                    k10.add(k1.div(24)),
                    k10.add(k1.div(24).mul(2)),
                    k10.add(k1.div(24).mul(3)),
                    k10.add(k1.div(24).mul(4)),
                    k10.add(k1.div(24).mul(5)),
                ].map(x => x.toFixed(6))
            );
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
                    minInterval: undefined,
                    maxCount: 5,
                },
            };
            let ticks = getDateTicks(input);
            expect(ticks.length).toBeLessThanOrEqual(5);
            expect(ticks).toEqual(getExpectedDateTicks(input));
        });
    });
});
