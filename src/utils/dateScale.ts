import Decimal from "decimal.js";
import moment, { Moment } from 'moment';
import {
    TickConstraints,
    TickGenerator,
} from "./baseScale";
import { linearTicks } from "./linearScale";

const k0 = new Decimal(0);

type DateUnit =  'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
type DateUnitMapping<T> = { [unit in DateUnit]: T };

const kDateUnitsAsc: DateUnit[] = [
    'milliseconds',
    'seconds',
    'minutes',
    'hours',
    'days',
    'months',
    'years',
];
const kDateUnitsDes = [...kDateUnitsAsc].reverse();
const kUnitsLength = kDateUnitsAsc.length;
const kSecondsIndexAsc = kDateUnitsAsc.indexOf('seconds');

const kDateUnitRadix: Partial<DateUnitMapping<Decimal>> = {
    seconds: new Decimal(60),
    minutes: new Decimal(60),
    hours: new Decimal(24),
};

interface DateTickConstraints extends TickConstraints {
    /**
     * Specifies a UTC offset to tick calculations.
     * Defaults to the local time zone UTC offset.
     * 
     * See [Moment.js UTC Offset documentation](https://momentjs.com/docs/#/manipulating/utc-offset/)
     * for possible values.
     */
    utcOffset?: number | string;
}

/**
 * Calculates optimal tick locations for dates given an
 * interval and constraints (see {@link DateTickConstraints}).
 *  
 * @param start The inclusive start of the date interval in milliseconds. 
 * @param end The inclusive end of the date interval in milliseconds.
 * @param constraints See {@link DateTickConstraints}
 * @returns An array of tick locations in milliseconds.
 */
export const dateTicks: TickGenerator<DateTickConstraints> = (
    start: Decimal.Value,
    end: Decimal.Value,
    constraints: DateTickConstraints,
): Decimal[] => {
    let a = new Decimal(start);
    let b = new Decimal(end);
    if (b.lte(a) || a.isNaN() || !b.isFinite() || b.isNaN() || !b.isFinite()) {
        throw new Error('Interval must be finite and with a positive length');
    }
    let len = b.sub(a);

    let minInterval = new Decimal(constraints.minInterval || 0);
    if (minInterval.lt(0) || minInterval.isNaN() || !minInterval.isFinite()) {
        throw new Error('Minimum tick interval must be finite and with a positive length');
    }

    if (constraints.maxCount) {
        let maxCount = new Decimal(constraints.maxCount);
        if (maxCount.eq(0)) {
            return [];
        }
        if (maxCount.lt(0) || maxCount.isNaN()) {
            throw new Error('Max count must be greater than or equal to zero');
        }
        let maxCountInterval = len.div(maxCount.add(1));
        if (maxCountInterval.gt(minInterval)) {
            minInterval = maxCountInterval;
        }
    }

    if (minInterval.lte(0)) {
        throw new Error('Must specify either a minimum tick interval interval or a maximum interval count');
    }

    let startDate = moment(a.toNumber());
    let endDate = moment(b.toNumber());

    if (typeof constraints.utcOffset !== 'undefined') {
        startDate.utcOffset(constraints.utcOffset);
        endDate.utcOffset(constraints.utcOffset);
    }

    // Get duration
    let minDuration = moment.duration(minInterval.toNumber());

    // Get durations in units
    // let unitDurations: Partial<DateUnitMapping<number>> = {};
    let minUnitDurations: Partial<DateUnitMapping<number>> = {};
    for (let unit of kDateUnitsAsc) {
        // unitDurationsPartial[unit] = endDate.diff(startDate, unit);

        let unitDuration = minDuration.as(unit);
        if (Math.floor(unitDuration) >= 1) {
            minUnitDurations[unit] = unitDuration;
        }
    }

    /**
     * The largest non-zero unit of minInterval,
     * specified as an index of `kDateUnitsAsc`.
     **/
    let minUnitAscIndex = -1;
    for (let i = kUnitsLength - 1; i >= 0; i--) {
        let unit = kDateUnitsAsc[i];
        let unitDuration = minUnitDurations[unit] || 0;
        if (Math.floor(unitDuration) >= 1) {
            minUnitAscIndex = i;
            break;
        }
    }
    if (minUnitAscIndex <= kSecondsIndexAsc) {
        // Min interval is smaller than a second, use linear method
        return linearTicks(start, end, constraints);
    }

    let unitConstraints: TickConstraints = {
        ...constraints,
        maxCount: undefined,
    }
    let bestTicks: Decimal[] = [];
    for (let i = minUnitAscIndex; i < kUnitsLength; i++) {
        // Try to get tick intervals with this unit
        let unit = kDateUnitsAsc[i];
        let minUnitDuration = Math.ceil(minUnitDurations[unit] || 0);
        if (minUnitDuration === 0) {
            break;
        }
        let unitStart = snapDate(startDate, unit);
        let unitEnd = snapDate(endDate, unit);
        let unitDuration = unitEnd.diff(unitStart, unit, true);

        if (constraints.expand) {
            // TODO: expand w.r.t. minUnitDuration
            unitStart = floorDate(unitStart, unit);
            unitEnd = ceilDate(unitEnd, unit);
        }

        unitConstraints.minInterval = minUnitDuration;
        unitConstraints.radix = kDateUnitRadix[unit];
        let ticks = linearTicks(0, unitDuration, unitConstraints)
            .map(x => new Decimal(unitStart.clone().add(x.toNumber(), unit).valueOf()));
        if (ticks.length > 1) {
            bestTicks = ticks;
            break;
        } else if (ticks.length > bestTicks.length) {
            bestTicks = ticks;
        }
    }

    return bestTicks;
};

/**
 * Returns the rounded date if the smaller
 * unit also rounds to the same date,
 * otherwise, returns the original date copy.
 * 
 * This is useful for avoiding floating point
 * errors when calculating dates.
 * 
 * @param date 
 * @param unit 
 */
export const snapDate = (date: moment.MomentInput, unit: DateUnit): Moment => {
    let m = moment(date);
    let smallerUnit = largerDateUnit(unit);
    if (smallerUnit) {
        let mRound = roundDate(m.clone(), unit);
        let mSmallerRound = roundDate(m.clone(), smallerUnit);
        if (mRound.isSame(mSmallerRound)) {
            m = mRound;
        }
    }
    return m;
};

export const largerDateUnit = (unit: DateUnit): DateUnit | undefined => {
    let i = kDateUnitsAsc.indexOf(unit);
    return i > 0 ? kDateUnitsAsc[i - 1] : undefined;
};

export const smallerDateUnit = (unit: DateUnit): DateUnit | undefined => {
    let i = kDateUnitsDes.indexOf(unit);
    return i > 0 ? kDateUnitsDes[i - 1] : undefined;
};

/**
 * Returns the date nearest to the specified `date`
 * w.r.t. the specified date `unit`.
 * @param date 
 * @param unit 
 */
export const roundDate = (date: Moment, unit: DateUnit): Moment => {
    return linearStepDate(date, 0.5, unit).startOf(unit);
};

export const floorDate = (date: Moment, unit: DateUnit): Moment => {
    return date.clone().startOf(unit);
};

export const ceilDate = (date: Moment, unit: DateUnit): Moment => {
    return floorDate(date, unit).add(1, unit);
};

/**
 * Returns a date between the current unit (A) and 
 * the date at the next unit (B).
 * A step of 0 will return A, a step of 1 will return B,
 * and a step of 0.5 will return a date between A and B
 * using linear interpolation.
 * @param date 
 * @param step 
 * @param unit 
 */
export const linearStepDate = (
    date: Moment,
    step: number,
    unit: DateUnit,
): Moment => {
    return interpolatedDate(
        date,
        date.clone().add(1, unit),
        step,
    );
};

/**
 * Returns a date between the `date1` and `date2`.
 * A `position` of 0 will return `date1` (cloned),
 * a `position` of 1 will return `date2` (cloned),
 * a `position` of 0.5 will return a date between
 * the two using linear interpolation.
 * @param date1 
 * @param date2 
 * @param position 
 */
export const interpolatedDate = (
    date1: Moment,
    date2: Moment,
    position: number,
): Moment => {
    return moment(date1.valueOf() * (1 - position) + date2.valueOf() * position);
};
