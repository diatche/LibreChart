import Decimal from 'decimal.js';
import { ITickConstraints } from '../../src/utils/baseScale';
import {
    linearTicks,
} from '../../src/utils/linearScale';

export interface LinearTickInput {
    start: Decimal.Value;
    end: Decimal.Value;
    stride: Decimal.Value;
    constraints?: ITickConstraints;
}

export const getExpectedLinearTicks = (input: LinearTickInput): string[] => {
    let start = new Decimal(input.start);
    let end = new Decimal(input.end);
    let stride = new Decimal(input.stride);

    let expectedTicks: string[] = [];
    for (let i = start; i.lte(end); i = i.add(stride)) {
        let tick = i.toString();
        expect(expectedTicks).not.toContain(tick);
        expectedTicks.push(tick);
    }
    expect(expectedTicks.length).toBeGreaterThan(0);
    return expectedTicks;
}

export const getLinearTicks = (input: LinearTickInput): string[] => {
    return linearTicks(
        input.start.valueOf(),
        input.end.valueOf(),
        input.constraints || {
            minInterval: input.stride,
        }
    ).map(x => x.toString());
}
