import Decimal from 'decimal.js';
import { ITickScaleConstraints } from '../../src/scale/Scale';
import LinearScale from '../../src/scale/LinearScale';

export interface LinearTickInput {
    start: Decimal.Value;
    end: Decimal.Value;
    stride: Decimal.Value;
    constraints?: ITickScaleConstraints<Decimal>;
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
    return new LinearScale().getTicks(
        $(input.start),
        $(input.end),
        input.constraints || {
            minInterval: {
                value: $(input.stride),
            },
        }
    ).map(x => x.value.toString());
}

export const $ = (x: Decimal.Value) => new Decimal(x);
