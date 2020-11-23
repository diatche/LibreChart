import Decimal from "decimal.js";
import moment, { Moment } from 'moment';
import {
    ITickConstraints,
} from "../baseScale";
import {
    kDateUnitsAsc,
    kUnitsLength,
    kDateUnitRadix,
    DateUnit,
    mapDateUnits,
    isDateUnit,
} from "./dateBase";
import {
    ceilDate,
    dateIntervalLength,
    floorDate,
    snapDate,
    stepDateLinear,
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
const kDurationSnapThreshold = 1 - kMinDurationFilter;

export interface IDateScale {
    baseUnit?: DateUnit;
    originDate?: moment.Moment;
}

export interface IDateScaleOptimized extends Required<IDateScale> {
    optimized: boolean;
    scaleModified: boolean;
}

/**
 * Date scale defaults.
 * 
 * To preserve origin date time zone, create the
 * origin date when optimizing the date scale.
 */
const kDefaultDateScale: Omit<
    Required<IDateScale>,
    'utcOffset' | 'originDate'
> = {
    baseUnit: 'milliseconds',
};

/**
 * Date tick calculation constraints and options.
 * 
 * Must specify either a `minInterval` (in milliseconds),
 * `minDuration`, or `maxCount`, or a combination of the three.
 * 
 * Automatically handles `radix`.
 */
export interface IDateTickConstraints extends ITickConstraints, IDateScale {
    /**
     * Allows specifying a minimum interval using
     * any date unit.
     * 
     * See [Moment.js Duration documentation](https://momentjs.com/docs/#/durations/)
     * for possible values.
     */
    minDuration?: moment.Duration;
}

export const encodeDate = (date: moment.Moment, dateScale: IDateScale): Decimal => {
    let scale = optimizeDateScale(dateScale);
    let value: number;
    if (scale.scaleModified) {
        value = dateIntervalLength(scale.originDate, date, scale.baseUnit);
    } else {
        value = date.valueOf();
    }
    return new Decimal(value);
};

export const decodeDate = (value: Decimal.Value, dateScale: IDateScale): moment.Moment => {
    let scale = optimizeDateScale(dateScale);
    let x = new Decimal(value);
    let date: moment.Moment;
    if (scale.scaleModified) {
        // Rescale
        date = stepDateLinear(scale.originDate, x.toNumber(), scale.baseUnit);
    } else {
        date = moment(x.toNumber());
    }
    if (!date.isValid()) {
        throw new Error('Unable to decode date');
    }
    return date;
};

export const optimizeDateScale = (scale?: IDateScale | IDateScaleOptimized): IDateScaleOptimized => {
    if (isDateScaleOptimized(scale)) {
        return scale;
    }
    let baseUnit = scale?.baseUnit || kDefaultDateScale.baseUnit;
    if (!isDateUnit(baseUnit)) {
        throw new Error('Invalid base date unit');
    }
    let originDate: moment.Moment;
    if (scale?.originDate) {
        originDate = scale?.originDate;
        if (!moment.isMoment(originDate) || !originDate.isValid()) {
            throw new Error('Invalid origin date');
        }
    } else {
        // Use unix date with current time zone
        let thisYear = moment().startOf('year');
        originDate = thisYear.subtract(thisYear.year() - 1970, 'year');
    }
    let dateScale: IDateScaleOptimized = {
        baseUnit,
        originDate,
        optimized: true,
        scaleModified: false,
    };
    dateScale.scaleModified = (dateScale.baseUnit !== 'milliseconds')
        || !dateScale.originDate.isSame(kUnixEpoch);
    return dateScale;
};

export const epochWithTimeZone = (date: moment.Moment): moment.Moment => {
    return date.clone().startOf('year').subtract(date.year(), 'years');
};

export const getDateScaleOrigin = (dateScale: IDateScale, date: moment.Moment): moment.Moment => {
    return optimizeDateScale(dateScale).originDate || epochWithTimeZone(date);
};

const isDateScaleOptimized = (dateScale?: any): dateScale is IDateScaleOptimized => {
    return dateScale?.optimized || false;
};

/**
 * Calculates optimal tick locations for dates given an
 * interval and constraints (see {@link DateTickConstraints}).
 *  
 * @param start The inclusive start of the date interval in milliseconds. 
 * @param end The inclusive end of the date interval in milliseconds.
 * @param constraints See {@link DateTickConstraints}
 * @returns An array of tick locations in milliseconds.
 */
export function dateTicks<TC extends IDateTickConstraints = IDateTickConstraints>(
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

    let dateScale = optimizeDateScale(constraints);
    let startDate = decodeDate(a, dateScale);
    let endDate = decodeDate(b, dateScale);
    let len = new Decimal(endDate.diff(startDate, dateScale.baseUnit));
    let minIntervalTemp = k0;
    let minDuration = moment.duration(0);

    if (constraints.minDuration) {
        let min = constraints.minDuration;
        if (!moment.isDuration(min) || !min.isValid() || min.asMilliseconds() <= 0) {
            throw new Error('Minimum duration must be finite and with a positive length');
        }
        minDuration = min;
    }

    if (constraints.minInterval) {
        let min = new Decimal(constraints.minInterval);
        if (min.lt(0) || min.isNaN() || !min.isFinite()) {
            throw new Error('Minimum interval must be finite and with a positive length');
        }
        minIntervalTemp = min;
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
        if (maxCountInterval.gt(minIntervalTemp)) {
            minIntervalTemp = maxCountInterval;
        }
    }

    // Convert min interval to duration
    if (!minIntervalTemp.eq(0)) {
        let min = moment.duration(minIntervalTemp.toNumber(), dateScale.baseUnit);
        if (min.asMilliseconds() > minDuration.asMilliseconds()) {
            minDuration = min;
        }
    }

    if (minDuration.asMilliseconds() === 0) {
        throw new Error('Must specify either a minimum interval, or a minimum duration, or a maximum interval count');
    }

    // Get durations in units
    let minUnitDurations = mapDateUnits(u => minDuration.as(u));

    /**
     * The largest non-zero unit of minInterval,
     * specified as an index of `kDateUnitsAsc`.
     **/
    let minUnitAscIndex = 0;
    for (let i = kUnitsLength - 1; i >= 0; i--) {
        let unit = kDateUnitsAsc[i];
        if (minUnitDurations[unit] >= kMinDurationFilter) {
            minUnitAscIndex = i;
            break;
        }
    }

    if (minUnitAscIndex === 0 && dateScale.baseUnit === 'milliseconds') {
        // Use linear scale
        return linearTicks(a, b, {
            minInterval: minDuration.asMilliseconds(),
        });
    }

    let unitConstraints: ITickConstraints = {}
    let bestTicks: Decimal[] = [];
    for (let i = minUnitAscIndex; i < kUnitsLength; i++) {
        // Try to get tick intervals with this unit
        let unit = kDateUnitsAsc[i];
        // We first snap the number to an integer, then
        // floor, because some intervals are non uniform.
        let minUnitDuration = Math.floor(
            snapNumber(minUnitDurations[unit], kDurationSnapThreshold)
        );
        if (minUnitDuration < kMinDurationFilter) {
            break;
        }
        let unitDateScale = optimizeDateScale({
            originDate: dateScale.originDate,
            baseUnit: unit,
        });
        unitConstraints.minInterval = minUnitDuration;
        unitConstraints.radix = kDateUnitRadix[unit];

        let unitStart = snapDate(startDate, unit);
        let unitEnd = snapDate(endDate, unit);

        let uniformStart = floorDate(unitStart, minUnitDuration, unit);
        let uniformEnd = ceilDate(unitEnd, minUnitDuration, unit);
        let uniformTickStart = encodeDate(uniformStart, unitDateScale);
        let uniformTickEnd = encodeDate(uniformEnd, unitDateScale);

        let uniformTicks = linearTicks(
            uniformTickStart,
            uniformTickEnd,
            unitConstraints
        );

        let ticks = uniformTicks;
        if (!constraints.expand) {
            // Filter out ticks outside of interval
            let tickStart = encodeDate(unitStart, unitDateScale);
            let tickEnd = encodeDate(unitEnd, unitDateScale);
            let iStart = uniformTicks.findIndex(x => x.gte(tickStart));
            if (iStart >= 0) {
                let iEnd = iStart + 1;
                for (let i = uniformTicks.length - 1; i > iStart; i--) {
                    let x = uniformTicks[i];
                    if (x.lte(tickEnd)) {
                        iEnd = i + 1;
                        break;
                    }
                }
                ticks = ticks.slice(iStart, iEnd);
            }
        }

        if (unitDateScale.baseUnit !== dateScale.baseUnit) {
            // Re-encode ticks
            ticks = ticks.map(x => {
                let date = decodeDate(x, unitDateScale);
                return encodeDate(date, dateScale);
            });
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

/**
 * Returns rounded `value` if within `threshold`,
 * otherwise returns the original `value`.
 * @param value 
 * @param threshold 
 */
const snapNumber = (value: number, threshold: number): number => {
    let roundedValue = Math.round(value);
    if (Math.abs(value - roundedValue) <= threshold) {
        return roundedValue;
    }
    return value;
}
