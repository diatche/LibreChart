import ScaleController, {
    ContentLimitOptions,
    ScaleControllerOptions,
} from './ScaleController';

// TODO: Support animated min, max

export interface FixedScaleOptions extends ScaleControllerOptions {
    min: number;
    max: number;
}

export default class FixedScaleController<
    T = any,
    D = any
> extends ScaleController<T, D> {
    readonly min: number;
    readonly max: number;

    constructor(options: FixedScaleOptions) {
        super(options);
        this.min = options.min || 0;
        this.max = options.max || 0;
    }

    getContentLimits(
        options: ContentLimitOptions,
    ): [number, number] | undefined {
        return [this.min, this.max];
    }
}
