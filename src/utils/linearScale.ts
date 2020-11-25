import Decimal from "decimal.js";
import Scale, {
    ITick,
    ITickConstraints,
} from "./Scale";
import {
    findCommonFactors,
    findFactors,
} from "./factors";

const k0 = new Decimal(0);
const k1 = new Decimal(1);
const k10 = new Decimal(10);

const kFactors10 = [1, 2, 5, 10];

type LinearTickType = ITick<Decimal, Decimal>;

export default class LinearScale extends Scale<Decimal> {

    get zeroInterval(): Decimal {
        return k0;
    }

    /**
     * Calculates optimal tick locations in linear space given an
     * interval and constraints (see {@link ITickConstraints}).
     *  
     * @param start The inclusive start of the interval. 
     * @param end The inclusive end of the interval.
     * @param constraints See {@link ITickConstraints}
     * @returns An array of tick locations.
     */
    getTicks(start: Decimal, end: Decimal, constraints: ITickConstraints): LinearTickType[] {
        if (end.lt(start)) {
            return [];
        }
        if (start.isNaN() || !end.isFinite() || end.isNaN() || !end.isFinite()) {
            throw new Error('Invalid interval');
        }
        let len = end.sub(start);
    
        // Find min interval
        let minInterval = k0;
    
        constraints = {
            ...this.defaults,
            ...constraints,
        };
        if (constraints.minInterval) {
            let min = constraints.minInterval;
            if (min.lt(0) || min.isNaN() || !min.isFinite()) {
                throw new Error('Minimum interval must be finite and with a positive length');
            }
            minInterval = min;
        }
    
        if (constraints.maxCount) {
            let maxCount = constraints.maxCount;
            if (maxCount.eq(0)) {
                return [];
            }
            if (maxCount.lt(0) || maxCount.isNaN()) {
                throw new Error('Max count must be greater than or equal to zero');
            }
            let maxCountInterval = len.div(maxCount);
            if (maxCountInterval.gt(minInterval)) {
                minInterval = maxCountInterval;
            }
        }
    
        if (minInterval.lte(0)) {
            throw new Error('Must specify either a minimum interval or a maximum interval count');
        }
    
        let radix = k10;
        let radixLog10 = k1;
        if (constraints.radix) {
            radix = constraints.radix;
            if (!radix.eq(k10)) {
                radixLog10 = Decimal.log10(radix);
            }
            if (!radix.isInt() || radix.lt(2) || radix.isNaN() || !radix.isFinite()) {
                throw new Error('Radix must be an integer greater than 1');
            }
        }
    
        let exponent = radix.pow(
            Decimal.log10(minInterval)
                .div(radixLog10)
                .floor()
        );
        let aScaled = start.div(exponent).floor();
        let bScaled = end.div(exponent).ceil();
    
        let factors: number[];
        if (constraints.expand) {
            // Use radix factors
            factors = findFactors(radix.toNumber());
        } else {
            // Use common factors
            let scaledLen = bScaled.sub(aScaled);
            factors = findCommonFactors(radix.toNumber(), scaledLen.toNumber());
        }
        if (factors.length === 0) {
            // Fallback to default
            factors = kFactors10;
        }
        if (constraints.excludeFactors?.length !== 0) {
            let excludeFactors = new Set(constraints.excludeFactors);
            factors = factors.filter(x => !excludeFactors.has(x));
        }
    
        type Base = {
            start: Decimal;
            end: Decimal;
            interval: Decimal;
            count: number;
        };
    
        let bestBase: Base | undefined;
    
        do {
            for (let i = 0; i < factors.length; i++) {
                const factor = factors[i];
                let mStart = aScaled.div(factor).floor().mul(factor);
                let mEnd = bScaled.div(factor).ceil().mul(factor);
                let mLength = mEnd.sub(mStart);
                let count = mLength.div(factor);
                let mInterval = mLength.div(count);
                let interval = mInterval.mul(exponent);
                if (interval.lt(minInterval)) {
                    continue;
                }
        
                bestBase = {
                    start: mStart.mul(exponent),
                    end: mEnd.mul(exponent),
                    interval,
                    count: count.toNumber(),
                };
                break;
            }
            if (!bestBase) {
                exponent = exponent.mul(radix);
                aScaled = aScaled.div(radix);
                bScaled = bScaled.div(radix);
            }
        } while (!bestBase);
    
        let { expand = false } = constraints || {};
        if (expand) {
            start = bestBase.start;
            end = bestBase.end;
        }
    
        let ticks: LinearTickType[] = [];
        for (let i = 0; i <= bestBase.count; i++) {
            let location = bestBase.start.add(bestBase.interval.mul(i));
            if (location.gte(start) && location.lte(end)) {
                ticks.push({
                    location,
                    interval: bestBase.interval,
                    value: location,
                });
            }
        }
        return ticks;
    }

    getNextTick(tick: LinearTickType): LinearTickType {
        let value = tick.value.add(tick.interval);
        return {
            value,
            location: value,
            interval: tick.interval,
        };
    }

    encodeValue(value: Decimal): Decimal {
        return value;
    }

    decodeValue(value: Decimal): Decimal {
        return value;
    }

    isValue(value: any): value is Decimal {
        return Decimal.isDecimal(value);
    }

    isInterval(interval: any): interval is Decimal {
        return Decimal.isDecimal(interval);
    }

    isValueEqual(v1: Decimal, v2: Decimal): boolean {
        return v1.eq(v2);
    }

    isIntervalEqual(i1: Decimal, i2: Decimal): boolean {
        return i1.eq(i2);
    }
}
