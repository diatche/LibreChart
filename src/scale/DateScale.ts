import Decimal from 'decimal.js';
import moment, { Duration, Moment } from 'moment';
import Scale, {
    ITickScaleConstraints,
    IScaleOptions,
    ITickScale,
} from './Scale';
import {
    kDateUnitsAsc,
    kDateUnitsLength,
    kDateUnitRadix,
    DateUnit,
    mapDateUnits,
    isDateUnit,
    kDateUnitExcludedFactors,
    kDateUnitUniformDecimalMs,
    dateIntervalLength,
    dateUnitsWithDuration,
    floorDate,
    snapDate,
    stepDateLinear,
} from '../utils/date';
import LinearScale from './LinearScale';

const kZeroDate = moment.unix(0);
const kZeroDuration = moment.duration(0);

const kMaxStepFractionDenominator = 1000;

export interface IDateScaleOptions {
    /**
     * The scale's base unit. 1 interval
     * with this unit encodes to a length
     * of 1 when encoded. Defaults to `day`.
     */
    baseUnit?: DateUnit;

    /**
     * Location of the origin date. This
     * date encodes to zero.
     */
    originDate?: moment.Moment;

    /**
     * Specifies how small a unit duration
     * can be before it is discarded in favour
     * of a smaller unit.
     *
     * Smaller values will produce larger intervals.
     */
    minUnitDuration?: number;
}

type DateTickScaleType = ITickScale<Moment, Duration>;

export default class DateScale
    extends Scale<Moment, Duration>
    implements Required<IDateScaleOptions> {
    baseUnit: DateUnit;
    originDate: Moment;
    minUnitDuration: number;

    tickScale: ITickScale<Moment, Duration>;
    linearScale: LinearScale;

    maxStepFractionDenominator = kMaxStepFractionDenominator;

    constructor(
        options: IDateScaleOptions & IScaleOptions<Moment, Duration> = {},
    ) {
        super(options);

        let { baseUnit = 'day', minUnitDuration = 0.6, originDate } =
            options || {};
        if (!isDateUnit(baseUnit)) {
            throw new Error('Invalid base date unit');
        }
        if (originDate) {
            if (!moment.isMoment(originDate) || !originDate.isValid()) {
                throw new Error('Invalid origin date');
            }
        } else {
            // Use unix date with current time zone
            let thisYear = moment().startOf('year');
            originDate = thisYear.subtract(thisYear.year() - 1970, 'year');
        }

        this.baseUnit = baseUnit;
        this.originDate = originDate;
        this.minUnitDuration = minUnitDuration;
        this.linearScale = new LinearScale();

        this.tickScale = {
            origin: {
                value: originDate,
                location: 0,
            },
            interval: {
                value: moment.duration(1, baseUnit),
                location: 1,
            },
        };
    }

    emptyValue() {
        return kZeroDate;
    }
    emptyValueInterval() {
        return kZeroDuration;
    }

    getTickScale(
        startDate: Moment,
        endDate: Moment,
        constraints?: ITickScaleConstraints<Duration>,
    ): DateTickScaleType {
        if (endDate.isSameOrBefore(startDate)) {
            return this.emptyScale();
        }
        if (!endDate.isValid() || !startDate.isValid()) {
            throw new Error('Invalid interval');
        }

        constraints = {
            ...this.constraints,
            ...constraints,
        };

        let minIntervalTemp = 0;
        let minDuration = kZeroDuration;

        if (constraints.minInterval?.value) {
            let min = constraints.minInterval.value;
            if (
                !moment.isDuration(min) ||
                !min.isValid() ||
                min.asMilliseconds() <= 0
            ) {
                throw new Error(
                    'Minimum duration must be finite and with a positive length',
                );
            }
            minDuration = min;
        }

        if (constraints.minInterval?.location) {
            let min = constraints.minInterval.location;
            if (min < 0 || isNaN(min) || !isFinite(min)) {
                throw new Error(
                    'Minimum interval must be finite and with a positive length',
                );
            }
            minIntervalTemp = min;
        }

        if (constraints.maxCount) {
            let maxCount = constraints.maxCount;
            if (maxCount === 0) {
                return this.emptyScale();
            }
            if (maxCount < 0 || isNaN(maxCount)) {
                throw new Error(
                    'Max count must be greater than or equal to zero',
                );
            }
            let len = moment
                .duration(endDate.diff(startDate))
                .as(this.baseUnit);
            let min = len / maxCount;
            if (min > minIntervalTemp) {
                minIntervalTemp = min;
            }
        }

        // Convert min interval to duration
        if (minIntervalTemp !== 0) {
            let min = moment.duration(minIntervalTemp, this.baseUnit);
            if (min.asMilliseconds() > minDuration.asMilliseconds()) {
                minDuration = min;
            }
        }

        if (minDuration.asMilliseconds() === 0) {
            throw new Error(
                'Must specify either a minimum interval, or a minimum duration, or a maximum interval count',
            );
        }

        // Get durations in units
        let minUnitDurations = mapDateUnits(u => minDuration.as(u));

        /**
         * The largest non-zero unit of minInterval,
         * specified as an index of `kDateUnitsAsc`.
         **/
        let minUnitAscIndex = 0;
        for (let i = kDateUnitsLength - 1; i >= 0; i--) {
            let unit = kDateUnitsAsc[i];
            if (minUnitDurations[unit] >= this.minUnitDuration) {
                minUnitAscIndex = i;
                break;
            }
        }

        if (minUnitAscIndex === 0 && this.baseUnit === 'millisecond') {
            // Use linear scale.
            // Note that the minimum interval supported by moment
            // is 1 millisecond.
            let originDateMs = this.originDate.valueOf();
            let msStart = startDate.valueOf() - originDateMs;
            let msEnd = endDate.valueOf() - originDateMs;
            let minInterval = Math.max(1, minDuration.asMilliseconds());
            let linearScale = this.linearScale.getTickScale(msStart, msEnd, {
                minInterval: {
                    location: minInterval,
                },
            });
            let origin = linearScale.origin.location + originDateMs;
            return {
                origin: {
                    value: moment(origin),
                    location: origin,
                },
                interval: {
                    value: moment.duration(linearScale.interval.value),
                    location: linearScale.interval.location,
                },
            } as DateTickScaleType;
        }

        let unitLinearConstraints: ITickScaleConstraints<number> = {
            expand: constraints.expand,
        };
        for (let i = minUnitAscIndex; i < kDateUnitsLength; i++) {
            // Try to get tick intervals with this unit
            let unit = kDateUnitsAsc[i];
            let minUnitDuration = minUnitDurations[unit];
            if (minUnitDuration < this.minUnitDuration) {
                continue;
            }
            unitLinearConstraints.minInterval = {
                value: minUnitDuration,
            };
            unitLinearConstraints.radix = kDateUnitRadix[unit];
            unitLinearConstraints.excludeFactors =
                kDateUnitExcludedFactors[unit];

            let unitStart = snapDate(startDate, unit);
            let unitEnd = snapDate(endDate, unit);
            let tickStart = this._encodeDate(unitStart, unit);
            let tickEnd = this._encodeDate(unitEnd, unit);
            let linearScale = this.linearScale.getTickScale(
                tickStart,
                tickEnd,
                unitLinearConstraints,
            );
            if (linearScale.interval.value === 0) {
                continue;
            }
            return this._dateScaleWithLinearScale(linearScale, unit);
        }

        return this.emptyScale();
    }

    getDateScaleOrigin(date: Moment): Moment {
        return this.originDate || DateScale.epochWithTimeZone(date);
    }

    static epochWithTimeZone(date: Moment): Moment {
        return date.clone().startOf('year').subtract(date.year(), 'year');
    }

    addIntervalToValue(date: Moment, interval: Duration): Moment {
        let [value, unit] = dateUnitsWithDuration(interval);
        return stepDateLinear(date, value, unit);
    }

    floorValue(date: Moment): Moment {
        let [value, unit] = dateUnitsWithDuration(
            this.tickScale.interval.value,
        );
        return floorDate(date, value, unit, {
            originDate: this.tickScale.origin.value,
        });
    }

    locationOfValue(date: Moment): number {
        let [interval, unit] = dateUnitsWithDuration(
            this.tickScale.interval.value,
        );
        let steps =
            dateIntervalLength(this.tickScale.origin.value, date, unit) /
            interval;

        return this.stepLocation(this.tickScale.origin.location, steps);
    }

    valueAtLocation(location: number): Moment {
        let [interval, unit] = dateUnitsWithDuration(
            this.tickScale.interval.value,
        );
        let steps =
            ((location - this.tickScale.origin.location) /
                this.tickScale.interval.location) *
            interval;
        return stepDateLinear(this.tickScale.origin.value, steps, unit);
    }

    private _encodeDate(date: Moment, unit: DateUnit): number {
        return dateIntervalLength(this.originDate, date, unit);
    }

    private _decodeDate(location: number, unit: DateUnit): Moment {
        return stepDateLinear(this.originDate, location, unit);
    }

    private _dateScaleWithLinearScale(
        linearScale: ITickScale<number>,
        unit: DateUnit,
    ): DateTickScaleType {
        if (linearScale.interval.value === 0) {
            return this.emptyScale();
        }

        let value = moment.duration(linearScale.interval.value, unit);

        let location = linearScale.interval.location;
        let locationOrigin = linearScale.origin.location;
        if (unit !== this.baseUnit) {
            // Re-scale interval
            let coef = kDateUnitUniformDecimalMs[unit].div(
                kDateUnitUniformDecimalMs[this.baseUnit],
            );

            let intervalFraction = new Decimal(linearScale.interval.value)
                .mul(coef)
                .toFraction(this.maxStepFractionDenominator);
            location = intervalFraction[0].div(intervalFraction[1]).toNumber();

            locationOrigin = this.snapLocation(
                coef.mul(linearScale.origin.value).toNumber(),
                {
                    origin: { location: 0 },
                    interval: { location },
                },
            );
        }

        return {
            origin: {
                value: this._decodeDate(linearScale.origin.value, unit),
                location: locationOrigin,
            },
            interval: {
                value,
                location,
            },
        } as DateTickScaleType;
    }

    isValue(value: any): value is Moment {
        return moment.isMoment(value);
    }

    isInterval(interval: any): interval is Duration {
        return moment.isDuration(interval);
    }

    isValueEqual(v1: Moment, v2: Moment): boolean {
        return v1.isSame(v2);
    }

    compareValues(a: Moment, b: Moment): number {
        return a.diff(b, this.baseUnit, true);
    }

    isIntervalEqual(i1: Duration, i2: Duration): boolean {
        return i1.asMilliseconds() === i2.asMilliseconds();
    }
}
