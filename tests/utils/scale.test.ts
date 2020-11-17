import Decimal from 'decimal.js';
import {
    ticks,
} from '../../src/utils/scale';

describe('scale', () => {

    describe('ticks', () => {

        // divide 1

        it('should divide 1 into intervals of 0.1 when not expanding', () => {
            let x = ticks(0, 1, { minDistance: 0.1 })
                .map(x => x.toString());
            let expectedStride = new Decimal(0.1);
            let expectedTicks: string[] = [];
            for (let i = new Decimal(0); i.lte(1); i = i.add(expectedStride)) {
                expectedTicks.push(i.toString());
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should not divide 1 into intervals of 0.2 when not expanding', () => {
            let x = ticks(0, 1, { minDistance: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should not divide 1 with large min distance', () => {
            let x = ticks(0, 1, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 5

        it('should divide 5 into intervals of 1 when not expanding', () => {
            let x = ticks(0, 5, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should not divide 5 into intervals of 2 when not expanding', () => {
            let x = ticks(0, 5, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should not divide 5 with large min distance', () => {
            let x = ticks(0, 5, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 3

        it('should divide 3 into intervals of 1 when not expanding', () => {
            let x = ticks(0, 3, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3']);
        });

        it('should not divide 3 into intervals of 2 when not expanding', () => {
            let x = ticks(0, 3, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '3']);
        });

        it('should not divide 3 with large min distance', () => {
            let x = ticks(0, 3, { minDistance: 3.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 4

        it('should divide 4 into intervals of 1 when not expanding', () => {
            let x = ticks(0, 4, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4']);
        });

        it('should divide 4 into intervals of 2 when 1 does not fit and not expanding', () => {
            let x = ticks(0, 4, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '2', '4']);
        });

        it('should not divide 4 with large min distance', () => {
            let x = ticks(0, 4, { minDistance: 4.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 0.5

        it('should divide 0.5 into intervals of 1 when not expanding', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
        });

        it('should not divide 0.5 into intervals of 0.2 when not expanding', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5']);
        });

        it('should not divide 0.5 with large min distance', () => {
            let x = ticks(0.0, 0.5, { minDistance: 0.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 10..15

        it('should divide 10..15 into intervals of 1 when not expanding', () => {
            let x = ticks(10, 15, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '11', '12', '13', '14', '15']);
        });

        it('should not divide 10..15 into intervals of 2 when not expanding', () => {
            let x = ticks(10, 15, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '15']);
        });

        it('should not divide 10..15 with large min distance', () => {
            let x = ticks(10, 15, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10']);
        });

        // divide -10..-5

        it('should divide -10..-5 into intervals of 1 when not expanding', () => {
            let x = ticks(-10, -5, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '-9', '-8', '-7', '-6', '-5']);
        });

        // divide -10..10

        it('should divide -10..10 into intervals of 1 when not expanding', () => {
            let x = ticks(-10, 10, { minDistance: 1 })
                .map(x => x.toString());
            let expectedStride = 1;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should not divide -10..10 into intervals of 2 when not expanding', () => {
            let x = ticks(-10, 10, { minDistance: 1.1 })
                .map(x => x.toString());
            let expectedStride = 5;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide -10..10 into intervals of 10 when not expanding', () => {
            let x = ticks(-10, 10, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '0', '10']);
        });

        it('should divide -10..10 into intervals of 20 when not expanding', () => {
            let x = ticks(-10, 10, { minDistance: 10.1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '10']);
        });

        it('should not divide -10..10 with large min distance', () => {
            let x = ticks(-10, 10, { minDistance: 20.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // expand

        it('should fall back to tick interval of 2 when expanding uneven interval', () => {
            let x = ticks(0.1, 4.9, {
                minDistance: 1.1,
                expand: true,
            }).map(x => x.toString());
            expect(x).toEqual(['0', '2', '4', '6']);
        });
    });
});
