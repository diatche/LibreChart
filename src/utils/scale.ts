import Decimal from 'decimal.js';

const kMantissas = [1, 2, 5, 10].map(x => new Decimal(x));
const k10 = new Decimal(10);

export const ticks = (
    start: Decimal.Value,
    end: Decimal.Value,
    options?: {
        padding?: Decimal.Value;
        expand?: boolean;
    }
): Decimal[] => {
    let a = new Decimal(start);
    let b = new Decimal(end);
    if (b.lte(a) || a.isNaN() || !b.isFinite() || b.isNaN() || !b.isFinite()) {
        throw new Error('Interval must be finite and with a positive length');
    }
    let ab = b.sub(a);
    let exponent = k10.pow(Decimal.log10(ab).floor());

    type Base = {
        start: Decimal;
        end: Decimal;
        interval: Decimal;
        count: number;
    }

    let padding = new Decimal(options?.padding || 0);
    let hasPadding = !!options?.padding;
    if (hasPadding) {
        if (padding.eq(0)) {
            hasPadding = false;
        } else if (padding.lt(0) || padding.isNaN() || !padding.isFinite()) {
            throw new Error('Invalid padding');
        }
    }

    let bestRank = 0;
    let bestBase: Base | undefined;

    for (let i = 0; i < kMantissas.length; i++) {
        const mantissa = kMantissas[i];
        // const baseLogCount = kBaseLogCounts[i];
        let mStart = a.div(exponent).div(mantissa).floor().mul(mantissa);
        let mEnd = b.div(exponent).div(mantissa).ceil().mul(mantissa);
        let mLength = mEnd.sub(mStart);
        let tickCount = mLength.div(mantissa);
        let mInterval = mLength.div(tickCount);
        if (hasPadding && mInterval.mul(exponent).lt(padding) && !mantissa.eq(k10)) {
            continue;
        }
        let rank = mInterval.toString().length;
        if (bestRank === 0 || rank < bestRank) {
            bestRank = rank;
            bestBase = {
                start: mStart.mul(exponent),
                end: mEnd.mul(exponent),
                interval: mInterval.mul(exponent),
                count: tickCount.toNumber(),
            };
        }
    }

    if (!bestBase) {
        throw new Error('Failed to find tick interval');
    }

    if (options?.expand) {
        a = bestBase.start;
        b = bestBase.end;
    }

    let ticks: Decimal[] = [];
    for (let i = 0; i <= bestBase.count; i++) {
        let tick = bestBase.start.add(bestBase.interval.mul(i));
        if (tick.gte(a) && tick.lte(b)) {
            ticks.push(tick);
        }
    }
    return ticks;
};

export const zeroDecimalPoint = () => ({
    x: new Decimal(0),
    y: new Decimal(0),
});
