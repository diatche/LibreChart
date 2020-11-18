import Decimal from 'decimal.js';

/**
 * Tick calculation constraints and options.
 * 
 * Must specify either a `minInterval`, or 
 * `maxCount`, or both.
 */
export interface TickConstraints {
    /**
     * The smallest tick interval.
     */
    minInterval?: Decimal.Value;
    /**
     * Maximum number of intervals to divide
     * the interval into.
     **/
    maxCount?: Decimal.Value;
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
    radix?: Decimal.Value;
}

/**
 * Calculates optimal tick locations given an
 * interval and constraints (see {@link TickConstraints}).
 *  
 * @param start The inclusive start of the interval. 
 * @param end The inclusive end of the interval.
 * @param options See {@link TickConstraints}
 * @returns An array of tick locations.
 */
export type TickGenerator<C extends TickConstraints = TickConstraints> = (
    start: Decimal.Value,
    end: Decimal.Value,
    constraints: C,
) => Decimal[];
