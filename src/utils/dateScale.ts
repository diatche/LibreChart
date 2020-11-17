import Decimal from "decimal.js";
import moment from 'moment';
import 'moment-round';
import {
    TickConstraints,
    TickGenerator,
} from "./baseScale";

const k0 = new Decimal(0);

type DateUnit =  'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
type DateUnitMapping<T> = { [unit in DateUnit]: T };

const kDateUnitsDesc: DateUnit[] = [
    'years',
    'months',
    'days',
    'hours',
    'minutes',
    'seconds',
    'milliseconds',
];
const kDateUnitsAsc = kDateUnitsDesc.reverse();
const kUnitsLength = kDateUnitsDesc.length;

/**
 * Calculates optimal tick locations for dates given an
 * interval and constraints (see {@link TickConstraints}).
 *  
 * @param start The inclusive start of the date interval in milliseconds. 
 * @param end The inclusive end of the date interval in milliseconds.
 * @param constraints See {@link TickConstraints}
 * @returns An array of tick locations in milliseconds.
 */
export const dateTicks: TickGenerator = (
    start: Decimal.Value,
    end: Decimal.Value,
    constraints: TickConstraints,
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

    // Get duration
    let minDuration = moment.duration(minInterval.toNumber());

    // Get durations in units
    let unitDurationsPartial: Partial<DateUnitMapping<number>> = {};
    let minUnitDurationsPartial: Partial<DateUnitMapping<number>> = {};
    for (let unit of kDateUnitsDesc) {
        unitDurationsPartial[unit] = endDate.diff(startDate, unit);
        minUnitDurationsPartial[unit] = minDuration.as(unit);
    }
    let unitDurations = unitDurationsPartial as DateUnitMapping<number>;
    let minUnitDurations = minUnitDurationsPartial as DateUnitMapping<number>;

    /**
     * The largest non-zero unit of minInterval,
     * specified as an index of `kDateUnitsAsc`.
     **/
    let minUnitAscIndex = -1;
    let minUnit: DateUnit | undefined;
    let minUnitDuration = k0;
    for (let i = kUnitsLength - 1; i >= 0; i--) {
        let unit = kDateUnitsAsc[i];
        let unitDuration = minUnitDurations[unit];
        if (Math.floor(unitDuration) > 0) {
            minUnitAscIndex = i;
            minUnit = unit;
            minUnitDuration = new Decimal(unitDuration).ceil();
            break;
        }
    }
    if (typeof minUnit === 'undefined') {
        minUnit = 'milliseconds';
        minUnitAscIndex = 0;
        minUnitDuration = minInterval.ceil();
    }

    if (constraints.expand) {
        startDate = startDate.floor(minUnitDuration.toNumber(), minUnit);
        endDate = endDate.ceil(minUnitDuration.toNumber(), minUnit);
    }

    /**
     * The range of units which are non-zero,
     * specified as an index range of `kDateUnitsAsc`.
     **/
    let ascUnitRange: [number, number] = [0, 0];
    for (let i = minUnitAscIndex; i < kUnitsLength; i++) {
        let unitDuration = unitDurations[kDateUnitsAsc[i]];
        if (unitDuration > 0) {
            ascUnitRange[0] = i;
            break;
        }
    }
    for (let i = kUnitsLength - 1; i >= 0; i--) {
        let unitDuration = unitDurations[kDateUnitsAsc[i]];
        if (unitDuration > 0) {
            ascUnitRange[1] = i + 1;
            break;
        }
    }
    if (ascUnitRange[0] >= ascUnitRange[1]) {
        return [];
    }

    type Base = {
        start: Decimal;
        end: Decimal;
        interval: Decimal;
        count: number;
    }

    let bestBase: Base | undefined;

    for (let i = 0; i < mantissas.length; i++) {
        const mantissa = mantissas[i];
        // const baseLogCount = kBaseLogCounts[i];
        let mStart = aScaled.div(mantissa).floor().mul(mantissa);
        let mEnd = bScaled.div(mantissa).ceil().mul(mantissa);
        let mLength = mEnd.sub(mStart);
        let tickCount = mLength.div(mantissa);
        let mInterval = mLength.div(tickCount);
        let interval = mInterval.mul(exponent);
        if (interval.lt(minInterval) && !mantissa.eq(k10)) {
            continue;
        }
        bestBase = {
            start: mStart.mul(exponent),
            end: mEnd.mul(exponent),
            interval,
            count: tickCount.toNumber(),
        };
        break;
    }

    if (!bestBase) {
        return [];
    }

    let { expand = false } = constraints || {};
    if (expand) {
        a = bestBase.start;
        b = bestBase.end;
    }

    let ticks: Decimal[] = [];
    for (let i = 0; i <= bestBase.count; i++) {
        let tick = bestBase.start.add(bestBase.interval.mul(i));
        if (tick.gte(a) && tick.lte(b)) {
            ticks.push(tick);
        }
    }
    if (!expand && ticks.length === 1 && len.gte(minInterval)) {
        // Fixed interval is greater than the min interval,
        // but is smaller than the optimal interval.
        if (a.eq(bestBase.start)) {
            // Use the end of the interval as the tick.
            ticks.push(b);
        } else {
            // Use the original interval.
            ticks = [a, b];
        }
    }
    return ticks;
};
