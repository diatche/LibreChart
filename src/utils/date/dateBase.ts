import Decimal from "decimal.js";

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

/**
 * Number of milliseconds in a date unit when
 * forcing a uniform interval.
 */
export const kDateUnitUniformMs: DateUnitMapping<Decimal> = {
    millisecond: new Decimal(1),
    second: new Decimal(1000),      // 1000 ms
    minute: new Decimal(60000),     // 60 s
    hour: new Decimal(3600000),     // 60 m
    day: new Decimal(86400000),     // 24 h
    month: new Decimal(2592000000), // 30 d
    year: new Decimal(31104000000), // 12 M
};

export const kDateUnitRadix: Partial<DateUnitMapping<Decimal>> = {
    second: new Decimal(60),
    minute: new Decimal(60),
    hour: new Decimal(24),
    month: new Decimal(12),
};

// Factors of 12: 1, 2, 3, 4, 6, 12
const kExcludeFactors12 = [2, 4];

// Factors of 24: 1, 2, 3, 4, 6, 8, 12, 24
const kExcludeFactors24 = [2, 4, 8];

// Factors of 30: 1, 2, 3, 5, 6, 10, 15, 30
const kExcludeFactors30 = [3, 6, 15];

// Factors of 60: 1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60
const kExcludeFactors60 = [3, 5, 6, 12, 20];

export const kDateUnitExcludedFactors: Partial<DateUnitMapping<number[]>> = {
    second: kExcludeFactors60,
    minute: kExcludeFactors60,
    hour: kExcludeFactors24,
    day: kExcludeFactors30,
    month: kExcludeFactors12,
};

export const kDateNonUniform: Partial<DateUnitMapping<boolean>> = {
    month: true,
    year: true,
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
