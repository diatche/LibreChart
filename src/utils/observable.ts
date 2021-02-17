export namespace Observable {
    export interface IObservable<T = any> {
        emit: (...args: T[]) => void;
        addObserver: (callback: (...args: T[]) => any) => IObserver;
        removeObserver: (observer: IObserver) => void;
    }

    export interface IObserver {
        cancel: () => void;
    }

    export function create<T = any>(): IObservable<T> {
        let observers: ((...args: T[]) => any)[] = [];
        let ids: number[] = [];
        let idCounter = 0;

        return {
            emit: (...args: T[]) => {
                for (let observer of observers) {
                    try {
                        observer(...args);
                    } catch (error) {
                        console.error(
                            'Uncaught error in observer: ' +
                                (error?.message || error),
                        );
                    }
                }
            },
            addObserver: callback => {
                let id = ++idCounter;
                ids.push(id);
                observers.push(callback);
                return {
                    cancel: () => {
                        let i = ids.indexOf(id);
                        if (i < 0) {
                            return;
                        }
                        ids.splice(i, 1);
                        observers.splice(i, 1);
                    },
                };
            },
            removeObserver: observer => {
                observer.cancel();
            },
        };
    }
}
