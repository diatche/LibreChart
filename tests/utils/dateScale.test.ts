import moment from 'moment';
import {
    dateTicks,
} from '../../src/utils/dateScale';

describe('scale', () => {

    describe('dateTicks', () => {

        // days

        it('should divide 1 day into hours when not expanding', () => {
            let start = moment('2020-01-01');
            let end = moment('2020-01-02');
            let strideInput = 1;
            let strideValue = Math.ceil(strideInput);
            let strideUnit: moment.unitOfTime.Base = 'hour';
            let format = 'YYYY-MM-DD HH';

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: moment
                        .duration(strideValue, strideUnit)
                        .asMilliseconds(),
                }
            ).map(x => moment(x.toNumber()).format(format));

            let expectedTicks: string[] = [];
            for (let i = start.clone(); i.isSameOrBefore(end); i.add(strideValue, strideUnit)) {
                expectedTicks.push(i.format(format));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide 1 day into 2 hours when not expanding', () => {
            let start = moment('2020-01-01');
            let end = moment('2020-01-02');
            let strideInput = 1.1;
            let strideValue = Math.ceil(strideInput);
            let strideUnit: moment.unitOfTime.Base = 'hour';
            let format = 'YYYY-MM-DD HH';

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: moment
                        .duration(strideInput, strideUnit)
                        .asMilliseconds(),
                }
            ).map(x => moment(x.toNumber()).format(format));

            let expectedTicks: string[] = [];
            for (let i = start.clone(); i.isSameOrBefore(end); i.add(strideValue, strideUnit)) {
                expectedTicks.push(i.format(format));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide 2 days into 12 hours when not expanding', () => {
            let start = moment('2020-01-01');
            let end = moment('2020-01-03');
            let format = 'YYYY-MM-DD HH';

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: moment
                        .duration(12, 'hours')
                        .asMilliseconds(),
                }
            ).map(x => moment(x.toNumber()).format(format));

            expect(x).toEqual([
                '2020-01-01 00',
                '2020-01-01 12',
                '2020-01-02 00',
                '2020-01-02 12',
                '2020-01-03 00',
            ]);
        });

        // hours

        it('should divide 1 hour into 10 minutes when not expanding', () => {
            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-02 11:00');
            let strideInput = 10;
            let strideValue = Math.ceil(strideInput);
            let strideUnit: moment.unitOfTime.Base = 'minute';
            let format = 'YYYY-MM-DD HH:mm';

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: moment
                        .duration(strideValue, strideUnit)
                        .asMilliseconds(),
                }
            ).map(x => moment(x.toNumber()).format(format));

            let expectedTicks: string[] = [];
            for (let i = start.clone(); i.isSameOrBefore(end); i.add(strideValue, strideUnit)) {
                expectedTicks.push(i.format(format));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide 1 hour into 30 minutes when not expanding', () => {
            let start = moment('2020-01-01 10:00');
            let end = moment('2020-01-02 11:00');
            let strideInput = 30;
            let strideUnit: moment.unitOfTime.Base = 'hour';
            let format = 'YYYY-MM-DD HH:mm';

            let x = dateTicks(
                start.valueOf(),
                end.valueOf(),
                {
                    minInterval: moment
                        .duration(strideInput, strideUnit)
                        .asMilliseconds(),
                }
            ).map(x => moment(x.toNumber()).format(format));

            expect(x).toEqual([
                '2020-01-01 10:00',
                '2020-01-01 10:30',
                '2020-01-01 11:00',
            ]);
        });
    });
});
