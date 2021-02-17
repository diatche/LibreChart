import { AxisType, AxisTypeMapping } from './axisTypes';
import {
    kAllAxisTypes,
    kAllAxisTypeSet,
    kHorizontalAxisTypes,
} from './axisConst';

export const isAxisType = (axisType: any): axisType is AxisType => {
    return kAllAxisTypeSet.has(axisType as any);
};

export const isAxisHorizontal = (axisType: AxisType) =>
    kHorizontalAxisTypes.indexOf(axisType) >= 0;

export function axisTypeMap<T>(
    iterator: (axisType: AxisType) => T,
): AxisTypeMapping<T> {
    let d: Partial<AxisTypeMapping<T>> = {};
    for (let axisType of kAllAxisTypes) {
        d[axisType] = iterator(axisType);
    }
    return d as AxisTypeMapping<T>;
}
