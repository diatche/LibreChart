import {
    compareDateUnits,
} from '../../src/utils/dateBase';

describe('dateBase', () => {

    describe('compareDateUnits', () => {

        it('should compare correctly', () => {
            expect(compareDateUnits('hours', 'seconds')).toBe(2);
            expect(compareDateUnits('hours', 'minutes')).toBe(1);
            expect(compareDateUnits('hours', 'hours')).toBe(0);
            expect(compareDateUnits('hours', 'days')).toBe(-1);
            expect(compareDateUnits('hours', 'months')).toBe(-2);
            expect(compareDateUnits('hours', 'foo' as any)).toBe(NaN);
        });
    });
});
