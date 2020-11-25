import LinearScale from '../../src/utils/LinearScale';
import {
    $,
    LinearTickInput,
    getLinearTicks,
    getExpectedLinearTicks,
} from './linearScaleUtil';

const linearScale = new LinearScale();

describe('LinearScale', () => {

    describe('getTicks', () => {

        // divide 1

        it('should divide 1 into intervals of 0.1 with min distance when not expanding', () => {
            let input: LinearTickInput = { start: 0, end: 1, stride: 0.1 };
            expect(getLinearTicks(input)).toEqual(getExpectedLinearTicks(input));
        });

        it('should divide 1 into intervals of 0.1 with max count when not expanding', () => {
            let input: LinearTickInput = { start: 0, end: 1, stride: 0.1, constraints: { maxCount: 10 } };
            expect(getLinearTicks(input)).toEqual(getExpectedLinearTicks(input));
        });

        it('should ignore infinite max count', () => {
            let x = linearScale.getTickLocations($(0), $(1), { minInterval: 0.5, maxCount: Infinity })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should divide 1 into intervals of 0.2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(1), { minInterval: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.2', '0.4', '0.6', '0.8', '1']);
        });

        it('should divide 1 into intervals of 0.5 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(1), { minInterval: 0.21 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should not divide 1 with large min distance', () => {
            let x = linearScale.getTickLocations($(0), $(1), { minInterval: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 5

        it('should divide 5 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(5), { minInterval: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should not divide 5 into intervals of 2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(5), { minInterval: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should not divide 5 with large min distance', () => {
            let x = linearScale.getTickLocations($(0), $(5), { minInterval: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 3

        it('should divide 3 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(3), { minInterval: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3']);
        });

        it('should not divide 3 into intervals of 2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(3), { minInterval: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        it('should not divide 3 with large min distance', () => {
            let x = linearScale.getTickLocations($(0), $(3), { minInterval: 3.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 4

        it('should divide 4 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(4), { minInterval: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4']);
        });

        it('should divide 4 into intervals of 2 when 1 does not fit and not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(4), { minInterval: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '2', '4']);
        });

        it('should not divide 4 with large min distance', () => {
            let x = linearScale.getTickLocations($(0), $(4), { minInterval: 4.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 7

        it('should divide 7 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(7), { minInterval: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
        });

        it('should not divide 7 into intervals of 2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0), $(7), { minInterval: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        it('should not divide 7 with large min distance', () => {
            let x = linearScale.getTickLocations($(0), $(7), { minInterval: 7.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 0.5

        it('should divide 0.5 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0.0), $(0.5), { minInterval: 0.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
        });

        it('should not divide 0.5 into intervals of 0.2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0.0), $(0.5), { minInterval: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5']);
        });

        it('should not divide 0.5 with large min distance', () => {
            let x = linearScale.getTickLocations($(0.0), $(0.5), { minInterval: 0.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 1.5

        it('should not divide 1.5 into intervals of 0.05 with min distance when not expanding', () => {
            let input: LinearTickInput = {
                start: 0, end: 1.5, stride: 0.1,
                constraints: { minInterval: 0.04, maxCount: 15 }
            };
            expect(getLinearTicks(input)).toEqual(getExpectedLinearTicks(input));
        });

        it('should not divide 1.5 into intervals of 0.2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(0.0), $(1.5), { minInterval: 0.11 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1', '1.5']);
        });

        it('should not divide 1.5 with large min distance', () => {
            let x = linearScale.getTickLocations($(0.0), $(1.5), { minInterval: 1.51 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // divide 10..15

        it('should divide 10..15 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(10), $(15), { minInterval: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '11', '12', '13', '14', '15']);
        });

        it('should not divide 10..15 into intervals of 2 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(10), $(15), { minInterval: 1.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10', '15']);
        });

        it('should not divide 10..15 with large min distance', () => {
            let x = linearScale.getTickLocations($(10), $(15), { minInterval: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['10']);
        });

        // divide -10..-5

        it('should divide -10..-5 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(-10), $(-5), { minInterval: 1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '-9', '-8', '-7', '-6', '-5']);
        });

        // divide -10..10

        it('should divide -10..10 into intervals of 1 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(-10), $(10), { minInterval: 1 })
                .map(x => x.toString());
            let expectedStride = 1;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide -10..10 into intervals of 2 with min distance when not expanding', () => {
            let input: LinearTickInput = {
                start: -10, end: 10, stride: 2,
                constraints: { minInterval: 1.1 }
            };
            expect(getLinearTicks(input)).toEqual(getExpectedLinearTicks(input));
        });

        it('should divide -10..10 into intervals of 5 with min distance when not expanding', () => {
            let input: LinearTickInput = {
                start: -10, end: 10, stride: 5,
                constraints: { minInterval: 2.1 }
            };
            expect(getLinearTicks(input)).toEqual(getExpectedLinearTicks(input));
        });

        it('should divide -10..10 into intervals of 10 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(-10), $(10), { minInterval: 5.1 })
                .map(x => x.toString());
            expect(x).toEqual(['-10', '0', '10']);
        });

        it('should divide -10..10 into intervals of 20 with min distance when not expanding', () => {
            let x = linearScale.getTickLocations($(-10), $(10), { minInterval: 10.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        it('should not divide -10..10 with large min distance', () => {
            let x = linearScale.getTickLocations($(-10), $(10), { minInterval: 20.1 })
                .map(x => x.toString());
            expect(x).toEqual(['0']);
        });

        // empty interval

        it('should return empty array for point interval', () => {
            let x = linearScale.getTickLocations($(0), $(0), { minInterval: 0.1 });
            expect(x).toEqual([]);
        });

        // empty interval

        it('should return empty array for reverse interval', () => {
            let x = linearScale.getTickLocations($(1), $(0), { minInterval: 0.1 });
            expect(x).toEqual([]);
        });

        // expand

        it('should fall back to tick interval of 2 when expanding uneven interval', () => {
            let x = linearScale.getTickLocations($(0.1), $(4.9), {
                minInterval: 1.1,
                expand: true,
            }).map(x => x.toString());
            expect(x).toEqual(['0', '2', '4', '6']);
        });

        // radix 24

        it('should divide 24 into intervals of 12 with min distance when not expanding with radix of 24', () => {
            let x = linearScale.getTickLocations($(0), $(24), { minInterval: 10, radix: 24 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '12', '24']);
        });

        // radix 60

        it('should divide 60 into intervals of 30 with min distance when not expanding with radix of 60', () => {
            let x = linearScale.getTickLocations($(0), $(60), { minInterval: 30, radix: 60 })
                .map(x => x.toString());
            expect(x).toEqual(['0', '30', '60']);
        });

        // excludeFactors

        it('should not divide 1 into intervals of 0.2 when a factor of 2 is excluded', () => {
            let x = linearScale.getTickLocations($(0), $(1), { minInterval: 0.11, excludeFactors: [2] })
                .map(x => x.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });
    });
});
