import {
    compareDateUnits,
} from '../../../src/utils/date/dateBase';

describe('dateBase', () => {

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
