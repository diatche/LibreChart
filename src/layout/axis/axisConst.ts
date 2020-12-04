import {
    AxisType,
    AxisTypeMapping,
    IAxisStyle,
    IAxisStyleInput,
} from "./axisTypes";
import { Colors } from '../../utils/colors';

export const kAxisContentReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxisContent',
    bottomAxis: 'bottomAxisContent',
    rightAxis: 'rightAxisContent',
    leftAxis: 'leftAxisContent',
};
export const kAxisContentReuseIDSet = new Set(Object.values(kAxisContentReuseIDs));

export const kAxisContentReuseIDTypes: { [reuseID: string]: AxisType } = {
    topAxisContent: 'topAxis',
    rightAxisContent: 'rightAxis',
    bottomAxisContent: 'bottomAxis',
    leftAxisContent: 'leftAxis',
};

export const kAxisBackgroundReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxisBackground',
    bottomAxis: 'bottomAxisBackground',
    rightAxis: 'rightAxisBackground',
    leftAxis: 'leftAxisBackground',
};
export const kAxisBackgroundReuseIDSet = new Set(Object.values(kAxisBackgroundReuseIDs));

export const kAxisBackgroundReuseIDTypes: { [reuseID: string]: AxisType } = {
    topAxisBackground: 'topAxis',
    rightAxisBackground: 'rightAxis',
    bottomAxisBackground: 'bottomAxis',
    leftAxisBackground: 'leftAxis',
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
