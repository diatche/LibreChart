
export type DateUnit =
    'millisecond'
    | 'second'
    | 'minute'
    | 'hour'
    | 'day'
    | 'month'
    | 'year';

export type DateUnitMapping<T> = { [unit in DateUnit]: T };
export type ImmutableDateUnitMapping<T> = { readonly [unit in DateUnit]: T };

export const kDateUnitsAsc: DateUnit[] = [
    'millisecond',
    'second',
    'minute',
    'hour',
    'day',
    'month',
    'year',
];
export const kDateUnitsDes = kDateUnitsAsc.slice().reverse();
export const kUnitsLength = kDateUnitsAsc.length;
export const kSecondsIndexAsc = kDateUnitsAsc.indexOf('second');

export const kDateUnitRadix: Partial<DateUnitMapping<number>> = {
    second: 60,
    minute: 60,
    hour: 24,
    month: 12,
};

export const kDateNonUniform: Partial<DateUnitMapping<boolean>> = {
    month: true,
};

export const isDateUnit = (unit: any): unit is DateUnit => {
    return kDateUnitsAsc.indexOf(unit as any) >= 0;
}

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

export const mapDateUnits = <T>(iterator: (dateUnit: DateUnit) => T): DateUnitMapping<T> => {
    let mapped: Partial<DateUnitMapping<T>> = {};
    for (let dateUnit of kDateUnitsAsc) {
        mapped[dateUnit] = iterator(dateUnit);
    }
    return mapped as DateUnitMapping<T>;
};
