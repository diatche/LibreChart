import {
    ticks,
} from '../../src/utils/scale';

describe('scale', () => {

    describe('ticks', () => {

        // single integer digits

        it('should default to tick interval of 1 with single integer digits', () => {
            let x = ticks(0, 5, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should fall back to tick interval of 2 with single integer digits', () => {
            let x = ticks(0, 5, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '2', '4']);
        });

        it('should fall back to tick interval of 5 with single integer digits', () => {
            let x = ticks(0, 5, { minDistance: 2.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should fall back to zero tick interval with single integer digits', () => {
            let x = ticks(0, 5, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // fractions

        it('should default to tick interval of 1 with fractions', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
        });

        it('should fall back to tick interval of 2 with fractions', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.2', '0.4']);
        });

        it('should fall back to tick interval of 5 with fractions', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.21 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5']);
        });

        it('should fall back to zero tick interval with fractions', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // offset

        it('should default to tick interval of 1 with offset', () => {
            let x = ticks(10, 15, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '11', '12', '13', '14', '15']);
        });

        it('should fall back to tick interval of 2 with offset', () => {
            let x = ticks(10, 15, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '12', '14']);
        });

        it('should fall back to tick interval of 5 with offset', () => {
            let x = ticks(10, 15, { minDistance: 2.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '15']);
        });

        it('should fall back to zero tick interval with offset', () => {
            let x = ticks(10, 15, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10']);
        });

        // negative

        it('should default to tick interval of 1 with negative numbers', () => {
            let x = ticks(-10, -5, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '-9', '-8', '-7', '-6', '-5']);
        });

        // expand

        it('should fall back to tick interval of 2 with expand', () => {
            let x = ticks(0.1, 4.9, {
                minDistance: 1.1,
                expand: true,
            }).map(x => x.toString());
            expect(x).toEqual(['0', '2', '4', '6']);
        });

        // large range

        it('should default to tick interval of 1 with a large range', () => {
            let x = ticks(-10, 10, { minDistance: 1 })
                .map(x => x.toString());
            let expectedStride = 1;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should fall back to tick interval of 2 with a large range', () => {
            let x = ticks(-10, 10, { minDistance: 1.1 })
                .map(x => x.toString());
            let expectedStride = 2;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should fall back to tick interval of 5 with a large range', () => {
            let x = ticks(-10, 10, { minDistance: 2.1 })
                .map(x => x.toString());
            let expectedStride = 5;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should fall back to zero tick interval with a large range', () => {
            let x = ticks(-10, 10, { minDistance: 5.1 })
                .map(x => x.toString());
            let expectedStride = 10;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });
    });
});
