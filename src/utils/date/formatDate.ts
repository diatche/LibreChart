import moment, { Duration, Moment } from 'moment';
import {
    DateUnit,
    isDateUnit,
    kCalendaryUnitMomentMap,
    kDateUnitsDes,
    kDateUnitsLength,
} from './dateBase';
import {
    getCalendarFormat,
    is24Hour,
    isCurrentYear,
    longYearFormat,
} from './dateLocale';
import { dateUnitsWithDuration, snapDate } from './duration';

/**
 * Returns a localised date string up
 * to the specified date `unit`.
 *
 * ~~A `resolution` of `week` is a special case
 * and is handled the same as `day`.~~
 * @param options
 */
export const formatDate = (
    date: Moment,
    options: {
        unit?: moment.unitOfTime.All;
        now?: Moment;
        relativeDay?: boolean;
        showYear?: boolean;
        style?: 'compact' | 'long';
    },
): string => {
    const {
        relativeDay = false,
        style = 'compact',
        showYear,
        now = moment(),
    } = options;
    let unit = moment.normalizeUnits(options.unit as any) || 'hour';
    if (!isDateUnit(unit)) {
        throw new Error('Invalid date unit');
    }
    if (unit === 'millisecond') {
        throw new Error('Date unit not supported');
    }
    const cleanDate = snapDate(date, unit).startOf(unit);
    if (!cleanDate || !cleanDate.isValid()) {
        throw new Error('Invalid date');
    }
    const canRemoveYear =
        typeof showYear !== 'undefined'
            ? !showYear
            : isCurrentYear(cleanDate, now);
    const dateFormat = style === 'long' || canRemoveYear ? 'll' : 'L';

    const withoutCurrentYear = (dateFormat: string, timeFormat?: string) => {
        let cleanTimeFormat = timeFormat ? ', ' + timeFormat : '';
        let format = dateFormat + cleanTimeFormat;
        let str: string;
        if (relativeDay) {
            const calFormat = getCalendarFormat({
                dateFormat,
                timeFormat,
            });
            str = cleanDate.calendar(now, calFormat);
        } else {
            str = cleanDate.format(format);
        }
        if (canRemoveYear) {
            // TODO: Remove year from format instead
            let yearStr = cleanDate.format(longYearFormat());
            str = str.replace(', ' + yearStr, '');
            str = str.replace(' ' + yearStr, '');
            str = str.trim();
        }
        return str;
    };

    switch (unit) {
        case 'second':
            return withoutCurrentYear(dateFormat, 'LTS');
        case 'minute':
            return withoutCurrentYear(dateFormat, 'LT');
        case 'hour': {
            let str = withoutCurrentYear(dateFormat, 'LT');
            if (!is24Hour()) {
                // Clean up zeros
                str = str.replace(/:00/g, '');
            }
            return str;
        }
        case 'day':
            return withoutCurrentYear(dateFormat);
        case 'month': {
            return withoutCurrentYear('MMM ' + longYearFormat());
        }
        case 'year':
            return cleanDate.format(longYearFormat());
    }
};

/**
 * Creates a localized date string and
 * return only the parts of the date
 * that changed from the previous date.
 */
export const formatDateDelta = (
    date: Moment,
    duration: Duration,
    options: {
        now?: Moment;
        weekdays?: boolean;
    } = {},
): {
    title: string;
    unit?: DateUnit;
} => {
    if (!moment.isMoment(date) || !date.isValid()) {
        throw new Error('Invalid date');
    }
    if (!moment.isDuration(duration) || !duration.isValid()) {
        throw new Error('Invalid duration');
    }
    const { now = moment(), weekdays = false } = options;
    const [interval, unit] = dateUnitsWithDuration(duration);
    // date = floorDate(date, interval, unit);
    let previousDate = date.clone().subtract(duration);
    if (date.isSame(previousDate)) {
        return { title: '' };
    }

    let changedUnit: DateUnit = 'millisecond';
    let displayUnit: DateUnit = 'millisecond';

    for (let i = 0; i < kDateUnitsLength; i++) {
        let dateUnit = kDateUnitsDes[i];
        let momentUnit = kCalendaryUnitMomentMap[dateUnit];
        if (date.get(momentUnit) !== previousDate.get(momentUnit)) {
            // Largest unit to change
            changedUnit = dateUnit;
            break;
        }
    }
    let showYear = changedUnit === 'year';

    displayUnit = changedUnit;
    if (unit === 'day' && interval !== 1) {
        // Month edges are non-uniform
        displayUnit = 'day';
    }

    switch (displayUnit) {
        case 'millisecond': {
            return {
                title: `${Math.floor(date.milliseconds())}⁻³`,
                unit: changedUnit,
            };
        }
        case 'second':
            return {
                title: date.format('LTS'),
                unit: changedUnit,
            };
        case 'minute':
            return {
                title: date.format('LT'),
                unit: changedUnit,
            };
        case 'hour': {
            let str = date.format('LT');
            if (!is24Hour()) {
                // Clean up zeros
                str = str.replace(/:00/g, '');
            }
            return {
                title: str,
                unit: changedUnit,
            };
        }
        case 'day':
            // Day of month
            if (weekdays) {
                // Day of week
                return {
                    title: date.format('dd'),
                    unit: changedUnit,
                };
            } else {
                return {
                    title: formatDate(date, {
                        unit: 'day',
                        showYear,
                        now,
                        style: 'long',
                    }),
                    unit: changedUnit,
                };
            }
        case 'month':
            return {
                title: date.format('MMM'),
                unit: changedUnit,
            };
        case 'year':
            return {
                title: date.format(longYearFormat()),
                unit: changedUnit,
            };
    }
};

// /**
//  * Creates a localized date string and
//  * return only the parts of the date
//  * that changed from the previous date.
//  */
// export const formatDateDelta = (
//     date: Moment,
//     options: {
//         unit: moment.unitOfTime.All;
//         baseUnit?: moment.unitOfTime.All;
//         now?: Moment;
//         relativeDay?: boolean;
//     }
// ): string => {
//     const unit = moment.normalizeUnits(options.unit);
//     if (!isDateUnit(unit)) {
//         throw new Error('Invalid date unit');
//     }

//     let baseUnit = options.baseUnit && moment.normalizeUnits(options.baseUnit);
//     if (baseUnit && !isDateUnit(baseUnit)) {
//         throw new Error('Invalid base date unit');
//     }

//     const cleanDate = snapDate(date, unit).startOf(unit);
//     if (!cleanDate || !cleanDate.isValid()) {
//         throw new Error('Invalid date');
//     }

//     if (!baseUnit) {
//         switch (unit) {
//             case 'millisecond':
//                 // baseUnit = 'second';
//             case 'second':
//             case 'minute':
//             case 'hour':
//                 baseUnit = 'day';
//                 break;
//             case 'day':
//                 baseUnit = 'month';
//                 break;
//             // case 'week':
//             case 'month':
//                 baseUnit = 'year';
//                 break;
//             case 'year':
//                 break;
//         }
//     }

//     switch (baseUnit) {
//         case 'day': {
//             switch (unit) {
//                 case 'millisecond': {
//                     let timeFormat = moment.localeData().longDateFormat('LTS');
//                     return cleanDate.format(timeFormat + '.SSS');
//                 }
//                 case 'second':
//                     return cleanDate.format('LTS');
//                 case 'minute':
//                     return cleanDate.format('LT');
//                 case 'hour': {
//                     let str = cleanDate.format('LT');
//                     if (!is24Hour()) {
//                         // Clean up zeros
//                         str = str.replace(/:00/g, '');
//                     }
//                     return str;
//                 }
//                 default:
//                     break;
//             }
//             break;
//         }
//         case 'week': {
//             switch (unit) {
//                 case 'day':
//                     // Day of week
//                     return cleanDate.format('dd');
//                 default:
//                     break;
//             }
//             break;
//         }
//         case 'month': {
//             switch (unit) {
//                 case 'day':
//                     // Day of month
//                     let dateFormat = 'D';
//                     if (options.relativeDay) {
//                         const { now = moment() } = options;
//                         const calFormat = getCalendarFormat({
//                             dateFormat,
//                         });
//                         return cleanDate.calendar(now, calFormat);
//                     } else {
//                         return cleanDate.format(dateFormat);
//                     }
//                 default:
//                     break;
//             }
//             break;
//         }
//         case 'year': {
//             switch (unit) {
//                 // case 'week':
//                 //     return date.format('w');
//                 case 'month':
//                     return cleanDate.format('MMM');
//                 default:
//                     break;
//             }
//             break;
//         }
//         case undefined: {
//             switch (unit) {
//                 case 'year':
//                     return cleanDate.format(longYearFormat());
//                 default:
//                     break;
//             }
//             break;
//         }
//     }
//     throw new Error('Invalid resolution and period combination');
// };
