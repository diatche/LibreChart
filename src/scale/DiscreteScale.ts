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
    values: T[];
    isValue: (value: any) => value is T;
}

export default class DiscreteScale<T> extends Scale<T | undefined, D> {
    readonly values: T[];
    private _isValue: (value: any) => value is T;

    tickScale: DiscreteScaleType<T>;

    constructor(options: IDiscreteScaleOptions<T>) {
        super(options);

        this.values = options.values || [];
        if (this.values.length === 0) {
            throw new Error('Discrete scale values must not be empty.');
        }
        this._isValue = options.isValue;

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

    zeroValue(): T {
        return this.values[0];
    }

    zeroValueInterval(): number {
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

    addIntervalToValue(value: T, interval: D): T | undefined {
        let i = this.values.indexOf(value);
        if (i < 0) {
            throw new Error('Invalid value');
        }
        return this.values[i + interval];
    }

    floorValue(value: T): T {
        return value;
    }

    locationOfValue(value: T): Decimal {
        let i = this.values.indexOf(value);
        if (i < 0) {
            throw new Error('Invalid value');
        }
        return new Decimal(i);
    }

    valueAtLocation(location: Decimal): T | undefined {
        return this.values[location.toNumber()];
    }

    isValue(value: any): value is T {
        return this._isValue(value);
    }

    isInterval(interval: any): interval is D {
        return typeof interval === 'number';
    }

    compareValues(a: T, b: T): number {
        let ai = this.values.indexOf(a);
        if (ai < 0) {
            throw new Error('Invalid value');
        }
        let bi = this.values.indexOf(b);
        if (bi < 0) {
            throw new Error('Invalid value');
        }
        return ai - bi;
    }

    isIntervalEqual(interval1: D, interval2: D): boolean {
        return interval1 === interval2;
    }
}
