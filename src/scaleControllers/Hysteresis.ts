import Scale, { ITickScaleConstraints } from '../scale/Scale';

export namespace Hysteresis {
    export type StepFunc = (
        min: number,
        max: number,
        previousMin: number | undefined,
        previousMax: number | undefined,
    ) => [number, number] | null;

    export const none: StepFunc = () => null;

    export const step = (
        size: number,
        options: {
            origin?: number;
        } = {},
    ): StepFunc => {
        if (size <= 0) {
            throw new Error('Invalid step');
        }
        let { origin = 0 } = options;
        return (a, b) => [
            Math.floor((a - origin) / size) * size + origin,
            Math.ceil((b - origin) / size) * size + origin,
        ];
    };

    export function withScale<T = any, D = any>(scale: Scale<T, D>): StepFunc {
        let constraints: ITickScaleConstraints<D> = {
            expand: true,
        };
        return (a, b) => {
            scale.updateTickScale(
                scale.valueAtLocation(a),
                scale.valueAtLocation(b),
                constraints,
            );
            return scale.spanLocationRange(a, b);
        };
    }

    // export const log10 = (
    //     options: {
    //         step?: number;
    //         origin?: number;
    //     } = {},
    // ): ScaleHysteresisFunction => {
    //     let {
    //         step = 1,
    //         origin = 0,
    //     } = options;
    //     if (step <= 0) {
    //         throw new Error('Invalid stepCoef');
    //     }
    //     return (a, b) => {
    //         if (a === b) {
    //             // Zero range
    //             return null;
    //         }
    //         a -= origin;
    //         b -= origin;
    //         if (a > 0 && b < 0 || a < 0 && b > 0) {
    //             // Different sign
    //             return null;
    //         }
    //         let isNeg = a < 0;
    //         let sign = 1;
    //         let floor = Math.floor;
    //         let ceil = Math.ceil;
    //         if (isNeg) {
    //             sign = -1;
    //             a = -a;
    //             b = -b;
    //             floor = Math.ceil;
    //             ceil = Math.floor;
    //         }

    //         let al = Math.log10(a);
    //         if (step === 1) {
    //             al = floor(al);
    //         } else {
    //             let al0 = floor(al);
    //             al = floor((al - al0) / step) * step + al0;
    //         }

    //         let bl = Math.log10(b);
    //         if (step === 1 || !isFinite(bl)) {
    //             bl = ceil(bl);
    //         } else {
    //             let bl0 = floor(bl);
    //             bl = ceil((bl - bl0) / step) * step + bl0;
    //         }

    //         return [
    //             Math.pow(base, al) * sign + origin,
    //             Math.pow(base, bl) * sign + origin,
    //         ];
    //     };
    // };
}
