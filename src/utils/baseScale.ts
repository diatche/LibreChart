import Decimal from 'decimal.js';

/**
 * Tick calculation options.
 * 
 * Must specify either a `minDistance`, or 
 * `maxCount`, or both.
 */
export interface TickConstraints {
    /**
     * The smallest tick interval.
     */
    minDistance?: Decimal.Value;
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
export type TickGenerator = (
    start: Decimal.Value,
    end: Decimal.Value,
    constraints: TickConstraints,
) => Decimal[];
