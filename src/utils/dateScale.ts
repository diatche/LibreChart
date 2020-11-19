import Decimal from "decimal.js";
import moment from 'moment';
import {
    TickConstraints,
    TickGenerator,
} from "./baseScale";
import {
    DateUnitMapping,
    kDateUnitsAsc,
    kUnitsLength,
    kSecondsIndexAsc,
    kDateUnitRadix,
} from "./dateBase";
import {
    ceilDate,
    floorDate,
    roundDateLinear,
    snapDate,
} from "./duration";
import { linearTicks } from "./linearScale";

const k0 = new Decimal(0);

/**
 * Date tick calculation constraints and options.
 * 
 * Must specify either a `minInterval` (in milliseconds),
 * `minDuration`, or `maxCount`, or a combination of the three.
 * 
 * Automatically handles `radix`.
 */
export interface DateTickConstraints extends TickConstraints {
    /**
     * Specifies a UTC offset to tick calculations.
     * Defaults to the local time zone UTC offset.
     * 
     * See [Moment.js UTC Offset documentation](https://momentjs.com/docs/#/manipulating/utc-offset/)
     * for possible values.
     */
    utcOffset?: number | string;
    /**
     * Allows specifying a minimum interval using
     * any date unit.
     * 
     * See [Moment.js Duration documentation](https://momentjs.com/docs/#/durations/)
     * for possible values.
     */
    minDuration?: moment.Duration;
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
    if (b.lt(a)) {
        return [];
    }
    if (a.isNaN() || !b.isFinite() || b.isNaN() || !b.isFinite()) {
        throw new Error('Invalid interval');
    }
    let len = b.sub(a);

    let minInterval = k0;

    if (constraints.minInterval) {
        let minMs = new Decimal(constraints.minInterval);
        if (minMs.lt(0) || minMs.isNaN() || !minMs.isFinite()) {
            throw new Error('Minimum interval must be finite and with a positive length');
        }
        minInterval = minMs;
    }

    if (constraints.minDuration) {
        let minMs = new Decimal(constraints.minDuration.asMilliseconds());
        if (minMs.lt(0) || minMs.isNaN() || !minMs.isFinite()) {
            throw new Error('Minimum duration must be finite and with a positive length');
        }
        if (minMs.gt(minInterval)) {
            minInterval = minMs;
        }
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
        throw new Error('Must specify either a minimum interval, or a minimum duration, or a maximum interval count');
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
        return linearTicks(
            start,
            end,
            {
                ...constraints,
                minInterval,
            }
        );
    }

    let unitConstraints: TickConstraints = {
        ...constraints,
        maxCount: undefined,
    }
    let bestTicks: Decimal[] = [];
    for (let i = minUnitAscIndex; i < kUnitsLength; i++) {
        // Try to get tick intervals with this unit
        let unit = kDateUnitsAsc[i];
        let minUnitDuration = minUnitDurations[unit] || 0;
        if (minUnitDuration === 0) {
            break;
        }
        let unitStart = snapDate(startDate, unit);
        let unitEnd = snapDate(endDate, unit);

        let uniformStart = floorDate(unitStart, minUnitDuration, unit);
        let uniformEnd = ceilDate(unitEnd, minUnitDuration, unit);
        let uniformDuration = uniformEnd.diff(uniformStart, unit);

        unitConstraints.minInterval = minUnitDuration;
        unitConstraints.radix = kDateUnitRadix[unit];
        let ticks = linearTicks(0, uniformDuration, unitConstraints)
            .map(x => {
                let date = uniformStart.clone().add(x.toNumber(), unit);
                if (unit === 'days') {
                    // In case of daylight savings, round the date
                    date = roundDateLinear(date, unit);
                }
                return new Decimal(date.valueOf());
            });
        if (!constraints.expand) {
            let iStart = unitStart.diff(uniformStart, unit);
            let iEnd = ticks.length - uniformEnd.diff(unitEnd, unit) / minUnitDuration;
            ticks = ticks.slice(iStart, iEnd);
        }
        if (ticks.length > 1) {
            bestTicks = ticks;
            break;
        } else if (ticks.length > bestTicks.length) {
            bestTicks = ticks;
        }
    }

    return bestTicks;
};
