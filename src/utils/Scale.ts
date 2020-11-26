import Decimal from 'decimal.js';
import { IMatcher } from './comp';

const k0 = new Decimal(0);

export interface ITickLocation<T> {
    value: T;
    location: Decimal;
}

export interface ITickInterval<D> {
    valueInterval: D;
    locationInterval: Decimal;
}

export interface ITickScale<T, D> {
    origin: ITickLocation<T>;
    interval: ITickInterval<D>;
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
export default abstract class Scale<T, D = T, C extends ITickConstraints = ITickConstraints> {

    defaults: Partial<C>;

    constructor(
        options?: {
            defaults?: Partial<C>;
        }
    ) {
        this.defaults = { ...options?.defaults };
    }

    abstract originValue(): T;
    abstract zeroValueInterval(): D;

    emptyScale(): ITickScale<T, D> {
        return {
           origin: {
               value: this.originValue(),
               location: k0,
           },
           interval: {
               valueInterval: this.zeroValueInterval(),
               locationInterval: k0,
           },
        };
    }

    /**
     * Calculates an optimal tick scale given a value interval
     * and constraints (see {@link ITickConstraints}).
     * 
     * The scale can be used to generate tick in a value or location
     * range.
     *  
     * @param start The inclusive start of the value interval. 
     * @param end The inclusive end of the value interval.
     * @param constraints See {@link ITickConstraints}
     * @returns A tick scale.
     */
    abstract getTickScale(start: T, end: T, constraints: C): ITickScale<T, D>;

    /**
     * Returns all ticks in the specified location
     * range.
     * 
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @param scale The tick interval.
     * @returns Tick locations.
     */
    getTicksInLocationRange(start: Decimal, end: Decimal, scale: ITickScale<T, D>): ITickLocation<T>[] {
        if (start.gte(end)) {
            return [];
        }
        if (scale.interval.locationInterval.lte(0)) {
            return [];
        }

        // Get all ticks in interval
        let startLocation = this.floorLocation(start, scale);
        let startValue = this.decodeValue(startLocation, scale);
        let tick: ITickLocation<T> = {
            value: startValue,
            location: start,
        };
        
        let ticks: ITickLocation<T>[] = [];
        while (tick.location.lt(end)) {
            if (tick.location.gte(start)) {
                ticks.push(tick);
            }
            tick = this.getNextTick(tick, scale);
        }
        return ticks;
    }

    /**
     * Calculates an optimal tick interval given a value interval
     * and constraints (see {@link ITickConstraints}).
     * 
     * @deprecated Use `getTickScale()` and `getTicksInLocationRange()` instead.
     * 
     * @param start 
     * @param end 
     * @param constraints 
     */
    getTicks(start: T, end: T, constraints: C): ITickLocation<T>[] {
        let interval = this.getTickScale(start, end, constraints);
        let startLoc = this.encodeValue(start, interval);
        let endLoc = this.encodeValue(start, interval);
        return this.getTicksInLocationRange(startLoc, endLoc, interval);
    }

    /**
     * Calculates optimal ticks locations given a value
     * interval and constraints (see {@link ITickConstraints}).
     * 
     * @deprecated Use `getTickScale()` and `getTicksInLocationRange()` instead.
     *  
     * @param start The inclusive start of the interval. 
     * @param end The inclusive end of the interval.
     * @param constraints See {@link ITickConstraints}
     * @returns An array of tick locations.
     */
    getTickLocations(start: T, end: T, constraints: C): Decimal[] {
        return this.getTicks(start, end, constraints).map(t => t.location);
    }

    getNextTick(tick: ITickLocation<T>, scale: ITickScale<T, D>): ITickLocation<T> {
        return {
            value: this.addIntervalToValue(tick.value, scale),
            location: tick.location.add(scale.interval.locationInterval),
        };
    }

    abstract addIntervalToValue(value: T, scale: ITickScale<T, D>): T;

    abstract floorValue(value: T, scale: ITickScale<T, D>): T;

    floorLocation(location: Decimal, scale: ITickScale<T, D>): Decimal {
        return location.sub(scale.origin.location)
            .div(scale.interval.locationInterval)
            .floor()
            .mul(scale.interval.locationInterval)
            .add(scale.origin.location);
    }

    abstract encodeValue(value: T, scale: ITickScale<T, D>): Decimal;

    abstract decodeValue(value: Decimal, scale: ITickScale<T, D>): T;

    abstract isValue(value: any): value is T;

    abstract isInterval(interval: any): interval is D;

    abstract isValueEqual(value1: T, value2: T): boolean;

    abstract isIntervalEqual(interval1: D, interval2: D): boolean;

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
