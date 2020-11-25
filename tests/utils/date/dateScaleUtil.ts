import moment from 'moment';
import DateScale, {
    IDateTickConstraints,
} from '../../../src/utils/date/DateScale';

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
    return new DateScale(constraints).getTicks(
        input.start,
        input.end,
        constraints
    ).map(({ value: date }) => date.format(input.format));
}
