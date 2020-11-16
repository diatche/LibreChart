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

export const kAxisStyleBaseDefaults: IAxisStyle = {
    axisThickness: 1,

    majorTickLength: 3,
    majorTickThickness: 1,

    labelFontSize: 12,
    labelMargin: 3,
    getLabel: (value: Decimal) => value.toString(),
}

export const kAxisStyleLightDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.white,
    axisColor: Colors.grey300,

    majorTickColor: Colors.grey300,

    labelColor: Colors.grey500,
} as Required<IAxisStyle>;

export const kAxisStyleDarkDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.black,
    axisColor: Colors.grey700,

    majorTickColor: Colors.grey700,

    labelColor: Colors.grey500,
} as Required<IAxisStyle>;
