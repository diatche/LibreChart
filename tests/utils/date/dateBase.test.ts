import {
    compareDateUnits, kDateUnitUniformDecimalMs,
} from '../../../src/utils/date/dateBase';

describe('dateBase', () => {

    describe('kDateUnitUniformDecimalMs', () => {

        it ('should have correct values', () => {
            const ms = kDateUnitUniformDecimalMs;
            expect(ms['year'].div(ms['month']).toNumber()).toBe(12);
            expect(ms['month'].div(ms['day']).toNumber()).toBe(30);
            expect(ms['day'].div(ms['hour']).toNumber()).toBe(24);
            expect(ms['hour'].div(ms['minute']).toNumber()).toBe(60);
            expect(ms['minute'].div(ms['second']).toNumber()).toBe(60);
            expect(ms['second'].div(ms['millisecond']).toNumber()).toBe(1000);
            expect(ms['millisecond'].toNumber()).toBe(1);
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
