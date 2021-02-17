const kFactors10 = [1, 2, 5, 10];

const _findFactorsPos = (x: number): number[] => {
    let max = Math.sqrt(x);

    let head: number[] = [];
    let tail: number[] = [];
    for (let i = 1; i < max; i++) {
        if (x % i === 0) {
            head.push(i);
            tail.unshift(x / i);
        }
    }
    if (max % 1 === 0) {
        tail.unshift(x / max);
    }
    return head.concat(tail);
};

export const findFactors = (value: number): number[] => {
    let x = value;
    if (x === 0 || x % 1 !== 0) {
        return [];
    }
    let isNegative = x < 0;
    if (isNegative) {
        x = -x;
    }

    let factors: number[];
    if (x === 1) {
        factors = [x];
    } else if (x === 10) {
        // Optimisation for common radix
        let factors = [...kFactors10];
        if (isNegative) {
            factors = factors.map(x => -x);
            factors = factors.reverse();
        }
        return factors;
    } else {
        factors = _findFactorsPos(x);
    }
    if (isNegative) {
        factors = factors.map(x => -x);
        factors = factors.reverse();
    }
    return factors;
};

export const findCommonFactors = (x1: number, x2: number): number[] => {
    if (x1 === 0 || x2 === 0 || x1 < 0 !== x2 < 0) {
        return [];
    }
    if (x1 === x2) {
        return findFactors(x1);
    }

    let lower: number;
    let higher: number;
    if (Math.abs(x1) < Math.abs(x2)) {
        lower = x1;
        higher = x2;
    } else {
        lower = x2;
        higher = x1;
    }

    let lowerFactors = findFactors(lower);
    return lowerFactors.filter(x => higher % x === 0);
};
