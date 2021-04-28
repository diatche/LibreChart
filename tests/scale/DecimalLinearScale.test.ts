import Decimal from 'decimal.js';
import DecimalLinearScale from '../../src/scale/DecimalLinearScale';
import {
    $,
    DecimalLinearTickInput,
    getDecimalLinearTicks,
    getExpectedDecimalLinearTicks,
} from './decimalLinearScaleUtil';

const k1 = new Decimal(1);

describe('DecimalLinearScale', () => {
    describe('updateTickScale', () => {
        // radix 24

        it('should should update scale correctly with interval of 12 with radix 24', () => {
            let scale = new DecimalLinearScale();

            scale.updateTickScale($(-55.317), $(79.3), {
                minInterval: {
                    value: $(9.6),
                },
                expand: true,
                radix: 24,
                excludeFactors: [2, 4, 8],
            });

            expect(scale.tickScale.origin.value.toNumber()).toEqual(-60);
            expect(scale.tickScale.origin.location).toBe(-60);

            expect(scale.tickScale.interval.value.toNumber()).toBe(12);
            expect(scale.tickScale.interval.location).toBe(12);
        });
    });

    describe('getTicks', () => {
        // divide 1

        it('should divide 1 into intervals of 0.1 with min distance when not expanding', () => {
            let input: DecimalLinearTickInput = {
                start: 0,
                end: 1,
                stride: 0.1,
            };
            expect(getDecimalLinearTicks(input)).toEqual(
                getExpectedDecimalLinearTicks(input)
            );
        });

        it('should divide 1 into intervals of 0.1 with max count when not expanding', () => {
            let input: DecimalLinearTickInput = {
                start: 0,
                end: 1,
                stride: 0.1,
                constraints: { maxCount: 10 },
            };
            expect(getDecimalLinearTicks(input)).toEqual(
                getExpectedDecimalLinearTicks(input)
            );
        });

        it('should ignore infinite max count', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(1), {
                    minInterval: { value: $(0.5) },
                    maxCount: Infinity,
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should divide 1 into intervals of 0.2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(1), {
                    minInterval: { value: $(0.11) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.2', '0.4', '0.6', '0.8', '1']);
        });

        it('should divide 1 into intervals of 0.5 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(1), {
                    minInterval: { value: $(0.21) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });

        it('should not divide 1 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(1), {
                    minInterval: { value: $(1.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 5

        it('should divide 5 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(5), {
                    minInterval: { value: k1 },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5']);
        });

        it('should not divide 5 into intervals of 2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(5), {
                    minInterval: { value: $(1.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '5']);
        });

        it('should not divide 5 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(5), {
                    minInterval: { value: $(5.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 3

        it('should divide 3 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(3), {
                    minInterval: { value: $(1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '1', '2', '3']);
        });

        it('should not divide 3 into intervals of 2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(3), {
                    minInterval: { value: $(1.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        it('should not divide 3 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(3), {
                    minInterval: { value: $(3.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 4

        it('should divide 4 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(4), {
                    minInterval: { value: $(1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4']);
        });

        it('should divide 4 into intervals of 2 when 1 does not fit and not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(4), {
                    minInterval: { value: $(1.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '2', '4']);
        });

        it('should not divide 4 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(4), {
                    minInterval: { value: $(4.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 7

        it('should divide 7 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(7), {
                    minInterval: { value: $(1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '1', '2', '3', '4', '5', '6', '7']);
        });

        it('should not divide 7 into intervals of 2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(7), {
                    minInterval: { value: $(1.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        it('should not divide 7 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(7), {
                    minInterval: { value: $(7.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 0.5

        it('should divide 0.5 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0.0), $(0.5), {
                    minInterval: { value: $(0.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.1', '0.2', '0.3', '0.4', '0.5']);
        });

        it('should not divide 0.5 into intervals of 0.2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0.0), $(0.5), {
                    minInterval: { value: $(0.11) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.5']);
        });

        it('should not divide 0.5 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0.0), $(0.5), {
                    minInterval: { value: $(0.51) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 1.5

        it('should not divide 1.5 into intervals of 0.05 with min distance when not expanding', () => {
            let input: DecimalLinearTickInput = {
                start: 0,
                end: 1.5,
                stride: 0.1,
                constraints: {
                    minInterval: { value: $(0.04) },
                    maxCount: 15,
                },
            };
            expect(getDecimalLinearTicks(input)).toEqual(
                getExpectedDecimalLinearTicks(input)
            );
        });

        it('should not divide 1.5 into intervals of 0.2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0.0), $(1.5), {
                    minInterval: { value: $(0.11) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.5', '1', '1.5']);
        });

        it('should not divide 1.5 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0.0), $(1.5), {
                    minInterval: { value: $(1.51) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // divide 10..15

        it('should divide 10..15 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(10), $(15), {
                    minInterval: { value: $(1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['10', '11', '12', '13', '14', '15']);
        });

        it('should not divide 10..15 into intervals of 2 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(10), $(15), {
                    minInterval: { value: $(1.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['10', '15']);
        });

        it('should not divide 10..15 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(10), $(15), {
                    minInterval: { value: $(5.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['10']);
        });

        // divide -10..-5

        it('should divide -10..-5 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(-10), $(-5), {
                    minInterval: { value: $(1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['-10', '-9', '-8', '-7', '-6', '-5']);
        });

        // divide -10..10

        it('should divide -10..10 into intervals of 1 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(-10), $(10), {
                    minInterval: { value: $(1) },
                })
                .map(x => x.value.toString());
            let expectedStride = 1;
            let expectedTicks: string[] = [];
            for (let i = -10; i <= 10; i += expectedStride) {
                expectedTicks.push(String(i));
            }
            expect(x).toEqual(expectedTicks);
        });

        it('should divide -10..10 into intervals of 2 with min distance when not expanding', () => {
            let input: DecimalLinearTickInput = {
                start: -10,
                end: 10,
                stride: 2,
                constraints: { minInterval: { value: $(1.1) } },
            };
            expect(getDecimalLinearTicks(input)).toEqual(
                getExpectedDecimalLinearTicks(input)
            );
        });

        it('should divide -10..10 into intervals of 5 with min distance when not expanding', () => {
            let input: DecimalLinearTickInput = {
                start: -10,
                end: 10,
                stride: 5,
                constraints: { minInterval: { value: $(2.1) } },
            };
            expect(getDecimalLinearTicks(input)).toEqual(
                getExpectedDecimalLinearTicks(input)
            );
        });

        it('should divide -10..10 into intervals of 10 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(-10), $(10), {
                    minInterval: { value: $(5.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['-10', '0', '10']);
        });

        it('should divide -10..10 into intervals of 20 with min distance when not expanding', () => {
            let x = new DecimalLinearScale()
                .getTicks($(-10), $(10), {
                    minInterval: { value: $(10.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        it('should not divide -10..10 with large min distance', () => {
            let x = new DecimalLinearScale()
                .getTicks($(-10), $(10), {
                    minInterval: { value: $(20.1) },
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0']);
        });

        // empty interval

        it('should return empty array for point interval', () => {
            let x = new DecimalLinearScale().getTicks($(0), $(0), {
                minInterval: { value: $(0.1) },
            });
            expect(x).toEqual([]);
        });

        // empty interval

        it('should return empty array for reverse interval', () => {
            let x = new DecimalLinearScale().getTicks($(1), $(0), {
                minInterval: { value: $(0.1) },
            });
            expect(x).toEqual([]);
        });

        // expand

        it('should fall back to tick interval of 2 when expanding uneven interval', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0.1), $(4.9), {
                    minInterval: { value: $(1.1) },
                    expand: true,
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '2', '4', '6']);
        });

        // radix 24

        it('should divide 24 into intervals of 12 with min distance when not expanding with radix of 24', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(24), {
                    minInterval: { value: $(10) },
                    radix: 24,
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '12', '24']);
        });

        // radix 60

        it('should divide 60 into intervals of 30 with min distance when not expanding with radix of 60', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(60), {
                    minInterval: { value: $(30) },
                    radix: 60,
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '30', '60']);
        });

        // excludeFactors

        it('should not divide 1 into intervals of 0.2 when a factor of 2 is excluded', () => {
            let x = new DecimalLinearScale()
                .getTicks($(0), $(1), {
                    minInterval: { value: $(0.11) },
                    excludeFactors: [2],
                })
                .map(x => x.value.toString());
            expect(x).toEqual(['0', '0.5', '1']);
        });
    });
});
