import Decimal from "decimal.js";
import moment, { Duration, Moment } from 'moment';
import Scale, {
    ITickLocation,
    ITickConstraints,
    ITickInterval,
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
    kDateUnitUniformMs,
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
const kEmptyDuration = moment.duration(0);

export interface IDateScale {
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

/**
 * Date tick calculation constraints and options.
 * 
 * Must specify either a `minInterval` (in milliseconds),
 * `minDuration`, or `maxCount`, or a combination of the three.
 * 
 * Automatically handles `radix`.
 */
export interface IDateTickConstraints extends ITickConstraints, IDateScale {
    /**
     * Allows specifying a minimum interval using
     * any date unit.
     * 
     * See [Moment.js Duration documentation](https://momentjs.com/docs/#/durations/)
     * for possible values.
     */
    minDuration?: Duration;
}

type DateTickType = ITickLocation<Moment>;
type DateTickIntervalType = ITickInterval<Duration>;
type DateTickScaleType = ITickScale<Moment, Duration>;

export default class DateScale extends Scale<Moment, Duration, IDateTickConstraints> implements Required<IDateScale> {
    baseUnit: DateUnit;
    originDate: Moment;
    minUnitDuration: number;

    linearScale: LinearScale;

    constructor(
        options?: {
            defaults?: Partial<IDateTickConstraints>;
        } & IDateScale
    ) {
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
    }

    originValue() { return this.originDate.clone() };
    zeroValueInterval() { return kEmptyDuration };

    getTickScale(startDate: Moment, endDate: Moment, constraints: IDateTickConstraints): DateTickScaleType {
        if (endDate.isBefore(startDate)) {
            return this.emptyScale();
        }
        if (!endDate.isValid() || !startDate.isValid()) {
            throw new Error('Invalid interval');
        }
    
        constraints = {
            ...this.defaults,
            ...constraints,
        };

        let len = new Decimal(moment.duration(endDate.diff(startDate)).as(this.baseUnit));
        let minIntervalTemp = k0;
        let minDuration = moment.duration(0);
    
        if (constraints.minDuration) {
            let min = constraints.minDuration;
            if (!moment.isDuration(min) || !min.isValid() || min.asMilliseconds() <= 0) {
                throw new Error('Minimum duration must be finite and with a positive length');
            }
            minDuration = min;
        }
    
        if (constraints.minInterval) {
            let min = constraints.minInterval;
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
            let maxCountInterval = len.div(maxCount);
            if (maxCountInterval.gt(minIntervalTemp)) {
                minIntervalTemp = maxCountInterval;
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
            // Use linear scale
            let msStart = new Decimal(startDate.valueOf() - this.originDate.valueOf());
            let msEnd = new Decimal(endDate.valueOf() - this.originDate.valueOf());
            let linearScale = this.linearScale.getTickScale(msStart, msEnd, {
                minInterval: new Decimal(minDuration.asMilliseconds()),
            });
            return {
                origin: {
                    value: this.originValue(),
                    location: k0,
                },
                interval: {
                    valueInterval: moment.duration(linearScale.interval.valueInterval.toNumber()),
                    locationInterval: linearScale.interval.valueInterval,
                },
            } as DateTickScaleType;
        }
    
        let unitConstraints: ITickConstraints = {
            expand: constraints.expand,
        };
        let bestTicks: DateTickType[] = [];
        for (let i = kDateUnitsLength - 1; i >= minUnitAscIndex; i--) {
            // Try to get tick intervals with this unit
            let unit = kDateUnitsAsc[i];
            // We first snap the number to an integer, then
            // floor, because some intervals are non uniform.
            let minUnitDuration = minUnitDurations[unit];
            if (minUnitDuration < this.minUnitDuration) {
                continue;
            }
            let unitDateScaleOverrides: IDateScale | undefined = unit !== this.baseUnit
                ? { baseUnit: unit }
                : undefined;
            unitConstraints.minInterval = new Decimal(minUnitDuration);
            unitConstraints.radix = kDateUnitRadix[unit];
            unitConstraints.excludeFactors = kDateUnitExcludedFactors[unit];
    
            let unitStart = snapDate(startDate, unit);
            let unitEnd = snapDate(endDate, unit);
            let tickStart = this.encodeDate(unitStart, unitDateScaleOverrides);
            let tickEnd = this.encodeDate(unitEnd, unitDateScaleOverrides);
            let linearScale = this.linearScale.getTickScale(tickStart, tickEnd, unitConstraints);
            
            let tickDuration = kEmptyDuration;
            if (!linearScale.interval.valueInterval.isZero()) {
                tickDuration = moment.duration(linearScale.interval.valueInterval.toNumber(), unit);
            }

            let dateInterval: DateTickIntervalType;
            if (unitDateScaleOverrides) {
                // Re-scale interval
                let locationIntervalCoef = kDateUnitUniformMs[unit].div(kDateUnitUniformMs[this.baseUnit]);

                ticks = linearTicks.map(tick => {
                    let date = this.decodeDate(tick.value, unitDateScaleOverrides);
                    return {
                        value: date,
                        valueInterval: tickDuration,
                        location: this.encodeDate(date),
                        locationInterval: tick.locationInterval.mul(locationIntervalCoef),
                    } as DateTickType;
                });
            } else {
                ticks = linearTicks.map(tick => ({
                    value: this.decodeValue(tick.value),
                    valueInterval: tickDuration,
                    location: tick.location,
                    locationInterval: tick.locationInterval,
                } as DateTickType));
            }
            
            if (ticks.length > 1) {
                bestTicks = ticks;
                break;
            } else if (ticks.length > bestTicks.length) {
                bestTicks = ticks;
            }
        }
    
        return bestTicks;
    }

    getDateScaleOrigin(date: Moment): Moment {
        return this.originDate || DateScale.epochWithTimeZone(date);
    };

    static epochWithTimeZone(date: Moment): Moment {
        return date.clone().startOf('year').subtract(date.year(), 'year');
    };

    addIntervalToValue(value: Moment, interval: Duration): Moment {
        return value.clone().add(interval);
    }

    floorValue(date: Moment, interval: Duration): Moment {
        let [value, unit] = dateUnitsWithDuration(interval);
        return floorDate(date, value, unit);
    }

    encodeValue(date: Moment, scale: DateTickScaleType): Decimal {
        return this.encodeDate(date);
    }

    encodeDate(date: Moment, overrides?: IDateScale): Decimal {
        let value = dateIntervalLength(
            overrides?.originDate || this.originDate,
            date,
            overrides?.baseUnit || this.baseUnit,
        );
        return new Decimal(value);
    }

    decodeValue(value: Decimal, scale: DateTickScaleType): Moment {
        return this.decodeDate(value);
    }

    decodeDate(value: Decimal, overrides?: IDateScale): Moment {
        let x = new Decimal(value);
        let date = stepDateLinear(
            overrides?.originDate || this.originDate,
            x.toNumber(),
            overrides?.baseUnit || this.baseUnit,
        );
        if (!date.isValid()) {
            throw new Error('Unable to decode date');
        }
        return date;
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

    isIntervalEqual(i1: Duration, i2: Duration): boolean {
        return i1.asMilliseconds() === i2.asMilliseconds();
    }
}
