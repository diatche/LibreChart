import moment, { Moment } from 'moment';
import {
    DateUnit,
    largerDateUnit,
    linearStepDate,
} from './dateBase';

/**
 * Returns the date nearest to the specified `date`
 * w.r.t. the specified date `unit`.
 * @param date 
 * @param unit 
 */
export const roundDate = (date: Moment, unit: DateUnit): Moment => {
    return linearStepDate(date, 0.5, unit).startOf(unit);
};

export const floorDate = (date: Moment, unit: DateUnit): Moment => {
    return date.clone().startOf(unit);
};

export const ceilDate = (date: Moment, unit: DateUnit): Moment => {
    return floorDate(date, unit).add(1, unit);
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
    let smallerUnit = largerDateUnit(unit);
    if (smallerUnit) {
        let mRound = roundDate(m.clone(), unit);
        let mSmallerRound = roundDate(m.clone(), smallerUnit);
        if (mRound.isSame(mSmallerRound)) {
            m = mRound;
        }
    }
    return m;
};
