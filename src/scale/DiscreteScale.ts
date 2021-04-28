import LinearScale from './LinearScale';
import { ITickScale, ITickScaleConstraints } from './Scale';

export default class DiscreteScale extends LinearScale {
    getTickScale(
        start: number,
        end: number,
        constraints?: ITickScaleConstraints<number>
    ): ITickScale<number> {
        start = Math.floor(start);
        return {
            origin: {
                value: start,
                location: start,
            },
            interval: {
                value: 1,
                location: 1,
            },
        };
    }
}
