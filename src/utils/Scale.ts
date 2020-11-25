import Decimal from 'decimal.js';
import { IMatcher } from './comp';

export interface ITick<T, D> {
    value: T;
    interval: D;
    location: Decimal;
}

/**
 * Tick calculation constraints and options.
 * 
 * Must specify either a `minInterval`, or 
 * `maxCount`, or both.
 */
export interface ITickConstraints {
    /**
     * The smallest tick interval.
     */
    minInterval?: Decimal;

    /**
     * Maximum number of intervals to divide
     * the interval into.
     **/
    maxCount?: Decimal;

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

    /**
     * An integer greater than 1 specifying the base
     * to use for representing numeric values. Defaults
     * to 10.
     * 
     * Examples of when this is useful:
     * 
     * - When used with minutes or seconds (use a radix of 60).
     * - When used with hours (use a radix of 24).
     * - When used with months (use a radix of 12).
     * - When used with other number systems. 
     */
    radix?: Decimal;

    /**
     * Factors to exclude when looking for optimal
     * tick locations.
     * 
     * For example, if you don't want an interval of
     * 2 between tick marks, specify `[2]`.
     */
    excludeFactors?: number[];
}

/**
 * Scale base class.
 * 
 * Generic types:
 * 
 * - `T`: Value type.
 * - `D`: Value interval type (defaults to `T`).
 * - `C`: Constraints type conforming to ITickConstraints (optional).
 */
export default class Scale<T, D = T, C extends ITickConstraints = ITickConstraints> {

    defaults: Partial<C>;

    constructor(
        options?: {
            defaults?: Partial<C>;
        }
    ) {
        this.defaults = { ...options?.defaults };
    }

    get zeroInterval(): D {
        throw new Error('Not implemented');
    }

    /**
     * Calculates optimal ticks given an interval and
     * constraints (see {@link ITickConstraints}).
     *  
     * @param start The inclusive start of the interval. 
     * @param end The inclusive end of the interval.
     * @param constraints See {@link ITickConstraints}
     * @returns An array of tick locations.
     */
    getTicks(start: T, end: T, constraints: C): ITick<T, D>[] {
        throw new Error('Not implemented');
    }

    /**
     * Calculates optimal ticks locations given an
     * interval and constraints (see {@link ITickConstraints}).
     *  
     * @param start The inclusive start of the interval. 
     * @param end The inclusive end of the interval.
     * @param constraints See {@link ITickConstraints}
     * @returns An array of tick locations.
     */
    getTickLocations(start: T, end: T, constraints: C): Decimal[] {
        return this.getTicks(start, end, constraints).map(t => t.location);
    }

    getNextTick(tick: ITick<T, D>): ITick<T, D> {
        throw new Error('Not implemented');
    }

    encodeValue(value: T): Decimal {
        throw new Error('Not implemented');
    }

    decodeValue(value: Decimal): T {
        throw new Error('Not implemented');
    }

    isValue(value: any): value is T {
        throw new Error('Not implemented');
    }

    isInterval(interval: any): interval is D {
        throw new Error('Not implemented');
    }

    isValueEqual(value1: T, value2: T): boolean {
        throw new Error('Not implemented');
    }

    isIntervalEqual(interval1: D, interval2: D): boolean {
        throw new Error('Not implemented');
    }

    getValueMatcher(): IMatcher<T> {
        return {
            isType: x => this.isValue(x),
            isEqual: (a, b) => this.isValueEqual(a, b),
        };
    }

    getIntervalMatcher(): IMatcher<D> {
        return {
            isType: x => this.isInterval(x),
            isEqual: (a, b) => this.isIntervalEqual(a, b),
        };
    }
}
