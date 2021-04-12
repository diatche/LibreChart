declare module '@ungap/weakrefs/esm' {
    export class WeakRef<T> {
        constructor(value: T);
        deref(): T;
    }
}
