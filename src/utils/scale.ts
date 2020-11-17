import Decimal from 'decimal.js';
import { IDecimalPoint } from '../types';

const k0 = new Decimal(0);
const k1 = new Decimal(1);
const k2 = new Decimal(2);
const k5 = new Decimal(5);
const k10 = new Decimal(10);

const kMantissas = [k1, k2, k5, k10];
const kMantissas1 = [k1, k10];
const kMantissas2 = [k1, k2, k10];
const kMantissas5 = [k1, k5, k10];

export const ticks = (
    start: Decimal.Value,
    end: Decimal.Value,
    options: {
        minDistance: Decimal.Value;
        expand?: boolean;
    }
): Decimal[] => {
    let a = new Decimal(start);
    let b = new Decimal(end);
    if (b.lte(a) || a.isNaN() || !b.isFinite() || b.isNaN() || !b.isFinite()) {
        throw new Error('Interval must be finite and with a positive length');
    }

    let minDistance = new Decimal(options?.minDistance || 0);
    if (minDistance.lt(0) || minDistance.isNaN() || !minDistance.isFinite()) {
        throw new Error('Minimum tick distance must be finite and with a positive length');
    }

    let exponent = k10.pow(Decimal.log10(minDistance).floor());
    let aScaled = a.div(exponent);
    let bScaled = b.div(exponent);

    let mantissas = kMantissas;
    if (!options.expand) {
        // Restrict mantissas
        let scaledLen = bScaled.sub(aScaled);
        if (scaledLen.mod(k5).eq(k0)) {
            // This is a 5 interval, which
            // should only divide by 5.
            mantissas = kMantissas5;
        } else if (scaledLen.mod(k2).eq(k0)) {
            // This is an even interval, which
            // should only divide by 2.
            mantissas = kMantissas2;
        } else {
            // This is an odd interval, which
            // should not divide.
            mantissas = kMantissas1;
        }
    }

    type Base = {
        start: Decimal;
        end: Decimal;
        interval: Decimal;
        count: number;
    }

    let bestRank = 0;
    let bestBase: Base | undefined;

    for (let i = 0; i < mantissas.length; i++) {
        const mantissa = mantissas[i];
        // const baseLogCount = kBaseLogCounts[i];
        let mStart = aScaled.div(mantissa).floor().mul(mantissa);
        let mEnd = bScaled.div(mantissa).ceil().mul(mantissa);
        let mLength = mEnd.sub(mStart);
        let tickCount = mLength.div(mantissa);
        let mInterval = mLength.div(tickCount);
        let interval = mInterval.mul(exponent);
        if (interval.lt(minDistance) && !mantissa.eq(k10)) {
            continue;
        }
        let rank = mInterval.toString().length;
        if (bestRank === 0 || rank < bestRank) {
            bestRank = rank;
            bestBase = {
                start: mStart.mul(exponent),
                end: mEnd.mul(exponent),
                interval,
                count: tickCount.toNumber(),
            };
        }
    }

    if (!bestBase) {
        throw new Error('Failed to find tick interval');
    }

    let { expand = false } = options || {};
    if (expand) {
        a = bestBase.start;
        b = bestBase.end;
    }

    let ticks: Decimal[] = [];
    for (let i = 0; i <= bestBase.count; i++) {
        let tick = bestBase.start.add(bestBase.interval.mul(i));
        if (tick.gte(a) && tick.lte(b)) {
            ticks.push(tick);
        }
    }
    if (!expand && ticks.length === 1 && b.sub(a).gte(minDistance)) {
        // Fixed interval is greater than the min interval,
        // but is smaller than the optimal interval.
        if (a.eq(bestBase.start)) {
            // Use the end of the interval as the tick.
            ticks.push(b);
        } else {
            // Use the original interval.
            ticks = [a, b];
        }
    }
    return ticks;
};

export const zeroDecimalPoint = (): IDecimalPoint => ({
    x: new Decimal(0),
    y: new Decimal(0),
});
