import Decimal from "decimal.js";
import Scale, {
    ITickInterval,
    ITickLocation,
    ITickConstraints,
    ITickScale,
} from "./Scale";
import {
    findCommonFactors,
    findFactors,
} from "./factors";

const k0 = new Decimal(0);
const k1 = new Decimal(1);
const k10 = new Decimal(10);

const kFactors10 = [1, 2, 5, 10];

type LinearTickScaleType = ITickScale<Decimal, Decimal>;

export default class LinearScale extends Scale<Decimal> {

    originValue() { return k0 };
    zeroValueInterval() { return k0 };

    getTickScale(start: Decimal, end: Decimal, constraints: ITickConstraints): LinearTickScaleType {
        if (end.lt(start)) {
            return this.emptyScale();
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
                return this.emptyScale();
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
    
        let bestScale: LinearTickScaleType | undefined;
    
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
        
                let start = mStart.mul(exponent);
                bestScale = {
                    origin: {
                        location: start,
                        value: start,
                    },
                    interval: {
                        locationInterval: interval,
                        valueInterval: interval,
                    },
                };
                break;
            }
            if (!bestScale) {
                exponent = exponent.mul(radix);
                aScaled = aScaled.div(radix);
                bScaled = bScaled.div(radix);
            }
        } while (!bestScale);
    
        return bestScale;
    }

    addIntervalToValue(value: Decimal, scale: LinearTickScaleType): Decimal {
        return value.add(scale.interval.valueInterval);
    }

    floorValue(value: Decimal, scale: LinearTickScaleType): Decimal {
        return value.sub(scale.origin.location)
            .div(scale.interval.locationInterval)
            .floor()
            .mul(scale.interval.locationInterval)
            .add(scale.origin.location);
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
