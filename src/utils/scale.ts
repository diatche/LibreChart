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

/**
 * Tick calculation options.
 * 
 * Must specify either a `minDistance`, or 
 * `maxCount`, or both.
 */
export interface TickOptions {
    /**
     * The smallest tick interval.
     */
    minDistance?: Decimal.Value;
    /**
     * Maximum number of intervals to divide
     * the interval into.
     **/
    maxCount?: Decimal.Value;
    /**
     * If `true`, expands the interval enough
     * to satisfy the constraints.
     * 
     * If `false` (default), divides the interval into
     * natural intervals, such that the constrainsts
     * are satisfied. If the interval is uneven at the
     * scale of the constraints, it is rounded appropriately,
     * but in this case, some ticks at the edges may be discarded.
     */
    expand?: boolean;
}

/**
 * Calculates optimal tick locations given an
 * interval and constraints (see {@link TickOptions}).
 *  
 * @param start The inclusive start of the interval. 
 * @param end The inclusive end of the interval.
 * @param options See {@link TickOptions}
 * @returns An array of tick locations.
 */
export const ticks = (
    start: Decimal.Value,
    end: Decimal.Value,
    options: TickOptions,
): Decimal[] => {
    let a = new Decimal(start);
    let b = new Decimal(end);
    if (b.lte(a) || a.isNaN() || !b.isFinite() || b.isNaN() || !b.isFinite()) {
        throw new Error('Interval must be finite and with a positive length');
    }
    let len = b.sub(a);

    let minDistance = new Decimal(options.minDistance || 0);
    if (minDistance.lt(0) || minDistance.isNaN() || !minDistance.isFinite()) {
        throw new Error('Minimum tick distance must be finite and with a positive length');
    }

    if (options.maxCount) {
        let maxCount = new Decimal(options.maxCount);
        if (maxCount.eq(0)) {
            return [];
        }
        if (maxCount.lt(0) || maxCount.isNaN()) {
            throw new Error('Max count must be greater than or equal to zero');
        }
        let maxCountDistance = len.div(maxCount.add(1));
        if (maxCountDistance.gt(minDistance)) {
            minDistance = maxCountDistance;
        }
    }

    if (minDistance.lte(0)) {
        throw new Error('Must specify either a minimum tick distance interval or a maximum interval count');
    }

    let exponent = k10.pow(Decimal.log10(minDistance).floor());
    let aScaled = a.div(exponent).floor();
    let bScaled = b.div(exponent).ceil();

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
        bestBase = {
            start: mStart.mul(exponent),
            end: mEnd.mul(exponent),
            interval,
            count: tickCount.toNumber(),
        };
        break;
    }

    if (!bestBase) {
        return [];
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
    if (!expand && ticks.length === 1 && len.gte(minDistance)) {
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
