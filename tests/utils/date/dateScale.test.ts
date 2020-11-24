import moment from 'moment-timezone';
import {
    dateTicks, decodeDate, encodeDate,
} from '../../../src/utils/date/dateScale';
import {
    DateTickInput,
    getDateTicks,
    getExpectedDateTicks,
} from './dateScaleUtil';
import {
    getExpectedLinearTicks,
    LinearTickInput,
} from '../linearScaleUtil';
import Decimal from 'decimal.js';

const k1 = new Decimal(1);
const k10 = new Decimal(10);

describe('scale', () => {

    beforeAll(() => {
        // Fix time zone to test DST
        let zoneName = 'NZ';
        expect(moment.tz.zone(zoneName)).toBeTruthy();
        moment.tz.setDefault(zoneName);
    });

    describe('encodeDate', () => {

        it('should scale and offset the date with day base unit', () => {
            let x = encodeDate(moment('2000-01-02 12:00'), {
                originDate: moment('2000-01-01'),
                baseUnit: 'day',
            });
            expect(x.toString()).toBe('1.5');
        });

        it('should scale and offset the date with hour base unit', () => {
            let x = encodeDate(moment('2000-01-01 02:30'), {
                originDate: moment('2000-01-01'),
                baseUnit: 'hour',
            });
            expect(x.toString()).toBe('2.5');
        });

        it('should scale and offset the date with hour base unit and near origin', () => {
            let x = encodeDate(moment('2000-01-01 02:30'), {
                originDate: moment('1999-01-01'),
                baseUnit: 'hour',
            });
            expect(x.toString()).toBe('8762.5');
        });

        it('should scale and offset the date with hour base unit and default origin', () => {
            // Default origin is Unix Epoch.
            let x = encodeDate(moment('2000-01-01 02:30'), {
                baseUnit: 'hour',
            });
            expect(x.toString()).toBe('262970.5');
        });
    });

    describe('decodeDate', () => {

        it('should revert scale and offset the date with day base unit', () => {
            let x = decodeDate(1.5, {
                originDate: moment('2000-01-01'),
                baseUnit: 'day',
            });
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-02 12:00');
        });

        it('should revert scale and offset the date with hour base unit', () => {
            let x = decodeDate(2.5, {
                originDate: moment('2000-01-01'),
                baseUnit: 'hour',
            });
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should revert scale and offset the date with hour base unit and near origin', () => {
            let x = decodeDate(8762.5, {
                originDate: moment('1999-01-01'),
                baseUnit: 'hour',
            });
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });

        it('should revert scale and offset the date with hour base unit and default origin', () => {
            // Default origin is Unix Epoch.
            let x = decodeDate(262970.5, {
                baseUnit: 'hour',
            });
            expect(x.format('YYYY-MM-DD HH:mm')).toBe('2000-01-01 02:30');
        });
    });

    describe('dateTicks', () => {

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

        it('should divide 1 day into 2 hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-02'),
                stride: moment.duration(2, 'hour'),
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
            let start = moment('2020-01-01 10:00:00:000');
            let end = moment('2020-01-01 10:00:00:001');

            let ticks = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: 0.1,
                    baseUnit: 'millisecond',
                }
            ).map(x => x.toString());

            let linearInput: LinearTickInput = {
                start: start.valueOf(),
                end: end.valueOf(),
                stride: 0.1,
            };

            expect(ticks).toEqual(getExpectedLinearTicks(linearInput));
        });

        // divide an empty duration

        it('should return empty array for an point duration', () => {
            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-01 10:00');

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: 1,
                    baseUnit: 'millisecond',
                }
            );
            expect(x).toEqual([]);
        });

        it('should return empty array for a reverse duration', () => {
            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-01 09:00');

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: 1,
                    baseUnit: 'hour',
                }
            );
            expect(x).toEqual([]);
        });

        // scaling

        it('should divide into days with day base unit', () => {
            let originDate = moment('2020-01-01');

            let ticks = dateTicks(
                moment('2020-01-11').diff(originDate, 'day'),
                moment('2020-01-16').diff(originDate, 'day'),
                {
                    minInterval: 1,
                    baseUnit: 'day',
                    originDate,
                }
            ).map(x => x.toNumber());
            expect(ticks).toEqual([10, 11, 12, 13, 14, 15]);

            // Check that origin date has not been modified
            expect(originDate.format('YYYY-MM-DD')).toBe('2020-01-01')
        });

        it('should divide into hours with day base unit', () => {
            let originDate = moment('2020-01-01');

            let ticks = dateTicks(
                moment('2020-01-11 00:00').diff(originDate, 'day', true),
                moment('2020-01-11 05:00').diff(originDate, 'day', true),
                {
                    minDuration: moment.duration(1, 'hour'),
                    baseUnit: 'day',
                    originDate,
                }
            ).map(x => x.toFixed(6));
            expect(ticks).toEqual([
                10,
                k10.add(k1.div(24)),
                k10.add(k1.div(24).mul(2)),
                k10.add(k1.div(24).mul(3)),
                k10.add(k1.div(24).mul(4)),
                k10.add(k1.div(24).mul(5)),
            ].map(x => x.toFixed(6)));
        });
    });
});
