import moment, { Moment } from 'moment';

export type DateUnit =  'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
export type DateUnitMapping<T> = { [unit in DateUnit]: T };

export const kDateUnitsAsc: DateUnit[] = [
    'milliseconds',
    'seconds',
    'minutes',
    'hours',
    'days',
    'months',
    'years',
];
export const kDateUnitsDes = [...kDateUnitsAsc].reverse();
export const kUnitsLength = kDateUnitsAsc.length;
export const kSecondsIndexAsc = kDateUnitsAsc.indexOf('seconds');

export const kDateUnitRadix: Partial<DateUnitMapping<number>> = {
    seconds: 60,
    minutes: 60,
    hours: 24,
    months: 12,
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
