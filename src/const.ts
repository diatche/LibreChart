import {
    AxisType,
    axisTypeMap,
} from "evergrid";
import {
    IAxisStyle,
    IAxisStyleInput,
    IChartGridStyle,
    IChartGridStyleInput,
} from "./types";
import * as Colors from './utils/colors';

export const kPointReuseID = 'point';
export const kGridReuseID = 'grid';
export const kAxisReuseIDs = axisTypeMap(t => String(t));

export const kReuseIDAxes: { [reuseID: string]: AxisType } = {
    topAxis: 'topAxis',
    rightAxis: 'rightAxis',
    bottomAxis: 'bottomAxis',
    leftAxis: 'leftAxis',
};

export const kAxisStyleBaseDefaults: IAxisStyleInput = {
    axisLineThickness: 1,

    majorTickLength: 3,
    majorTickThickness: 1,

    majorGridLineDistanceMin: 50,

    minorGridLineDistanceMin: 10,
    minorIntervalCountMax: 5,

    labelFontSize: 12,
    labelMargin: 3,
    labelFontWeight: 'normal',
    majorLabelFontWeight: 'bold',
    minorLabelFontWeight: 'normal',
}

export const kAxisStyleLightDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.white,
    axisLineColor: Colors.grey400,

    majorTickColor: Colors.grey300,

    majorGridLineColor: Colors.grey300,

    minorGridLineColor: Colors.grey100,

    labelColor: Colors.grey600,
    majorLabelColor: Colors.grey800,
    minorLabelColor: Colors.grey400,
} as IAxisStyle;

export const kAxisStyleDarkDefaults = {
    ...kAxisStyleBaseDefaults,

    axisBackgroundColor: Colors.black,
    axisLineColor: Colors.grey600,

    majorTickColor: Colors.grey700,

    majorGridLineColor: Colors.grey700,

    minorGridLineColor: Colors.grey900,

    labelColor: Colors.grey400,
    majorLabelColor: Colors.grey200,
    minorLabelColor: Colors.grey600,
} as IAxisStyle;

export const kChartGridStyleBaseDefaults: IChartGridStyleInput = {
    majorGridLineThickness: 1,
    minorGridLineThickness: 1,
}

export const kChartGridStyleLightDefaults = {
    ...kChartGridStyleBaseDefaults,
    majorGridLineColor: Colors.grey300,
    minorGridLineColor: Colors.grey100,
} as IChartGridStyle;

export const kChartGridStyleDarkDefaults = {
    ...kChartGridStyleBaseDefaults,
    majorGridLineColor: Colors.grey700,
    minorGridLineColor: Colors.grey900,
} as IChartGridStyle;
