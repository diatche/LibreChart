import Decimal from "decimal.js";
import Scale, {
    IScaleOptions,
    ITickScale,
    ITickScaleConstraints,
} from "./Scale";

type D = number;
type DiscreteScaleType<T> = ITickScale<T, number>;

const k0 = new Decimal(0);
const k1 = new Decimal(1);

export interface IDiscreteScaleOptions<T> extends IScaleOptions<T, D> {
    values: Iterable<T>;
}

export default class DiscreteScale<T> extends Scale<T, D> {
    readonly values: T[];

    tickScale: DiscreteScaleType<T>;

    constructor(options: IDiscreteScaleOptions<T>) {
        super(options);

        this.values = [...(options.values || [])];
        if (this.values.length === 0) {
            throw new Error('Discrete scale values must not be empty.');
        }

        this.tickScale = {
            origin: {
                value: this.values[0],
                location: k0,
            },
            interval: {
                valueInterval: 1,
                locationInterval: k1,
            },
        }
    }

    emptyValue(): T {
        return this.values[0];
    }

    emptyValueInterval(): number {
        return 0;
    }

    getTickScale(start: T, end: T, constraints?: ITickScaleConstraints<D>): DiscreteScaleType<T> {
        return {
            origin: {
                value: start,
                location: this.locationOfValue(start),
            },
            interval: {
                valueInterval: 1,
                locationInterval: k1,
            },
        }
    }

    addIntervalToValue(value: T, interval: D): T {
        let i = this.values.indexOf(value);
        if (i < 0) {
            return this.emptyValue();
        }
        return this.values[i + interval];
    }

    floorValue(value: T): T {
        return value;
    }

    locationOfValue(value: T): Decimal {
        if (value === this.emptyValue()) {
            return this.emptyScale().origin.location;
        }
        let i = this.values.indexOf(value);
        if (i < 0) {
            throw new Error(`Unable to get location of invalid value: ${value}`);
        }
        return new Decimal(i);
    }

    valueAtLocation(location: Decimal): T {
        let i = location.toNumber();
        if (i < 0) {
            i = 0;
        } else if (i >= this.values.length) {
            i = this.values.length - 1;
        }
        // if (i < 0 || i >= this.values.length) {
        //     return this.emptyValue();
        // }
        return this.values[i];
    }

    isValue(value: any): value is T {
        return this.values.indexOf(value) >= 0;
    }

    isInterval(interval: any): interval is D {
        return typeof interval === 'number';
    }

    compareValues(a: T, b: T): number {
        if (a === b) {
            return 0;
        }
        if (a === this.emptyValue()) {
            return -1;
        }
        if (b === this.emptyValue()) {
            return 1;
        }
        let ai = this.values.indexOf(a);
        if (ai < 0) {
            throw new Error(`Unable to compare invalid value (left): ${a}`);
        }
        let bi = this.values.indexOf(b);
        if (bi < 0) {
            throw new Error(`Unable to compare invalid value (right): ${b}`);
        }
        return ai - bi;
    }

    isIntervalEqual(interval1: D, interval2: D): boolean {
        return interval1 === interval2;
    }
}
