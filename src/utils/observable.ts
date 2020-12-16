
export namespace Observable {

    export interface IObservable<T> {
        emit: (...args: any) => void;
        addObserver: (observer: T) => number;
        removeObserver: (id: number) => void;
    }

    export function create<T extends CallableFunction>(): IObservable<T> {
        let observers: T[] = [];
        let ids: number[] = [];
        let idCounter = 0;

        return {
            emit: (...args: any) => {
                for (let observer of observers) {
                    try {
                        observer(...args);
                    } catch (error) {
                        console.error('Uncaught error in observer: ' + (error?.message || error));
                    }
                }
            },
            addObserver: observer => {
                let id = (++idCounter);
                ids.push(id);
                observers.push(observer);
                return id;
            },
            removeObserver: id => {
                if (!id || id <= 0) {
                    return;
                }
                let i = ids.indexOf(id);
                if (i < 0) {
                    return;
                }
                ids.splice(i, 1);
                observers.splice(i, 1);
            },
        };
    };
}
