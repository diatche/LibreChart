import moment, { Moment } from 'moment';
import {
    compareDateUnits,
    DateUnit,
    kDateNonUniform,
    smallerDateUnit,
} from './dateBase';

export const dateIntervalLength = (
    origin: Moment,
    date: Moment,
    unit: DateUnit,
): number => {
    let days = 0;
    if (compareDateUnits(unit, 'day') < 0) {
        // Unit is smaller than a day.
        // First find number of whole days in diff.
        days = date.diff(origin, 'day');
        if (days) {
            origin = origin.clone().add(days, 'day');
        }
    }

    // Find number of whole units
    let diff = date.diff(origin, unit);

    // Find number of partial units
    let partialStart = origin.clone().add(diff, unit);
    if (!partialStart.isSame(date)) {
        let partialDuration = moment.duration(date.diff(partialStart)).as(unit);
        diff += partialDuration;
    }

    if (days) {
        diff += moment.duration(days, 'day').as(unit);
    }

    return diff;
};

/**
 * Returns a date between the current unit (A) and 
 * the date after the next unit (B).
 * 
 * A step of 0 will return A, a step of 1 will return B,
 * and a step of 0.5 will return a date between A and B
 * using linear interpolation.
 * 
 * A step greater than 1 or less than 1 will use the
 * calendar to step.
 * 
 * @param date 
 * @param step 
 * @param unit 
 */
export const stepDateLinear = (
    date: Moment,
    step: number,
    unit: DateUnit,
): Moment => {
    if (Math.abs(step) > 1) {
        date = date.clone();

        // Step whole days
        if (compareDateUnits(unit, 'day') < 0) {
            // Unit is smaller than a day.
            // First step whole days
            let days = Math.floor(moment.duration(step, unit).asDays());
            if (days >= 1) {
                date.add(days, 'day');
                step -= moment.duration(days, 'day').as(unit);
            }
        }

        // Step whole units
        let calStep = step > 0
            ? Math.floor(step)
            : Math.ceil(step);
        date.add(calStep, unit);
        step -= calStep;
        if (step === 0) {
            return date;
        }
    }
    
    // Step partial units
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
    // TODO: use decimal for position
    let length = date2.diff(date1, 'ms');
    return date1.clone().add(position * length, 'ms');
};

/**
 * Returns the date nearest to the specified `date`
 * w.r.t. the specified date `unit`.
 * @param date 
 * @param unit 
 */
export const roundDateLinear = (date: Moment, unit: DateUnit): Moment => {
    return stepDateLinear(date, 0.5, unit).startOf(unit);
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
    if (value < 1 || value % 1 !== 0) {
        throw new Error('Rounding value must be a positive integer');
    }

    let {
        method = Math.round,
    } = options;

    let origin = getRoundingOriginDate(date, unit, options);

    let smallerUnit = smallerDateUnit(unit) || 'millisecond';
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
        // In case of DST, round one more time
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
    if (value < 1 || value % 1 !== 0) {
        throw new Error('Rounding value must be a positive integer');
    }
    if (value === 1) {
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
    let fDate = floorDate(date, value, unit, options);
    if (fDate.isSame(date)) {
        return fDate;
    }
    return fDate.add(value, unit);
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

export const getRoundingOriginUnit = (unit: DateUnit): DateUnit | undefined => {
    if (compareDateUnits(unit, 'second') < 0) {
        return 'second';
    } else if (compareDateUnits(unit, 'day') < 0) {
        return 'day';
    } else if (compareDateUnits(unit, 'year') < 0) {
        return 'year';
    }
    return undefined;
};

export const getRoundingOriginDate = (
    date: Moment,
    unit: DateUnit,
    options: { originUnit?: DateUnit } = {}
): Moment => {
    let {
        originUnit = getRoundingOriginUnit(unit),
    } = options;

    if (!originUnit) {
        // Use 1 CE in same time zone
        return date.clone().startOf('year').subtract(date.year());
    }

    return date.clone().startOf(originUnit);
};
