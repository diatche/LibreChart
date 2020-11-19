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

export const kDateNonUniform: Partial<DateUnitMapping<boolean>> = {
    months: true,
};

export const largerDateUnit = (unit: DateUnit): DateUnit | undefined => {
    let i = kDateUnitsDes.indexOf(unit);
    return i > 0 ? kDateUnitsDes[i - 1] : undefined;
};

export const smallerDateUnit = (unit: DateUnit): DateUnit | undefined => {
    let i = kDateUnitsAsc.indexOf(unit);
    return i > 0 ? kDateUnitsAsc[i - 1] : undefined;
};

/**
 * Returns:
 * 
 * - A positive number if `unit1` is larger than `unit2`;
 * - 0 if `unit1` is the same as `unit2`;
 * - A negative number if `unit1` is smaller than `unit2`;
 * - NaN if a unit is invalid.
 * 
 * To get an intuitive sense of the return value,
 * you can think of the comma between the
 * arguments as a minus sign.
 * 
 * @param unit1 
 * @param unit2 
 */
export const compareDateUnits = (unit1: DateUnit, unit2: DateUnit): number => {
    let i1 = kDateUnitsAsc.indexOf(unit1);
    if (i1 < 0) {
        return NaN;
    }
    let i2 = kDateUnitsAsc.indexOf(unit2);
    if (i2 < 0) {
        return NaN;
    }
    return i1 - i2;
};
