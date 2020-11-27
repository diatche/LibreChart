import Decimal from 'decimal.js';
import { IMatcher, isMatch } from './comp';

const k0 = new Decimal(0);
const k1 = new Decimal(1);

export interface ITickLocation<T> {
    value: T;
    location: Decimal;
}

export interface ITickInterval<D> {
    valueInterval: D;
    locationInterval: Decimal;
}

export interface ITickScale<T, D = T> {
    origin: ITickLocation<T>;
    interval: ITickInterval<D>;
}

export interface ITickConstraints {

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
 * Tick scale calculation constraints and options.
 * 
 * Must specify either a `minInterval`, or 
 * `maxCount`, or both.
 */
export interface ITickScaleConstraints<D> extends ITickConstraints {
    /**
     * The smallest tick interval.
     */
    minInterval?: Partial<ITickInterval<D>>;

    /**
     * Maximum number of intervals to divide
     * the interval into.
     **/
    maxCount?: Decimal;

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

export interface IScaleOptions<T, D = T> {
    // onChange?: (scale: ITickScale<T, D>, previousScale: ITickScale<T, D>) => void;
    defaults?: ITickScaleConstraints<D>;
}

/**
 * Scale base class.
 * 
 * Call `updateScale()` to initialize and to update.
 * 
 * Generic types:
 * 
 * - `T`: Value type.
 * - `D`: Value interval type (defaults to `T`).
 */
export default abstract class Scale<T, D = T> implements IScaleOptions<T, D> {

    abstract tickScale: ITickScale<T, D>;

    // onChange?: (scale: ITickScale<T, D>, previousScale: ITickScale<T, D>) => void;
    defaults?: ITickScaleConstraints<D>;

    maxStepFraction = 1000;

    constructor(options?: IScaleOptions<T, D>) {
        this.defaults = { ...options?.defaults };
    }

    /**
     * A zero value. Used to create an empty scale.
     * 
     * This value must be available before the
     * constructor is called.
     **/
    abstract zeroValue(): T;

    /**
     * A zero value interval. Used to create an empty scale.
     * 
     * This value must be available before the
     * constructor is called.
     **/
    abstract zeroValueInterval(): D;

    emptyScale(): ITickScale<T, D> {
        return {
           origin: {
               value: this.zeroValue(),
               location: k0,
           },
           interval: {
               valueInterval: this.zeroValueInterval(),
               locationInterval: k0,
           },
        };
    }

    updateScale(start: T, end: T, constraints: ITickScaleConstraints<D>): boolean {
        let scale = this.getTickScale(start, end, constraints);
        if (this.isTickScaleEqual(scale, this.tickScale)) {
            return false;
        }
        // let previous = this.tickScale;
        this.tickScale = scale;
        // this.onChange?.(scale, previous);
        return true;
    }

    /**
     * Calculates an optimal tick scale given a value interval
     * and constraints (see {@link ITickScaleConstraints}).
     * 
     * The scale can be used to generate tick in a value or location
     * range.
     *  
     * @param start The inclusive start of the value interval. 
     * @param end The inclusive end of the value interval.
     * @param constraints See {@link ITickScaleConstraints}
     * @returns A tick scale.
     */
    abstract getTickScale(start: T, end: T, constraints: ITickScaleConstraints<D>): ITickScale<T, D>;

    /**
     * Returns all ticks in the specified location
     * range.
     * 
     * You must call `updateScale()` to use this method.
     * 
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @param scale The tick interval.
     * @returns Tick locations.
     */
    getTicksInLocationRange(
        start: Decimal,
        end: Decimal,
        constraints?: ITickConstraints,
    ): ITickLocation<T>[] {
        if (start.gte(end)) {
            return [];
        }
        if (this.tickScale.interval.locationInterval.lte(0)) {
            return [];
        }

        // Get all ticks in interval
        let startLocation = this.floorLocation(start);
        let startValue = this.valueAtLocation(startLocation);
        let tick: ITickLocation<T> = {
            value: startValue,
            location: startLocation,
        };

        if (constraints?.expand) {
            start = startLocation;
            end = this.ceilLocation(end);
        }
        
        let ticks: ITickLocation<T>[] = [];
        while (tick.location.lt(end)) {
            if (tick.location.gte(start)) {
                ticks.push(tick);
            }
            tick = this.getNextTick(tick);
        }
        return ticks;
    }

    /**
     * Calculates an optimal tick interval given a value interval
     * and constraints (see {@link ITickScaleConstraints}).
     * 
     * @deprecated Use `getTickScale()` and `getTicksInLocationRange()` instead.
     * 
     * @param start 
     * @param end 
     * @param constraints 
     */
    getTicks(start: T, end: T, constraints: ITickScaleConstraints<D>): ITickLocation<T>[] {
        this.updateScale(start, end, constraints);
        let startLoc = this.locationOfValue(start);
        let endLoc = this.locationOfValue(end);
        if (constraints?.expand) {
            endLoc = this.ceilLocation(endLoc);
            end = this.ceilValue(end);
        }
        let ticks = this.getTicksInLocationRange(startLoc, endLoc, constraints);

        // add tick at end
        if (ticks.length !== 0 && this.tickScale.interval.locationInterval.gt(0)) {
            let endTick = this.getNextTick(ticks[ticks.length - 1]);
            if (this.compareValues(endTick.value, end) <= 0) {
                // End tick is before or equal to end
                ticks.push(endTick);
            }
        }
        return ticks;
    }

    /**
     * Calculates optimal ticks locations given a value
     * interval and constraints (see {@link ITickScaleConstraints}).
     * 
     * @deprecated Use `getTickScale()` and `getTicksInLocationRange()` instead.
     *  
     * @param start The inclusive start of the interval. 
     * @param end The inclusive end of the interval.
     * @param constraints See {@link ITickScaleConstraints}
     * @returns An array of tick locations.
     */
    getTickLocations(start: T, end: T, constraints: ITickScaleConstraints<D>): Decimal[] {
        return this.getTicks(start, end, constraints).map(t => t.location);
    }

    getNextTick(tick: ITickLocation<T>): ITickLocation<T> {
        return {
            value: this.addIntervalToValue(tick.value, this.tickScale.interval.valueInterval),
            location: this.stepLocation(tick.location, k1),
        };
    }

    abstract addIntervalToValue(value: T, interval: D): T;

    /**
     * Adds whole multiples (`steps`) of intervals
     * to `location`.
     * 
     * If the interval is not an integer, rounds
     * the distance when `steps` multiplied by
     * the interval fraction is a whole number.
     * This is useful when the interval is a
     * fraction, e.g. 1/60. The maximum fraction
     * is specified by the `maxStepFraction`
     * property.
     * 
     * @param location 
     * @param steps 
     */
    stepLocation(location: Decimal, steps: Decimal): Decimal {
        return this.snapLocation(
            location.add(steps.mul(this.tickScale.interval.locationInterval))
        );
    }

    /**
     * If the interval is not an integer, rounds
     * the location when `steps` multiplied by
     * the interval fraction is a whole number.
     * This is useful when the interval is a
     * fraction, e.g. 1/60. The maximum fraction
     * is specified by the `maxStepFraction`
     * property.
     * 
     * @param location 
     */
    snapLocation(location: Decimal): Decimal {
        let { locationInterval } = this.tickScale.interval;
        let origin = this.tickScale.origin.location;

        if (location.isInt() || locationInterval.isInt() || location.eq(origin)) {
            // Integer intervals do not need to be rounded
            return location;
        }
        // Check steps from origin
        let dist = location.sub(origin);
        let steps = dist.div(locationInterval).round();

        // Round value if at edge
        let fraction = locationInterval.toFraction(this.maxStepFraction);
        if (steps.mod(fraction[1]).isZero()) {
            // At edge
            dist = dist.round();
        }
        return origin.add(dist);
    }

    abstract floorValue(value: T): T;

    ceilValue(value: T): T {
        let floor = this.floorValue(value);
        if (this.isValueEqual(floor, value)) {
            return floor;
        }
        return this.addIntervalToValue(
            floor,
            this.tickScale.interval.valueInterval
        );
    }

    floorLocation(location: Decimal): Decimal {
        return location.sub(this.tickScale.origin.location)
            .div(this.tickScale.interval.locationInterval)
            .floor()
            .mul(this.tickScale.interval.locationInterval)
            .add(this.tickScale.origin.location);
    }

    ceilLocation(location: Decimal): Decimal {
        return location.sub(this.tickScale.origin.location)
            .div(this.tickScale.interval.locationInterval)
            .ceil()
            .mul(this.tickScale.interval.locationInterval)
            .add(this.tickScale.origin.location);
    }

    abstract locationOfValue(value: T): Decimal;

    abstract valueAtLocation(location: Decimal): T;

    abstract isValue(value: any): value is T;

    abstract isInterval(interval: any): interval is D;

    isValueEqual(value1: T, value2: T): boolean {
        return this.compareValues(value1, value2) === 0;
    }

    /**
     * Return an ascending order comparison between
     * values `a` and `b`:
     * 
     * - Return a negative value if `a` is smaller than `b`.
     * - Return a zero if `a` is equal to `b`.
     * - Return a positive value if `a` is larger than `b`.
     * 
     * To aid intuition, imagine a negative sign between
     * `a` and `b`.
     * 
     * @param a 
     * @param b 
     */
    abstract compareValues(a: T, b: T): number;

    abstract isIntervalEqual(interval1: D, interval2: D): boolean;

    isTickScaleEqual(scale1: ITickScale<T, D>, scale2: ITickScale<T, D>): boolean {
        return isMatch(scale1, scale2, [this.getValueMatcher(), this.getIntervalMatcher()]);
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
