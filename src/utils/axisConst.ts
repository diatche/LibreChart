import {
    AxisType,
    AxisTypeMapping,
    IAxisStyle,
    IAxisStyleInput,
} from "./axisTypes";
import * as Colors from './colors';

export const kAxisReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxis',
    bottomAxis: 'bottomAxis',
    rightAxis: 'rightAxis',
    leftAxis: 'leftAxis',
};

export const kHorizontalAxisTypes: AxisType[] = [
    'topAxis',
    'bottomAxis',
];

export const kVerticalAxisTypes: AxisType[] = [
    'rightAxis',
    'leftAxis',
];

export const kAllAxisTypes = kHorizontalAxisTypes.concat(kVerticalAxisTypes);
export const kAllAxisTypeSet = new Set(kAllAxisTypes);

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
