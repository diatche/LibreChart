import Decimal from 'decimal.js';
import { ITickConstraints } from '../../src/utils/baseScale';
import LinearScale from '../../src/utils/linearScale';

export interface LinearTickInput {
    start: Decimal.Value;
    end: Decimal.Value;
    stride: Decimal.Value;
    constraints?: ITickConstraints;
}

export const getExpectedLinearTicks = (input: LinearTickInput): string[] => {
    let start = $(input.start);
    let end = $(input.end);
    let stride = $(input.stride);

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
    return new LinearScale().getTickLocations(
        $(input.start),
        $(input.end),
        input.constraints || {
            minInterval: input.stride,
        }
    ).map(x => x.toString());
}

export const $ = (x: Decimal.Value) => new Decimal(x);
