import Decimal from "decimal.js";
import Scale, {
    ITickScaleConstraints,
    ITickScale,
    IScaleOptions,
} from "./Scale";
import {
    findCommonFactors,
    findFactors,
} from "../utils/factors";

const k0 = new Decimal(0);
const k1 = new Decimal(1);
const k10 = new Decimal(10);

const kFactors10 = [1, 2, 5, 10];

type LinearTickScaleType = ITickScale<Decimal>;

export default class LinearScale extends Scale<Decimal> {

    tickScale: ITickScale<Decimal>;

    constructor(options: IScaleOptions<Decimal> = {}) {
        super(options);

        this.tickScale = {
            origin: {
                value: k0,
                location: k0,
            },
            interval: {
                valueInterval: k1,
                locationInterval: k1,
            },
        }
    }

    emptyValue() { return k0 };
    emptyValueInterval() { return k0 };

    getTickScale(
        start: Decimal,
        end: Decimal,
        constraints?: ITickScaleConstraints<Decimal>
    ): LinearTickScaleType {
        if (end.lte(start)) {
            return this.emptyScale();
        }
        if (start.isNaN() || !end.isFinite() || end.isNaN() || !end.isFinite()) {
            throw new Error('Invalid interval');
        }
        let len = end.sub(start);
    
        // Find min interval
        let minInterval = k0;
    
        constraints = {
            ...this.constraints,
            ...constraints,
        };

        if (constraints.minInterval?.valueInterval) {
            let min = constraints.minInterval.valueInterval;
            if (min.lt(0) || min.isNaN() || !min.isFinite()) {
                throw new Error('Minimum interval must be finite and with a positive length');
            }
            if (min.gt(minInterval)) {
                minInterval = min;
            }
        }

        if (constraints.minInterval?.locationInterval) {
            let min = constraints.minInterval.locationInterval;
            if (min.lt(0) || min.isNaN() || !min.isFinite()) {
                throw new Error('Minimum interval must be finite and with a positive length');
            }
            if (min.gt(minInterval)) {
                minInterval = min;
            }
        }
    
        if (constraints.maxCount) {
            let maxCount = new Decimal(constraints.maxCount);
            if (maxCount.eq(0)) {
                return this.emptyScale();
            }
            if (maxCount.lt(0) || maxCount.isNaN()) {
                throw new Error('Max count must be greater than or equal to zero');
            }
            let min = len.div(maxCount);
            if (min.gt(minInterval)) {
                minInterval = min;
            }
        }
    
        if (minInterval.lte(0)) {
            throw new Error('Must specify either a minimum interval or a maximum interval count');
        }
    
        let radix = k10;
        let radixLog10 = k1;
        if (constraints.radix) {
            radix = new Decimal(constraints.radix);
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
        let startScaled = start.div(exponent).floor();
        let endScaled = end.div(exponent).ceil();
    
        let factors: number[];
        if (constraints.expand) {
            // Use radix factors
            factors = findFactors(radix.toNumber());
        } else {
            // Use common factors
            let scaledLen = endScaled.sub(startScaled);
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
                let fStart = startScaled.div(factor).floor().mul(factor);
                let fEnd = endScaled.div(factor).ceil().mul(factor);
                let fLength = fEnd.sub(fStart);
                let count = fLength.div(factor);
                let fInterval = fLength.div(count);
                let interval = fInterval.mul(exponent);
                if (interval.lt(minInterval)) {
                    continue;
                }

                let origin = fStart.mul(exponent);
                bestScale = {
                    origin: {
                        value: origin,
                        location: origin,
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
                startScaled = startScaled.div(radix);
                endScaled = endScaled.div(radix);
            }
        } while (!bestScale);
    
        return bestScale;
    }

    addIntervalToValue(value: Decimal, interval: Decimal): Decimal {
        return new Decimal(value).add(interval);
    }

    floorValue(value: Decimal): Decimal {
        return new Decimal(value)
            .div(this.tickScale.interval.valueInterval)
            .floor()
            .mul(this.tickScale.interval.valueInterval);
    }

    locationOfValue(value: Decimal): Decimal {
        try {
            new Decimal(value);
        } catch (error) {
            console.debug(`locationOfValue(${value.constructor.name})`);
        }
        return new Decimal(value);
    }

    valueAtLocation(location: Decimal): Decimal {
        return new Decimal(location);
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

    compareValues(a: Decimal, b: Decimal): number {
        return a.sub(b).toNumber();
    }

    isIntervalEqual(i1: Decimal, i2: Decimal): boolean {
        return i1.eq(i2);
    }
}
