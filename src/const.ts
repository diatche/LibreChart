import Decimal from "decimal.js";
import { AxisType, AxisTypeMapping } from "evergrid";
import { IAxisStyle, IChartGridStyle } from "./types";
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

export const kAxisStyleBaseDefaults: IAxisStyle = {
    axisLineThickness: 1,

    majorTickLength: 3,
    majorTickThickness: 1,

    majorGridLineDistanceMin: 50,

    minorGridLineDistanceMin: 10,

    labelFontSize: 12,
    labelMargin: 3,
}

export const kAxisStyleLightDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.white,
    axisLineColor: Colors.grey400,

    majorTickColor: Colors.grey300,

    majorGridLineColor: Colors.grey300,

    minorGridLineColor: Colors.grey100,

    labelColor: Colors.grey500,
} as Required<IAxisStyle>;

export const kAxisStyleDarkDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.black,
    axisLineColor: Colors.grey600,

    majorTickColor: Colors.grey700,

    majorGridLineColor: Colors.grey700,

    minorGridLineColor: Colors.grey900,

    labelColor: Colors.grey500,
} as Required<IAxisStyle>;

export const kChartGridStyleBaseDefaults: IChartGridStyle = {
    majorGridLineThickness: 1,
    minorGridLineThickness: 1,
}

export const kChartGridStyleLightDefaults = {
    ...kChartGridStyleBaseDefaults,
    majorGridLineColor: Colors.grey300,
    minorGridLineColor: Colors.grey100,
} as Required<IChartGridStyle>;

export const kChartGridStyleDarkDefaults = {
    ...kChartGridStyleBaseDefaults,
    majorGridLineColor: Colors.grey700,
    minorGridLineColor: Colors.grey900,
} as Required<IChartGridStyle>;
