import Decimal from 'decimal.js';

const k1 = new Decimal(1);
const k2 = new Decimal(1);

export const findFactors = (value: Decimal.Value): Decimal[] => {
    let xOrig = new Decimal(value);
    let x = xOrig;
    let isNegative = x.isNegative();
    if (isNegative) {
        x = x.neg();
    }
    if (x.lt(k1)) {
        return [];
    }
    if (x.eq(k1)) {
        return [xOrig];
    }
    let max = x.sqrt();

    let head: Decimal[] = [];
    let tail: Decimal[] = [];
    if (isNegative) {
        for (let i = k2; i.lt(max); i = i.add(k1)) {
            if (x.mod(i).isZero()) {
                tail.unshift(i.neg());
                head.push(x.div(i).neg());
            }
        }
    } else {
        for (let i = k2; i.lt(max); i = i.add(k1)) {
            if (x.mod(i).isZero()) {
                head.push(i);
                tail.unshift(x.div(i));
            }
        }
    }
    return head.concat(tail);
}

export const findCommonFactors = (v1: Decimal.Value, v2: Decimal.Value): Decimal[] => {
    // let xOrig1 = new Decimal(v1);
    // let xOrig2 = new Decimal(v2);
    // let x1 = xOrig1;
    // let x2 = xOrig2;
    // let isNegative1 = x1.isNegative();
    // let isNegative2 = x2.isNegative();
    // if (isNegative1 !== isNegative2) {
    //     return [];
    // }
    // if (isNegative1) {
    //     x1 = x1.neg();
    //     x2 = x2.neg();
    // }
    // if (x1.lt(k1) || x2.lt(k1)) {
    //     return [];
    // }
    // if (x1.eq(k1) || x2.eq(k1)) {
    //     return [isNegative1 ? k1.neg() : k1];
    // }
    // let max = Decimal.min(x1.sqrt(), x2.sqrt());

    // let head: Decimal[] = [];
    // let tail: Decimal[] = [];
    // if (isNegative1) {
    //     for (let i = k2; i.lt(max); i = i.add(k1)) {
    //         if (x1.mod(i).isZero() && x2.mod(i).isZero()) {
    //             tail.unshift(i.neg());
    //             head.push(x1.div(i).neg());
    //             head.push(x2.div(i).neg());
    //         }
    //     }
    //     head = head.sort((a, b) => b.eq(a) ? 0 : (b.gt(a) ? 1 : -1));
    // } else {
    //     for (let i = k2; i.lt(max); i = i.add(k1)) {
    //         if (x1.mod(i).isZero() && x2.mod(i).isZero()) {
    //             head.push(i);
    //             tail.unshift(x1.div(i));
    //             tail.unshift(x2.div(i));
    //         }
    //     }
    //     tail = tail.sort((a, b) => b.eq(a) ? 0 : (b.gt(a) ? 1 : -1));
    // }
    // return head.concat(tail);

    let x1 = new Decimal(v1);
    let x2 = new Decimal(v2);
    if (x1.isNegative() !== x2.isNegative()) {
        return [];
    }
    if (x1.eq(x2)) {
        return findFactors(x1);
    }

    let lower: Decimal;
    let higher: Decimal;
    if (x1.abs().lt(x2.abs())) {
        lower = x1;
        higher = x2;
    } else {
        lower = x2;
        higher = x1;
    }

    let lowerFactors = findFactors(lower);
    return lowerFactors.filter(x => higher.mod(x).isZero());
};
