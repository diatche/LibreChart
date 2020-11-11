import {
    ticks,
} from '../../src/utils/scale';

describe('scale', () => {

    describe('ticks', () => {

        // single integer digits

        it('should default to tick interval of 1 with single integer digits', () => {
            let x = ticks(0, 5)
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should fall back to tick interval of 2 with single integer digits', () => {
            let x = ticks(0, 5, { padding: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '2', '4']);
        });

        it('should fall back to tick interval of 5 with single integer digits', () => {
            let x = ticks(0, 5, { padding: 2.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should fall back to zero tick interval with single integer digits', () => {
            let x = ticks(0, 5, { padding: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // fractions

        it('should default to tick interval of 1 with fractions', () => {
            let x = ticks(0.0, 0.5)
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
        });

        it('should fall back to tick interval of 2 with fractions', () => {
            let x = ticks(0.0, 0.5, { padding: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.2', '0.4']);
        });

        it('should fall back to tick interval of 5 with fractions', () => {
            let x = ticks(0.0, 0.5, { padding: 0.21 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5']);
        });

        it('should fall back to zero tick interval with fractions', () => {
            let x = ticks(0.0, 0.5, { padding: 0.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // offset

        it('should default to tick interval of 1 with offset', () => {
            let x = ticks(10, 15)
                .map(x => x.toString());
            expect(x).toEqual(['10', '11', '12', '13', '14', '15']);
        });

        it('should fall back to tick interval of 2 with offset', () => {
            let x = ticks(10, 15, { padding: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '12', '14']);
        });

        it('should fall back to tick interval of 5 with offset', () => {
            let x = ticks(10, 15, { padding: 2.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '15']);
        });

        it('should fall back to zero tick interval with offset', () => {
            let x = ticks(10, 15, { padding: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10']);
        });

        // negative

        it('should default to tick interval of 1 with negative numbers', () => {
            let x = ticks(-10, -5)
                .map(x => x.toString());
            expect(x).toEqual(['-10', '-9', '-8', '-7', '-6', '-5']);
        });

        // expand

        it('should default to tick interval of 1 with expand', () => {
            let x = ticks(0.1, 4.9, { expand: true })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should fall back to tick interval of 2 with expand', () => {
            let x = ticks(0.1, 4.9, { expand: true, padding: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '2', '4', '6']);
        });

        it('should fall back to tick interval of 5 with expand', () => {
            let x = ticks(0.1, 4.9, { expand: true, padding: 2.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should not fall back to zero tick interval with expand', () => {
            let x = ticks(0.1, 4.9, { expand: true, padding: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '10']);
        });
    });
});
