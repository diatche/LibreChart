import moment from 'moment';
import {
    IDateTickConstraints,
    dateTicks,
    encodeDate,
    decodeDate,
} from '../../../src/utils/date/dateScale';

export interface DateTickInput {
    start: moment.Moment;
    end: moment.Moment;
    stride: moment.Duration;
    format: string;
    constraints?: IDateTickConstraints;
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
    let constraints: IDateTickConstraints = {
        minDuration: input.stride,
        ...input.constraints,
    };
    return dateTicks(
        encodeDate(input.start, constraints),
        encodeDate(input.end, constraints),
        constraints
    ).map(x => (
        decodeDate(x, constraints).format(input.format)
    ));
}
