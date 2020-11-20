import moment from 'moment';
import {
    DateTickConstraints,
    dateTicks,
} from '../../../src/utils/date/dateScale';

export interface DateTickInput {
    start: moment.Moment;
    end: moment.Moment;
    stride: moment.Duration;
    format: string;
    constraints?: DateTickConstraints;
    expectedOverrides?: {
        start?: moment.Moment;
        end?: moment.Moment;
    };
}

export const getExpectedDateTicks = (input: DateTickInput): string[] => {
    let start = input.expectedOverrides?.start || input.start;
    let end = input.expectedOverrides?.end || input.end;
    let { stride, format } = input;
    let expectedTicks: string[] = [];
    for (let i = start.clone(); i.isSameOrBefore(end); i.add(stride)) {
        let tick = i.format(format);
        expect(expectedTicks).not.toContain(tick);
        expectedTicks.push(tick);
    }
    expect(expectedTicks.length).toBeGreaterThan(0);
    return expectedTicks;
}

export const getDateTicks = (input: DateTickInput): string[] => {
    return dateTicks(
        input.start.valueOf(),
        input.end.valueOf(),
        input.constraints || {
            minDuration: input.stride,
        }
    ).map(x => moment(x.toNumber()).format(input.format));
}
