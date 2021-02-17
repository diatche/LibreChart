import Decimal from 'decimal.js';
import { IMatcher, isMatch } from '../utils/comp';

export interface ITickVector<T> {
    value: T;
    location: number;
}

export interface ITickScale<T, D = T> {
    origin: ITickVector<T>;
    interval: ITickVector<D>;
}

/**
 * Tick scale calculation constraints and options.
 *
 * Must specify either a `minInterval`, or
 * `maxCount`, or both.
 */
export interface ITickScaleConstraints<D> {
    /**
     * The smallest tick interval.
     */
    minInterval?: Partial<ITickVector<D>>;

    /**
     * Maximum number of intervals to divide
     * the interval into.
     **/
    maxCount?: number;

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
    radix?: number;

    /**
     * Factors to exclude when looking for optimal
     * tick locations.
     *
     * For example, if you don't want an interval of
     * 2 between tick marks, specify `[2]`.
     */
    excludeFactors?: number[];

    minorTickConstraints?: ITickScaleConstraints<D>[];
}

export interface IScaleOptions<T, D = T> {
    /**
     * The number of minor tick sets.
     * Specifying 1 will create a single minor
     * tick scale, which aligns with the main tick
     * scale. Defaults to zero.
     */
    minorTickDepth?: number;
    constraints?: ITickScaleConstraints<D>;
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
    readonly minorTickScales: ITickScale<T, D>[];

    constraints?: ITickScaleConstraints<D>;

    maxStepFractionDenominator = 1000;

    private _minorTickDepth = 0;

    constructor(options: IScaleOptions<T, D>) {
        this.minorTickDepth = options.minorTickDepth || 0;
        this.constraints = { ...options.constraints };
        this.minorTickScales = [];
    }

    get minorTickDepth(): number {
        return this._minorTickDepth;
    }

    set minorTickDepth(i: number) {
        if (i === this._minorTickDepth) {
            return;
        }
        this._minorTickDepth = i;
        this._padMinorTickScales();
    }

    /**
     * A zero value. Used to create an empty scale.
     *
     * This value must be available before the
     * constructor is called.
     **/
    abstract emptyValue(): T;

    /**
     * A zero value interval. Used to create an empty scale.
     *
     * This value must be available before the
     * constructor is called.
     **/
    abstract emptyValueInterval(): D;

    emptyScale(): ITickScale<T, D> {
        return {
            origin: {
                value: this.emptyValue(),
                location: 0,
            },
            interval: {
                value: this.emptyValueInterval(),
                location: 0,
            },
        };
    }

    updateTickScale(
        start: T,
        end: T,
        constraints?: ITickScaleConstraints<D>,
    ): boolean {
        let scale = this.getTickScale(start, end, constraints);
        if (this.isTickScaleEqual(scale, this.tickScale)) {
            return false;
        }
        this.tickScale = scale;
        this._updateMinorTickScales(constraints);
        return true;
    }

    private _updateMinorTickScales(constraints?: ITickScaleConstraints<D>) {
        let scale = this.tickScale;
        this.minorTickScales.splice(0, this.minorTickScales.length);
        for (let i = 0; i < this.minorTickDepth; i++) {
            if (scale.interval.location === 0) {
                scale = this.emptyScale();
            } else {
                scale = this.getTickScale(
                    scale.origin.value,
                    this.addIntervalToValue(
                        scale.origin.value,
                        scale.interval.value,
                    ),
                    {
                        ...constraints?.minorTickConstraints?.[i],
                        expand: false,
                    },
                );
            }
            this.minorTickScales.push(scale);
        }
    }

    private _padMinorTickScales() {
        let padLength = this.minorTickDepth - this.minorTickScales.length;
        for (let i = 0; i < padLength; i++) {
            this.minorTickScales.push(this.emptyScale());
        }
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
    abstract getTickScale(
        start: T,
        end: T,
        constraints?: ITickScaleConstraints<D>,
    ): ITickScale<T, D>;

    /**
     * Iterates all values in the specified value
     * range.
     *
     * You must call `updateScale()` to use this method.
     *
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     */
    *iterateTickValuesInRange(start: T, end: T): Generator<T> {
        if (this.compareValues(start, end) >= 0) {
            return;
        }
        if (this.tickScale.interval.location <= 0) {
            return;
        }

        let value = this.floorValue(start);
        let nextValue: T;
        while (this.compareValues(value, end) < 0) {
            if (this.compareValues(value, start) >= 0) {
                yield value;
            }
            nextValue = this.nextValue(value);
            if (this.isValueEqual(nextValue, value)) {
                // This prevents infinite loops in case
                // the subclass implementation has a mistake.
                // Not having this check will make it hard to debug.
                throw new Error('Could not get next value');
            }
            value = nextValue;
        }
        return value;
    }

    /**
     * Returns all ticks in the specified value
     * range.
     *
     * You must call `updateScale()` to use this method.
     *
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @returns Tick locations.
     */
    getTicksInValueRange(start: T, end: T): ITickVector<T>[] {
        if (this.compareValues(start, end) >= 0) {
            return [];
        }
        if (this.tickScale.interval.location <= 0) {
            return [];
        }

        // Get all ticks in interval
        let startFloor = this.floorValue(start);
        let tick: ITickVector<T> = {
            value: startFloor,
            location: this.locationOfValue(startFloor),
        };
        let nextTick: ITickVector<T>;

        let ticks: ITickVector<T>[] = [];
        while (this.compareValues(tick.value, end) < 0) {
            if (this.compareValues(tick.value, start) >= 0) {
                ticks.push(tick);
            }
            nextTick = this.nextTick(tick);
            if (this.isValueEqual(nextTick.value, tick.value)) {
                // This prevents infinite loops in case
                // the subclass implementation has a mistake.
                // Not having this check will make it hard to debug.
                throw new Error('Could not get next tick');
            }
            tick = nextTick;
        }
        return ticks;
    }

    /**
     * Returns all ticks in the specified location
     * range.
     *
     * You must call `updateScale()` to use this method.
     *
     * @param start Inclusive start of interval.
     * @param end Exclusive end of interval.
     * @returns Tick locations.
     */
    getTicksInLocationRange(start: number, end: number): ITickVector<T>[] {
        return this.getTicksInValueRange(
            this.valueAtLocation(start),
            this.valueAtLocation(end),
        );
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
    getTicks(
        start: T,
        end: T,
        constraints: ITickScaleConstraints<D>,
    ): ITickVector<T>[] {
        this.updateTickScale(start, end, constraints);
        if (constraints?.expand) {
            [start, end] = this.spanValueRange(start, end);
        }
        let ticks = this.getTicksInValueRange(start, end);

        // add tick at end
        if (ticks.length !== 0 && this.tickScale.interval.location > 0) {
            let endTick = this.nextTick(ticks[ticks.length - 1]);
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
    getTickLocations(
        start: T,
        end: T,
        constraints: ITickScaleConstraints<D>,
    ): number[] {
        return this.getTicks(start, end, constraints).map(t => t.location);
    }

    nextTick(tick: ITickVector<T>): ITickVector<T> {
        return {
            value: this.nextValue(tick.value),
            location: this.nextLocation(tick.location),
        };
    }

    abstract addIntervalToValue(value: T, interval: D): T;

    /**
     * Adds one interval to `value`.
     *
     * @param value
     */
    nextValue(value: T): T {
        return this.addIntervalToValue(value, this.tickScale.interval.value);
    }

    /**
     * Adds one interval to `location`.
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
     */
    nextLocation(location: number): number {
        return this.snapLocation(location + this.tickScale.interval.location);
    }

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
    stepLocation(location: number, steps: number): number {
        return this.snapLocation(
            location + steps * this.tickScale.interval.location,
        );
    }

    countTicksInValueRange(start: T, end: T): number {
        let count = 0;
        for (let value of this.iterateTickValuesInRange(start, end)) {
            count += 1;
        }
        return count;
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
    snapLocation(
        location: number,
        overrides?: {
            origin?: Pick<ITickVector<any>, 'location'>;
            interval?: Pick<ITickVector<any>, 'location'>;
        },
    ): number {
        let x = new Decimal(location);
        let locationInterval = new Decimal(
            overrides?.origin?.location || this.tickScale.interval.location,
        );
        let origin = new Decimal(
            overrides?.interval?.location || this.tickScale.origin.location,
        );

        if (x.isInt() || locationInterval.isInt() || x.eq(origin)) {
            // Integer intervals do not need to be rounded
            return location;
        }
        // Check steps from origin
        let dist = x.sub(origin);
        let steps = dist.div(locationInterval).round();

        // Round value if at edge
        let fraction = locationInterval.toFraction(
            this.maxStepFractionDenominator,
        );
        if (steps.mod(fraction[1]).isZero()) {
            // At edge
            dist = dist.round();
        }
        return origin.add(dist).toNumber();
    }

    abstract floorValue(value: T): T;

    ceilValue(value: T): T {
        let floor = this.floorValue(value);
        if (this.isValueEqual(floor, value)) {
            return floor;
        }
        return this.addIntervalToValue(floor, this.tickScale.interval.value);
    }

    spanValueRange(start: T, end: T): [T, T] {
        return [this.floorValue(start), this.ceilValue(end)];
    }

    floorLocation(location: number): number {
        return (
            Math.floor(
                (location - this.tickScale.origin.location) /
                    this.tickScale.interval.location,
            ) *
                this.tickScale.interval.location +
            this.tickScale.origin.location
        );
    }

    ceilLocation(location: number): number {
        return (
            Math.ceil(
                (location - this.tickScale.origin.location) /
                    this.tickScale.interval.location,
            ) *
                this.tickScale.interval.location +
            this.tickScale.origin.location
        );
    }

    spanLocationRange(start: number, end: number): [number, number] {
        return [this.floorLocation(start), this.ceilLocation(end)];
    }

    abstract locationOfValue(value: T): number;

    abstract valueAtLocation(location: number): T;

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

    isTickScaleEqual(
        scale1: ITickScale<T, D>,
        scale2: ITickScale<T, D>,
    ): boolean {
        return isMatch(scale1, scale2, [
            this.getValueMatcher(),
            this.getIntervalMatcher(),
        ]);
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
