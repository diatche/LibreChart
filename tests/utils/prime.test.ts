import Decimal from 'decimal.js';
import {
    findCommonFactors,
    findFactors,
} from '../../src/utils/prime';

describe('scale', () => {

    describe('findFactors', () => {

        it('should find all factors of 10', () => {
            let factors = findFactors(10).map(x => x.toNumber());
            expect(factors).toEqual([1, 2, 5, 10]);
        });

        it('should find all factors of 12', () => {
            let factors = findFactors(12).map(x => x.toNumber());
            expect(factors).toEqual([1, 2, 3, 4, 6, 12]);
        });

        it('should find all factors of 1', () => {
            let factors = findFactors(1).map(x => x.toNumber());
            expect(factors).toEqual([1]);
        });

        it('should find all factors of 0', () => {
            let factors = findFactors(0).map(x => x.toNumber());
            expect(factors).toEqual([]);
        });

        it('should find all factors of -10', () => {
            let factors = findFactors(-10).map(x => x.toNumber());
            expect(factors).toEqual([-10, -5, -2, -1]);
        });

        it('should ignore non integers', () => {
            let factors = findFactors(6.1).map(x => x.toNumber());
            expect(factors).toEqual([]);
        });
    });

    describe('findCommonFactors', () => {

        it('should find all factors of 8 and 12', () => {
            let factors = findCommonFactors(8, 12).map(x => x.toNumber());
            expect(factors).toEqual([1, 2, 4]);
        });

        it('should find all factors of -12 and -8', () => {
            let factors = findCommonFactors(-12, -8).map(x => x.toNumber());
            expect(factors).toEqual([-4, -2, -1]);
        });

        it('should not find factors between opposite signs', () => {
            let factors = findCommonFactors(8, -12).map(x => x.toNumber());
            expect(factors).toEqual([]);
        });
    });
});
