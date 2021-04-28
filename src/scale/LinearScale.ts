import Scale, {
    ITickScaleConstraints,
    ITickScale,
    IScaleOptions,
} from './Scale';
import { findCommonFactors, findFactors } from '../utils/factors';

const kFactors10 = [1, 2, 5, 10];

type LinearTickScaleType = ITickScale<number>;

export default class LinearScale extends Scale<number> {
    tickScale: ITickScale<number>;

    constructor(options: IScaleOptions<number> = {}) {
        super(options);

        this.tickScale = {
            origin: {
                value: 0,
                location: 0,
            },
            interval: {
                value: 1,
                location: 1,
            },
        };
    }

    emptyValue() {
        return 0;
    }
    emptyValueInterval() {
        return 0;
    }

    getTickScale(
        start: number,
        end: number,
        constraints?: ITickScaleConstraints<number>
    ): LinearTickScaleType {
        if (end <= start) {
            return this.emptyScale();
        }
        if (isNaN(start) || !isFinite(end) || isNaN(end) || !isFinite(end)) {
            throw new Error('Invalid interval');
        }
        let len = end - start;

        // Find min interval
        let minInterval = 0;

        constraints = {
            ...this.constraints,
            ...constraints,
        };

        if (constraints.minInterval?.value) {
            let min = constraints.minInterval.value;
            if (min < 0 || isNaN(min) || !isFinite(min)) {
                throw new Error(
                    'Minimum interval must be finite and with a positive length'
                );
            }
            if (min > minInterval) {
                minInterval = min;
            }
        }

        if (constraints.minInterval?.location) {
            let min = constraints.minInterval.location;
            if (min < 0 || isNaN(min) || !isFinite(min)) {
                throw new Error(
                    'Minimum interval must be finite and with a positive length'
                );
            }
            if (min > minInterval) {
                minInterval = min;
            }
        }

        if (constraints.maxCount) {
            let maxCount = constraints.maxCount;
            if (maxCount === 0) {
                return this.emptyScale();
            }
            if (maxCount < 0 || isNaN(maxCount)) {
                throw new Error(
                    'Max count must be greater than or equal to zero'
                );
            }
            let min = len / maxCount;
            if (min > minInterval) {
                minInterval = min;
            }
        }

        if (minInterval <= 0) {
            throw new Error(
                'Must specify either a minimum interval or a maximum interval count'
            );
        }

        let radix = 10;
        let radixLog10 = 1;
        if (constraints.radix) {
            radix = constraints.radix;
            if (radix !== 10) {
                radixLog10 = Math.log10(radix);
            }
            if (
                radix % 1 !== 0 ||
                radix < 2 ||
                isNaN(radix) ||
                !isFinite(radix)
            ) {
                throw new Error('Radix must be an integer greater than 1');
            }
        }

        let exponent = Math.pow(
            radix,
            Math.floor(Math.log10(minInterval) / radixLog10)
        );
        let startScaled = Math.floor(start / exponent);
        let endScaled = Math.ceil(end / exponent);

        let factors: number[];
        if (constraints.expand) {
            // Use radix factors
            factors = findFactors(radix);
        } else {
            // Use common factors
            let scaledLen = endScaled - startScaled;
            factors = findCommonFactors(radix, scaledLen);
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
                let fStart = Math.floor(startScaled / factor) * factor;
                let fEnd = Math.ceil(endScaled / factor) * factor;
                let fLength = fEnd - fStart;
                let count = fLength / factor;
                let fInterval = fLength / count;
                let interval = fInterval * exponent;
                if (interval < minInterval) {
                    continue;
                }

                let origin = fStart * exponent;
                bestScale = {
                    origin: {
                        value: origin,
                        location: origin,
                    },
                    interval: {
                        value: interval,
                        location: interval,
                    },
                };
                break;
            }
            if (!bestScale) {
                exponent = exponent * radix;
                startScaled = startScaled / radix;
                endScaled = endScaled / radix;
            }
        } while (!bestScale);

        return bestScale;
    }

    addIntervalToValue(value: number, interval: number): number {
        return value + interval;
    }

    floorValue(value: number): number {
        return (
            Math.floor(value / this.tickScale.interval.value) *
            this.tickScale.interval.value
        );
    }

    locationOfValue(value: number): number {
        return value;
    }

    valueAtLocation(location: number): number {
        return location;
    }

    isValue(value: any): value is number {
        return typeof value === 'number';
    }

    isInterval(interval: any): interval is number {
        return typeof interval === 'number';
    }

    isValueEqual(v1: number, v2: number): boolean {
        return v1 === v2;
    }

    compareValues(a: number, b: number): number {
        return a - b;
    }

    isIntervalEqual(i1: number, i2: number): boolean {
        return i1 === i2;
    }
}
