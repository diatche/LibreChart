import {
    IAnimationBaseOptions,
    IInsets,
    IPoint,
    weakref,
} from "evergrid";
import debounce from "lodash.debounce";
import { InteractionManager } from "react-native";
import { ScaleLayout } from "../internal";
import { Cancelable } from "../types";

export default abstract class ScaleController<T = any, D = any> {
    static updateDebounceInterval = 500;
    animationOptions?: IAnimationBaseOptions;

    private _min = 0;
    private _max = 0;
    private _scaleLayoutWeakRef = weakref<ScaleLayout<T, D>>();
    private _containerSize?: IPoint;

    get scaleLayout(): ScaleLayout<T, D> {
        return this._scaleLayoutWeakRef.getOrFail();
    }

    set scaleLayout(scaleLayout: ScaleLayout<T, D>) {
        if (!scaleLayout || !(scaleLayout instanceof ScaleLayout)) {
            throw new Error('Invalid scale layout');
        }
        this._scaleLayoutWeakRef.set(scaleLayout);
    }

    private get _maybeScaleLayout(): ScaleLayout<T, D> | undefined {
        return this._scaleLayoutWeakRef.get();
    }

    configure(scaleLayout: ScaleLayout<T, D>) {
        this.scaleLayout = scaleLayout;
        this.configureScaleController();
        this.setNeedsUpdate();
    }

    configureScaleController() {}

    unconfigure() {
        this.cancelUpdate();
    }

    setNeedsUpdate() {
        if (!this._wasContainerReady()) {
            // Update immediately
            this.update({
                animationOptions: {
                    animated: false,
                },
            });
        } else {
            // Avoid frequent updates
            this.scheduleUpdate();
        }
    }

    scheduleUpdate() {
        this._debouncedUpdate();
    }

    cancelUpdate() {
        if (this._interaction) {
            this._interaction.cancel();
            this._interaction = undefined;
        }
        this._debouncedUpdate.cancel();
    }

    private _interaction?: Cancelable;

    private _debouncedUpdate = debounce(
        () => {
            let plot = this._maybeScaleLayout?.plot;
            if (!plot) {
                return;
            }
            if (plot.isInteracting) {
                // Skip update during interaction
                this._interaction = InteractionManager.runAfterInteractions(() => {
                    this._interaction = undefined;
                    this.scheduleUpdate();
                });
            } else {
                this.update();
            }
        },
        ScaleController.updateDebounceInterval,
    );

    update(options?: { animationOptions?: IAnimationBaseOptions }) {
        this.cancelUpdate();

        let plot = this._maybeScaleLayout?.plot;
        if (!plot) {
            return;
        }
        let insets = plot.getAxisInsets();
        this._containerSize = plot.getContainerSize({ insets });
        if (!this._isContainerReady(this._containerSize)) {
            return;
        }

        let limits = this.getLimits(this._containerSize, insets);
        if (!limits) {
            return;
        }
        let [min, max] = limits;
        if (min === this._min && max === this._max) {
            return;
        }
        // console.debug(`Autoscaling min: ${min}, max: ${max}`);
        this._min = min;
        this._max = max;

        let baseOptions: IAnimationBaseOptions = {
            ...this.animationOptions,
            ...options?.animationOptions,
            onEnd: info => {
                if (!info.finished) {
                    // Reschedule update
                    this._min = 0;
                    this._max = 0;
                    this.setNeedsUpdate();
                }
                options?.animationOptions?.onEnd?.(info);
            },
        };

        if (max > min) {
            // Scroll and scale to range
            let pMin: Partial<IPoint> = {};
            let pMax: Partial<IPoint> = {};
            if (this.scaleLayout.isHorizontal) {
                pMin.x = min;
                pMax.x = max;
            } else {
                pMin.y = min;
                pMax.y = max;
            }
            this.scaleLayout.plot.scrollTo({
                ...baseOptions,
                range: [pMin, pMax],
            });
        } else {
            // Scroll to location
            let p: Partial<IPoint> = {};
            if (this.scaleLayout.isHorizontal) {
                p.x = -min;
            } else {
                p.y = -min;
            }
            this.scaleLayout.plot.scrollTo({
                ...baseOptions,
                offset: p,
            });
        }
    }

    abstract getLimits(
        containerSize: IPoint,
        insets: Partial<IInsets<number>>,
    ): [number, number] | undefined;

    private _wasContainerReady() {
        return this._isContainerReady(this._containerSize);
    }

    private _isContainerReady(size: IPoint | undefined): size is IPoint {
        return !!size ? size.x >= 1 && size.y >= 1 : false;
    }
}
