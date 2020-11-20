import Decimal from "decimal.js";
import moment from 'moment';
import {
    TickConstraints,
} from "../baseScale";
import {
    DateUnitMapping,
    kDateUnitsAsc,
    kUnitsLength,
    kSecondsIndexAsc,
    kDateUnitRadix,
    DateUnit,
} from "./dateBase";
import {
    ceilDate,
    floorDate,
    snapDate,
} from "./duration";
import { linearTicks } from "../linearScale";

const k0 = new Decimal(0);
const kUnixEpoch = moment.unix(0);

/**
 * When specifying a minimum duration,
 * non-uniform durations, like months,
 * allow small rounding errors before
 * discarding the duration.
 */
const kMinDurationFilter = 0.9;

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

    baseUnit?: DateUnit;
    originDate?: moment.Moment;
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
export function dateTicks<TC extends DateTickConstraints = DateTickConstraints>(
    start: Decimal.Value,
    end: Decimal.Value,
    constraints: TC,
): Decimal[] {
    let a = new Decimal(start);
    let b = new Decimal(end);
    if (b.lt(a)) {
        return [];
    }
    if (a.isNaN() || !b.isFinite() || b.isNaN() || !b.isFinite()) {
        throw new Error('Invalid interval');
    }

    let {
        baseUnit = 'milliseconds',
        originDate = kUnixEpoch,
    } = constraints;

    let rescale = (baseUnit !== 'milliseconds') || !originDate.isSame(kUnixEpoch);

    let startDate: moment.Moment;
    let endDate: moment.Moment;
    if (rescale) {
        // Rescale
        startDate = originDate.add(a.toNumber(), baseUnit);
        endDate = originDate.add(b.toNumber(), baseUnit);
    } else {
        startDate = moment(a.toNumber());
        endDate = moment(b.toNumber());
    }
    if (!startDate.isValid() || !endDate.isValid()) {
        throw new Error('Invalid date interval');
    }

    let len = new Decimal(endDate.diff(startDate, baseUnit));
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

    if (typeof constraints.utcOffset !== 'undefined') {
        startDate.utcOffset(constraints.utcOffset);
        endDate.utcOffset(constraints.utcOffset);
    }

    // Get duration
    let minDuration = moment.duration(minInterval.toNumber());

    // Get durations in units
    let minUnitDurations: Partial<DateUnitMapping<number>> = {};
    for (let unit of kDateUnitsAsc) {
        let unitDuration = minDuration.as(unit);
        if (unitDuration >= kMinDurationFilter) {
            minUnitDurations[unit] = Math.ceil(unitDuration);
        }
    }

    /**
     * The largest non-zero unit of minInterval,
     * specified as an index of `kDateUnitsAsc`.
     **/
    let minUnitAscIndex = -1;
    for (let i = kUnitsLength - 1; i >= 0; i--) {
        let unit = kDateUnitsAsc[i];
        if (minUnitDurations[unit]) {
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
            .map(tick => {
                let date = uniformStart
                    .clone()
                    .add(tick.toNumber(), unit);
                let scaledTick: number;
                if (rescale) {
                    scaledTick = date.diff(originDate, baseUnit);
                } else {
                    scaledTick = date.valueOf();
                }
                return new Decimal(scaledTick);
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
}
