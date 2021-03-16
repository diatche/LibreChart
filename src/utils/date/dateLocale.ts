import moment, { CalendarSpec, Moment } from 'moment';

let _localeData: {
    [locale: string]: {
        longYearFormat?: string;
        is24Hour?: boolean;
        monthFormatHasSuffix?: boolean;
        defaultCalendarFormatWithoutTime?: CalendarSpec;
        dateUnitFormatIndexTable?: { [unit: string]: number };
    };
} = {};

export const longYearFormat = (locale?: string) => {
    const fallbackFormat = 'YYYY';
    locale = locale || moment.locale();
    let yearFormat = _localeData[locale]?.longYearFormat || '';
    if (yearFormat) {
        return yearFormat;
    }
    let longDateFormat =
        moment.localeData(locale)?.longDateFormat?.('LL') || fallbackFormat;
    // Extract year and its tokens only
    yearFormat =
        longDateFormat.match(/[^MD,]*Y+[^MD,]*/g)?.[0] || fallbackFormat;
    yearFormat = yearFormat.trim();

    if (!_localeData[locale]) {
        _localeData[locale] = {};
    }
    _localeData[locale].longYearFormat = yearFormat;
    return yearFormat;
};

const CALENDAR_KEYS = [
    'sameDay',
    'nextDay',
    'lastDay',
    // 'nextWeek',
    // 'lastWeek',
    // 'sameElse',
];

export const getCalendarFormat = (
    options: {
        dateFormat?: string;
        timeFormat?: string;
        locale?: string;
    } = {},
): CalendarSpec | undefined => {
    const { dateFormat = 'L', timeFormat, locale = moment.locale() } = options;
    const defaultCal = defaultCalendarFormatWithoutTime(locale);
    if (!defaultCal) {
        return undefined;
    }
    const cleanTimeFormat = timeFormat ? ', ' + timeFormat : '';
    const format = dateFormat + cleanTimeFormat;
    return {
        sameDay: defaultCal.sameDay + cleanTimeFormat,
        nextDay: defaultCal.nextDay + cleanTimeFormat,
        lastDay: defaultCal.lastDay + cleanTimeFormat,
        nextWeek: format,
        lastWeek: format,
        sameElse: format,
    };
};

export const defaultCalendarFormatWithoutTime = (locale?: string) => {
    // const refDate = moment('2010-01-05 20:00');
    locale = locale || moment.locale();
    let cal = _localeData[locale]?.defaultCalendarFormatWithoutTime;
    if (cal) {
        return { ...cal };
    }
    const data = moment.localeData(locale);
    if (!data?.calendar) {
        return undefined;
    }

    // Remove time formats if present
    cal = {};
    for (let key of CALENDAR_KEYS) {
        let defaultFormat = data.calendar(key);
        let format = defaultFormat;
        if (defaultFormat.toLowerCase().indexOf('t') >= 0) {
            // Extract literal string without comma
            let matches = /\[([^, ]*).*\].*[T]/g.exec(defaultFormat) || [];
            let match = matches[1];
            if (match) {
                format = `[${match}]`;
            }
        }
        cal[key] = format;
    }

    if (!_localeData[locale]) {
        _localeData[locale] = {};
    }
    _localeData[locale].defaultCalendarFormatWithoutTime = cal;
    return cal;
};

export const is24Hour = (locale?: string) => {
    const fallbackValue = false;
    locale = locale || moment.locale();
    let is24Hour = _localeData[locale]?.is24Hour;
    if (typeof is24Hour !== 'undefined') {
        return is24Hour;
    }
    let data = moment.localeData(locale);
    if (!data?.isPM) {
        return fallbackValue;
    }
    let testString = moment('2010-01-05 22:00').format('LT');
    is24Hour = !testString.match(new RegExp(data.meridiem(20, 0, false), 'g'));

    if (!_localeData[locale]) {
        _localeData[locale] = {};
    }
    _localeData[locale].is24Hour = is24Hour;
    return is24Hour;
};

export const isCurrentYear = (date: Moment, now: Moment, locale?: string) => {
    if (now.year() !== date.year()) {
        return false;
    }
    // locale = locale || moment.locale();
    // if (!locale.startsWith('en')) {
    //     // Only en locales can be shortened
    //     return false;
    // }
    return true;
};

let _availableShortLocalizedDateFormat = '';

export const shortLocalizedDateFormat = () => {
    if (!_availableShortLocalizedDateFormat) {
        let format = 'll';
        try {
            // Sometimes moment gets frozen and you will see
            // "TypeError: Cannot add property ll, object is not extensible"
            // This has been observed in the browser an in React Native.
            // See https://github.com/moment/momentjs.com/issues/292
            moment().format(format);
        } catch (err) {
            console.warn(
                'Failed to format moment with "ll", falling back to "L". ' +
                    err,
            );
            format = 'L';
        }
        _availableShortLocalizedDateFormat = format;
    }
    return _availableShortLocalizedDateFormat;
};

/**
 * Whether the month spelling changes when printing
 * the month separately and with a day.
 * @param locale
 */
const monthFormatHasSuffix = (locale?: string): boolean => {
    const fallbackValue = false;
    locale = locale || moment.locale();
    let suffixed = _localeData[locale]?.monthFormatHasSuffix;
    if (typeof suffixed !== 'undefined') {
        return suffixed;
    }
    let data = moment.localeData(locale);
    if (!data?.isPM) {
        return fallbackValue;
    }
    suffixed = false;
    let date = moment('2010-01-12');
    const endDate = moment('2011-01-12');
    while (date.isBefore(endDate)) {
        let dateFormat = date.format('LL');
        let monthFormat = date.format('MMMM');
        if (dateFormat.indexOf(monthFormat) < 0) {
            // month different
            suffixed = true;
            break;
        }
        date.add(1, 'month');
    }

    if (!_localeData[locale]) {
        _localeData[locale] = {};
    }
    _localeData[locale].monthFormatHasSuffix = suffixed;
    return suffixed;
};

const DATE_UNIT_FORMAT_SYMBOL_TABLE: { [unit: string]: string } = {
    year: 'Y',
    month: 'M',
    day: 'D',
    hour: 'H',
    minute: 'm',
    second: 's',
    millisecond: 'S',
};
const DATE_UNIT_FORMAT_SYMBOL_UNIT = Object.keys(DATE_UNIT_FORMAT_SYMBOL_TABLE);
const DATE_UNIT_FORMAT_SYMBOL = Object.values(DATE_UNIT_FORMAT_SYMBOL_TABLE);
const DATE_UNIT_FORMAT_INDEX_TABLE_DEFAULT: { [unit: string]: number } = {
    year: 2,
    month: 1,
    day: 0,
    hour: 3,
    minute: 4,
    second: 5,
    millisecond: 6,
};

const _dateUnitFormatIndexTable = (
    locale?: string,
): { [unit: string]: number } => {
    locale = locale || moment.locale();
    let order = _localeData[locale]?.dateUnitFormatIndexTable;
    if (order) {
        return { ...order };
    }
    const data = moment.localeData(locale);
    const longDateFormat = data.longDateFormat('LLL');
    let orderedSymbols = longDateFormat
        .split(/[^a-zA-Z]/g)
        .filter(x => !!x)
        .map(x => x[0]);
    order = {};
    let lastOrderedIndex = 0;
    for (let i = 0; i < DATE_UNIT_FORMAT_SYMBOL.length; i++) {
        const symbol = DATE_UNIT_FORMAT_SYMBOL[i];
        let orderedIndex = orderedSymbols.indexOf(symbol);
        if (orderedIndex < 0) {
            // Assumes that time resolution gets smaller
            // for missing units
            orderedIndex = lastOrderedIndex + 1;
        }
        const unit = DATE_UNIT_FORMAT_SYMBOL_UNIT[i];
        order[unit] = orderedIndex;
        lastOrderedIndex = orderedIndex;
    }

    if (!_localeData[locale]) {
        _localeData[locale] = {};
    }
    _localeData[locale].dateUnitFormatIndexTable = order;
    return order;
};
