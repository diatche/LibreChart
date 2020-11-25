import {
    compareDateUnits, kDateUnitUniformMs,
} from '../../../src/utils/date/dateBase';

describe('dateBase', () => {

    describe('kDateUnitUniformMs', () => {

        it ('should have correct values', () => {
            expect(kDateUnitUniformMs['year'].div(kDateUnitUniformMs['month']).toNumber()).toBe(12);
            expect(kDateUnitUniformMs['month'].div(kDateUnitUniformMs['day']).toNumber()).toBe(30);
            expect(kDateUnitUniformMs['day'].div(kDateUnitUniformMs['hour']).toNumber()).toBe(24);
            expect(kDateUnitUniformMs['hour'].div(kDateUnitUniformMs['minute']).toNumber()).toBe(60);
            expect(kDateUnitUniformMs['minute'].div(kDateUnitUniformMs['second']).toNumber()).toBe(60);
            expect(kDateUnitUniformMs['second'].div(kDateUnitUniformMs['millisecond']).toNumber()).toBe(1000);
            expect(kDateUnitUniformMs['millisecond'].toNumber()).toBe(1);
        });
    });

    describe('compareDateUnits', () => {

        it('should compare correctly', () => {
            expect(compareDateUnits('hour', 'second')).toBe(2);
            expect(compareDateUnits('hour', 'minute')).toBe(1);
            expect(compareDateUnits('hour', 'hour')).toBe(0);
            expect(compareDateUnits('hour', 'day')).toBe(-1);
            expect(compareDateUnits('hour', 'month')).toBe(-2);
            expect(compareDateUnits('hour', 'foo' as any)).toBe(NaN);
        });
    });
});
