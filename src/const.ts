import { AxisTypeMapping } from "evergrid";

export const kPointReuseID = 'point';
export const kGridReuseID = 'grid';
export const kAxisReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxis',
    rightAxis: 'rightAxis',
    bottomAxis: 'bottomAxis',
    leftAxis: 'leftAxis',
};
