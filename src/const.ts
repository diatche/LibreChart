import Decimal from "decimal.js";
import { AxisType, AxisTypeMapping } from "evergrid";
import { IAxisStyle } from "./types";
import * as Colors from './utils/colors';

export const kPointReuseID = 'point';
export const kGridReuseID = 'grid';
export const kAxisReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxis',
    rightAxis: 'rightAxis',
    bottomAxis: 'bottomAxis',
    leftAxis: 'leftAxis',
};

export const kReuseIDAxes: { [reuseID: string]: AxisType } = {
    topAxis: 'topAxis',
    rightAxis: 'rightAxis',
    bottomAxis: 'bottomAxis',
    leftAxis: 'leftAxis',
};

export const kAxisDirection: AxisTypeMapping<'x' | 'y'> = {
    topAxis: 'x',
    rightAxis: 'y',
    bottomAxis: 'x',
    leftAxis: 'y',
};

export const kAxisCrossDirection: AxisTypeMapping<'x' | 'y'> = {
    topAxis: 'y',
    rightAxis: 'x',
    bottomAxis: 'y',
    leftAxis: 'x',
};

export const kAxisStyleBaseDefaults: IAxisStyle = {
    axisLineThickness: 1,
    axisResizeAnimationDuration: 200,

    majorTickLength: 3,
    majorTickThickness: 1,

    labelFontSize: 12,
    labelMargin: 3,
    getLabel: (value: Decimal) => value.toString(),
}

export const kAxisStyleLightDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.white,
    axisLineColor: Colors.grey400,

    majorTickColor: Colors.grey300,

    labelColor: Colors.grey500,
} as Required<IAxisStyle>;

export const kAxisStyleDarkDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.black,
    axisLineColor: Colors.grey600,

    majorTickColor: Colors.grey700,

    labelColor: Colors.grey500,
} as Required<IAxisStyle>;
