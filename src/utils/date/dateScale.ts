import Decimal from "decimal.js";
import moment, { Duration, Moment } from 'moment';
import Scale, {
    ITickScaleConstraints,
    IScaleOptions,
    ITickScale,
} from "../Scale";
import {
    kDateUnitsAsc,
    kDateUnitsLength,
    kDateUnitRadix,
    DateUnit,
    mapDateUnits,
    isDateUnit,
    kDateUnitExcludedFactors,
    kDateUnitUniformDecimalMs,
} from "./dateBase";
import {
    dateIntervalLength,
    dateUnitsWithDuration,
    floorDate,
    snapDate,
    stepDateLinear,
} from "./duration";
import LinearScale from "../LinearScale";

const k0 = new Decimal(0);
const k1 = new Decimal(1);
const kZeroDate = moment.unix(0);
const kZeroDuration = moment.duration(0);

const kMaxStepFractionDenominator = 1000;

export interface IDateScaleOptions {
    /**
     * The scale's base unit. 1 interval
     * with this unit encodes to a length
     * of 1 when encoded.
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

export default class DateScale extends Scale<Moment, Duration> implements Required<IDateScaleOptions> {
    baseUnit: DateUnit;
    originDate: Moment;
    minUnitDuration: number;

    tickScale: ITickScale<Moment, Duration>;
    linearScale: LinearScale;

    maxStepFractionDenominator = kMaxStepFractionDenominator;

    constructor(options?: IDateScaleOptions & IScaleOptions<Moment, Duration>) {
        super(options);

        let {
            baseUnit = 'millisecond',
            minUnitDuration = 0.5,
            originDate,
        } = options || {};
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
                location: k0,
            },
            interval: {
                valueInterval: moment.duration(1, baseUnit),
                locationInterval: k1,
            },
        }
    }

    zeroValue() { return kZeroDate; };
    zeroValueInterval() { return kZeroDuration };

    getTickScale(
        startDate: Moment,
        endDate: Moment,
        constraints?: ITickScaleConstraints<Duration>
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

        let minIntervalTemp = k0;
        let minDuration = kZeroDuration;
    
        if (constraints.minInterval?.valueInterval) {
            let min = constraints.minInterval.valueInterval;
            if (!moment.isDuration(min) || !min.isValid() || min.asMilliseconds() <= 0) {
                throw new Error('Minimum duration must be finite and with a positive length');
            }
            minDuration = min;
        }
    
        if (constraints.minInterval?.locationInterval) {
            let min = constraints.minInterval.locationInterval;
            if (min.lt(0) || min.isNaN() || !min.isFinite()) {
                throw new Error('Minimum interval must be finite and with a positive length');
            }
            minIntervalTemp = min;
        }
    
        let maxCount: Decimal | undefined;
        if (constraints.maxCount) {
            maxCount = constraints.maxCount;
            if (maxCount.eq(0)) {
                return this.emptyScale();
            }
            if (maxCount.lt(0) || maxCount.isNaN()) {
                throw new Error('Max count must be greater than or equal to zero');
            }
            let len = new Decimal(
                moment.duration(endDate.diff(startDate))
                    .as(this.baseUnit)
            );
            let min = len.div(maxCount);
            if (min.gt(minIntervalTemp)) {
                minIntervalTemp = min;
            }
        }
    
        // Convert min interval to duration
        if (!minIntervalTemp.eq(0)) {
            let min = moment.duration(minIntervalTemp.toNumber(), this.baseUnit);
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
            let originDateMs = new Decimal(this.originDate.valueOf());
            let msStart = new Decimal(startDate.valueOf()).sub(originDateMs);
            let msEnd = new Decimal(endDate.valueOf()).sub(originDateMs);
            let minInterval = Decimal.max(1, minDuration.asMilliseconds());
            let linearScale = this.linearScale.getTickScale(msStart, msEnd, {
                minInterval: {
                    valueInterval: minInterval,
                },
            });
            let origin = linearScale.origin.value.add(originDateMs);
            return {
                origin: {
                    value: moment(origin.toNumber()),
                    location: origin,
                },
                interval: {
                    valueInterval: moment.duration(linearScale.interval.valueInterval.toNumber()),
                    locationInterval: linearScale.interval.valueInterval,
                },
            } as DateTickScaleType;
        }
    
        let unitLinearConstraints: ITickScaleConstraints<Decimal> = {
            expand: constraints.expand,
        };
        for (let i = kDateUnitsLength - 1; i >= minUnitAscIndex; i--) {
            // Try to get tick intervals with this unit
            let unit = kDateUnitsAsc[i];
            // We first snap the number to an integer, then
            // floor, because some intervals are non uniform.
            let minUnitDuration = minUnitDurations[unit];
            if (minUnitDuration < this.minUnitDuration) {
                continue;
            }
            unitLinearConstraints.minInterval = {
                valueInterval: new Decimal(minUnitDuration),
            };
            unitLinearConstraints.radix = kDateUnitRadix[unit];
            unitLinearConstraints.excludeFactors = kDateUnitExcludedFactors[unit];
    
            let unitStart = snapDate(startDate, unit);
            let unitEnd = snapDate(endDate, unit);
            let tickStart = this._encodeDate(unitStart, unit);
            let tickEnd = this._encodeDate(unitEnd, unit);
            let linearScale = this.linearScale.getTickScale(
                tickStart,
                tickEnd,
                unitLinearConstraints,
            );
            if (linearScale.interval.valueInterval.isZero()) {
                continue;
            }
            return this._dateScaleWithLinearScale(linearScale, unit);
        }

        return this.emptyScale();
    }

    getDateScaleOrigin(date: Moment): Moment {
        return this.originDate || DateScale.epochWithTimeZone(date);
    };

    static epochWithTimeZone(date: Moment): Moment {
        return date.clone().startOf('year').subtract(date.year(), 'year');
    };

    addIntervalToValue(date: Moment, interval: Duration): Moment {
        let [value, unit] = dateUnitsWithDuration(interval);
        return stepDateLinear(date, value, unit);
    }

    floorValue(date: Moment): Moment {
        let [value, unit] = dateUnitsWithDuration(
            this.tickScale.interval.valueInterval
        );
        return floorDate(date, value, unit);
    }

    locationOfValue(date: Moment): Decimal {
        let [interval, unit] = dateUnitsWithDuration(
            this.tickScale.interval.valueInterval
        );
        let steps = new Decimal(dateIntervalLength(
            this.tickScale.origin.value,
            date,
            unit,
        )).div(interval);

        return this.stepLocation(
            this.tickScale.origin.location,
            steps,
        );
    }

    valueAtLocation(location: Decimal): Moment {
        let [interval, unit] = dateUnitsWithDuration(
            this.tickScale.interval.valueInterval
        );
        let steps = location.sub(this.tickScale.origin.location)
            .div(this.tickScale.interval.locationInterval)
            .mul(interval);
        return stepDateLinear(
            this.tickScale.origin.value,
            steps.toNumber(),
            unit
        );
    }

    private _encodeDate(
        date: Moment,
        unit: DateUnit,
    ): Decimal {
        let value = dateIntervalLength(this.originDate, date, unit);
        return new Decimal(value);
    }

    private _decodeDate(
        location: Decimal,
        unit: DateUnit,
    ): Moment {
        return stepDateLinear(
            this.originDate,
            location.toNumber(),
            unit,
        );
    }

    private _dateScaleWithLinearScale(
        linearScale: ITickScale<Decimal>,
        unit: DateUnit,
    ): DateTickScaleType {
        if (linearScale.interval.valueInterval.isZero()) {
            return this.emptyScale();
        }
        
        let valueInterval = moment.duration(linearScale.interval.valueInterval.toNumber(), unit);

        let locationInterval = linearScale.interval.locationInterval;
        let locationOrigin = linearScale.origin.value;
        if (unit !== this.baseUnit) {
            // Re-scale interval
            let coef = kDateUnitUniformDecimalMs[unit]
                .div(kDateUnitUniformDecimalMs[this.baseUnit]);

            let intervalFraction = linearScale.interval.locationInterval
                .mul(coef)
                .toFraction(this.maxStepFractionDenominator);
            locationInterval = intervalFraction[0].div(intervalFraction[1]);

            locationOrigin = this.snapLocation(
                linearScale.origin.value.mul(coef),
                {
                    origin: { location: k0 },
                    interval: { locationInterval },
                },
            );
        }

        return {
            origin: {
                value: this._decodeDate(linearScale.origin.value, unit),
                location: locationOrigin,
            },
            interval: {
                valueInterval,
                locationInterval,
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
