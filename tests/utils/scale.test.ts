import Decimal from 'decimal.js';
import {
    linearTicks,
} from '../../src/utils/scale';

describe('scale', () => {

    describe('linearTicks', () => {

        // divide 1

        it('should divide 1 into intervals of 0.1 with min distance when not expanding', () => {
            let x = linearTicks(0, 1, { minDistance: 0.1 })
                .map(x => x.toString());
            let start = new Decimal(0);
            let end = new Decimal(1);
            let stride = new Decimal(0.1);
            let expectedTicks: string[] = [];
            for (let i = start; i.lte(end); i = i.add(stride)) {
                expectedTicks.push(i.toString());
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide 1 into intervals of 0.1 with max count when not expanding', () => {
            let x = linearTicks(0, 1, { maxCount: 10 })
                .map(x => x.toString());
            let start = new Decimal(0);
            let end = new Decimal(1);
            let stride = new Decimal(0.1);
            let expectedTicks: string[] = [];
            for (let i = start; i.lte(end); i = i.add(stride)) {
                expectedTicks.push(i.toString());
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should ignore infinite max count', () => {
            let x = linearTicks(0, 1, { minDistance: 0.5, maxCount: Infinity })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should not divide 1 into intervals of 0.2 with min distance when not expanding', () => {
            let x = linearTicks(0, 1, { minDistance: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should not divide 1 with large min distance', () => {
            let x = linearTicks(0, 1, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 5

        it('should divide 5 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(0, 5, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should not divide 5 into intervals of 2 with min distance when not expanding', () => {
            let x = linearTicks(0, 5, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should not divide 5 with large min distance', () => {
            let x = linearTicks(0, 5, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 3

        it('should divide 3 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(0, 3, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3']);
        });

        it('should not divide 3 into intervals of 2 with min distance when not expanding', () => {
            let x = linearTicks(0, 3, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '3']);
        });

        it('should not divide 3 with large min distance', () => {
            let x = linearTicks(0, 3, { minDistance: 3.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 4

        it('should divide 4 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(0, 4, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4']);
        });

        it('should divide 4 into intervals of 2 when 1 does not fit and not expanding', () => {
            let x = linearTicks(0, 4, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '2', '4']);
        });

        it('should not divide 4 with large min distance', () => {
            let x = linearTicks(0, 4, { minDistance: 4.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 0.5

        it('should divide 0.5 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(0.0, 0.5, { minDistance: 0.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
        });

        it('should not divide 0.5 into intervals of 0.2 with min distance when not expanding', () => {
            let x = linearTicks(0.0, 0.5, { minDistance: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5']);
        });

        it('should not divide 0.5 with large min distance', () => {
            let x = linearTicks(0.0, 0.5, { minDistance: 0.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 1.5

        it('should not divide 1.5 into intervals of 0.05 with min distance when not expanding', () => {
            let x = linearTicks(0.0, 1.5, { minDistance: 0.04, maxCount: 15 })
                .map(x => x.toString());
            let start = new Decimal(0);
            let end = new Decimal(1.5);
            let stride = new Decimal(0.1);
            let expectedTicks: string[] = [];
            for (let i = start; i.lte(end); i = i.add(stride)) {
                expectedTicks.push(i.toString());
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should not divide 1.5 into intervals of 0.2 with min distance when not expanding', () => {
            let x = linearTicks(0.0, 1.5, { minDistance: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1', '1.5']);
        });

        it('should not divide 1.5 with large min distance', () => {
            let x = linearTicks(0.0, 1.5, { minDistance: 1.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 10..15

        it('should divide 10..15 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(10, 15, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '11', '12', '13', '14', '15']);
        });

        it('should not divide 10..15 into intervals of 2 with min distance when not expanding', () => {
            let x = linearTicks(10, 15, { minDistance: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '15']);
        });

        it('should not divide 10..15 with large min distance', () => {
            let x = linearTicks(10, 15, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10']);
        });

        // divide -10..-5

        it('should divide -10..-5 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(-10, -5, { minDistance: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '-9', '-8', '-7', '-6', '-5']);
        });

        // divide -10..10

        it('should divide -10..10 into intervals of 1 with min distance when not expanding', () => {
            let x = linearTicks(-10, 10, { minDistance: 1 })
                .map(x => x.toString());
            let expectedStride = 1;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should not divide -10..10 into intervals of 2 with min distance when not expanding', () => {
            let x = linearTicks(-10, 10, { minDistance: 1.1 })
                .map(x => x.toString());
            let expectedStride = 5;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide -10..10 into intervals of 10 with min distance when not expanding', () => {
            let x = linearTicks(-10, 10, { minDistance: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '0', '10']);
        });

        it('should divide -10..10 into intervals of 20 with min distance when not expanding', () => {
            let x = linearTicks(-10, 10, { minDistance: 10.1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '10']);
        });

        it('should not divide -10..10 with large min distance', () => {
            let x = linearTicks(-10, 10, { minDistance: 20.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // expand

        it('should fall back to tick interval of 2 when expanding uneven interval', () => {
            let x = linearTicks(0.1, 4.9, {
                minDistance: 1.1,
                expand: true,
            }).map(x => x.toString());
            expect(x).toEqual(['0', '2', '4', '6']);
        });
    });
});
