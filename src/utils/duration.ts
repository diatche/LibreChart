import moment, { Moment } from 'moment';
import {
    compareDateUnits,
    DateUnit,
    kDateNonUniform,
    smallerDateUnit,
} from './dateBase';

/**
 * Returns the date nearest to the specified `date`
 * w.r.t. the specified date `unit`.
 * @param date 
 * @param unit 
 */
export const roundDateLinear = (date: Moment, unit: DateUnit): Moment => {
    return stepDateLinear(date, 0.5, unit).startOf(unit);
};

/**
 * Returns a date between the current unit (A) and 
 * the date after the next unit (B).
 * A step of 0 will return A, a step of 1 will return B,
 * and a step of 0.5 will return a date between A and B
 * using linear interpolation.
 * @param date 
 * @param step 
 * @param unit 
 */
export const stepDateLinear = (
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
    let length = date2.diff(date1, 'ms');
    return date1.clone().add(position * length, 'ms');
};

export const roundDate = (
    date: Moment,
    value: number,
    unit: DateUnit,
    options: {
        originUnit?: DateUnit;
        method?: (x: number) => number;
    } = {}
): Moment => {
    let {
        originUnit,
        method = Math.round,
    } = options;
    if (!originUnit) {
        if (compareDateUnits('seconds', unit) > 0) {
            originUnit = 'seconds';
        } else if (compareDateUnits('days', unit) > 0) {
            originUnit = 'days';
        } else if (compareDateUnits('years', unit) > 0) {
            originUnit = 'years';
        }
    }

    if (value < 1 || value % 1 !== 0) {
        throw new Error('Rounding value must be a positive integer');
    }

    let origin: moment.Moment;
    if (originUnit) {
        origin = date.clone().startOf(originUnit);
    } else {
        // Use 1 CE
        origin = date.clone().startOf('year').subtract(date.year());
    }

    let smallerUnit = smallerDateUnit(unit) || 'milliseconds';
    if (kDateNonUniform[unit]) {
        // Find matching period for non-uniform interval
        let periodStart = origin;
        let periodEdge = origin;
        let periodEnd = periodStart.clone().add(1, unit);
        let indexStart = 0;
        let indexEdge = 0;
        let indexEnd = 1;
        let dateIndex = -1;
        if (date.isSameOrAfter(periodStart) && date.isSameOrBefore(periodEnd)) {
            let periodLength = periodEnd.diff(periodStart, smallerUnit);
            dateIndex = date.diff(periodStart, smallerUnit) / periodLength + indexStart;
        } else {
            while (date.isAfter(periodStart) || indexStart % value !== 0) {
                periodStart = periodEnd;
                periodEnd = periodStart.clone().add(1, unit);
                indexStart = indexEnd;
                indexEnd += 1;
                if (date.isSameOrAfter(periodStart) && date.isSameOrBefore(periodEnd)) {
                    let periodLength = periodEnd.diff(periodStart, smallerUnit);
                    dateIndex = date.diff(periodStart, smallerUnit) / periodLength + indexStart;
                    break;
                }
            }
        }
        while (indexEnd % value !== 0) {
            periodEdge = periodEnd;
            periodEnd = periodEnd.clone().add(1, unit);
            indexEdge = indexEnd;
            indexEnd += 1;
            if (date.isSameOrAfter(periodEdge) && date.isSameOrBefore(periodEnd)) {
                let periodLength = periodEnd.diff(periodEdge, smallerUnit);
                dateIndex = date.diff(periodEdge, smallerUnit) / periodLength + indexEdge;
            }
        }
        if (dateIndex < indexStart || dateIndex > indexEnd) {
            throw new Error('Date rounding error');
        }
        // Round indexes instead of intervals
        let indexLength = indexEnd - indexStart;
        let dateRelativeIndex = dateIndex - indexStart;
        let roundedDateIndex = method(dateRelativeIndex / indexLength) * indexLength;
        let roundedDate = periodStart.clone().add(roundedDateIndex, unit);
        return roundedDate;
    } else {
        // Use ms with uniform interval
        let interval = moment.duration(value, unit).as(smallerUnit);
        let duration = date.diff(origin, smallerUnit) / interval;
        let roundedDuration = method(duration);
        let roundedDate = origin.clone().add(roundedDuration * interval, smallerUnit);
        // In case of daylight savings, round one more time
        roundedDate = roundDateLinear(roundedDate, unit);
        return roundedDate;
    }
};

export const floorDate = (
    date: Moment,
    value: number,
    unit: DateUnit,
    options: {
        originUnit?: DateUnit;
    } = {}
): Moment => {
    if (value <= 1) {
        return date.clone().startOf(unit);
    }
    return roundDate(date, value, unit, {
        ...options,
        method: Math.floor,
    });
};

export const ceilDate = (
    date: Moment,
    value: number,
    unit: DateUnit,
    options?: {
        originUnit?: DateUnit;
    }
): Moment => {
    return floorDate(date, value, unit, options).add(value, unit);
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
    let smallerUnit = smallerDateUnit(unit);
    if (smallerUnit) {
        let mRound = roundDateLinear(m.clone(), unit);
        let mSmallerRound = roundDateLinear(m.clone(), smallerUnit);
        if (mRound.isSame(mSmallerRound)) {
            m = mRound;
        }
    }
    return m;
};
