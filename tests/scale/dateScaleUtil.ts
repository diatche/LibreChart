import moment, { Moment } from 'moment';
import DateScale, { IDateScaleOptions } from '../../src/scale/DateScale';
import { ITickScaleConstraints } from '../../src/scale/Scale';

export interface DateTickInput {
    start: Moment;
    end: Moment;
    stride: moment.Duration;
    format: string;
    constraints?: IDateScaleOptions & ITickScaleConstraints<moment.Duration>;
    expectedOverrides?: {
        start?: Moment;
        end?: Moment;
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

export const getDateTicks = (input: DateTickInput & IDateScaleOptions): string[] => {
    let constraints: IDateScaleOptions & ITickScaleConstraints<moment.Duration> = {
        minInterval: {
            valueInterval: input.stride,
        },
        ...input.constraints,
    };
    return new DateScale(constraints).getTicks(
        input.start,
        input.end,
        constraints
    ).map(({ value: date }) => date.format(input.format));
}
