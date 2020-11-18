import Decimal from 'decimal.js';
import moment from 'moment';
import {
    dateTicks,
} from '../../src/utils/dateScale';
import {
    DateTickInput,
    getDateTicks,
    getExpectedDateTicks,
} from './dateScaleUtil';
import {
    getExpectedLinearTicks,
    getLinearTicks,
    LinearTickInput,
} from './linearScaleUtil';

describe('scale', () => {

    describe('dateTicks', () => {

        // divide months into 1 day intervals

        it('should divide 1 month (30 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-04-01'),
                end: moment('2020-05-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (31 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-02-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (28 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2019-02-01'),
                end: moment('2019-03-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (29 days) into 1 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-02-01'),
                end: moment('2020-03-01'),
                stride: moment.duration(1, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide months into 2 day intervals

        it('should divide 1 month (30 days) into 2 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-04-01'),
                end: moment('2020-05-01'),
                stride: moment.duration(2, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (31 days) into 2 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-02-01'),
                stride: moment.duration(2, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (28 days) into 2 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2019-02-01'),
                end: moment('2019-03-01'),
                stride: moment.duration(2, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 month (29 days) into 2 day intervals when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-02-01'),
                end: moment('2020-03-01'),
                stride: moment.duration(2, 'day'),
                format: 'YYYY-MM-DD',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        // divide days into hours

        it('should divide 1 day into hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-02'),
                stride: moment.duration(1, 'hour'),
                format: 'YYYY-MM-DD HH',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 day into 2 hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-02'),
                stride: moment.duration(2, 'hour'),
                format: 'YYYY-MM-DD HH',
                constraints: {
                    minDuration: moment.duration(1.1, 'hour'),
                }
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 2 days into 12 hours when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01'),
                end: moment('2020-01-03'),
                stride: moment.duration(12, 'hour'),
                format: 'YYYY-MM-DD HH',
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
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 1 hour into 30 minutes when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00'),
                end: moment('2020-01-02 11:00'),
                stride: moment.duration(30, 'minute'),
                format: 'YYYY-MM-DD HH:mm',
            };
            expect(getDateTicks(input)).toEqual(getExpectedDateTicks(input));
        });

        it('should divide 48 hours into 30 minutes when not expanding', () => {
            let input: DateTickInput = {
                start: moment('2020-01-01 10:00'),
                end: moment('2020-01-03 10:00'),
                stride: moment.duration(30, 'minute'),
                format: 'YYYY-MM-DD HH:mm',
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
                }
            );
            expect(x).toEqual([]);
        });
    });
});
