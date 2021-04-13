import { AxisType, AxisTypeMapping, IAxisStyle } from './axisTypes';
import { Colors } from '../../utils/colors';
import _ from 'lodash';
import { Animated } from 'react-native';

export const kAxisContentReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxisContent',
    bottomAxis: 'bottomAxisContent',
    rightAxis: 'rightAxisContent',
    leftAxis: 'leftAxisContent',
};

export const kAxisBackgroundReuseIDs: AxisTypeMapping<string> = {
    topAxis: 'topAxisBackground',
    bottomAxis: 'bottomAxisBackground',
    rightAxis: 'rightAxisBackground',
    leftAxis: 'leftAxisBackground',
};

export const kHorizontalAxisTypes: AxisType[] = ['topAxis', 'bottomAxis'];

export const kVerticalAxisTypes: AxisType[] = ['rightAxis', 'leftAxis'];

export const kAllAxisTypes = kHorizontalAxisTypes.concat(kVerticalAxisTypes);
export const kAllAxisTypeSet = new Set(kAllAxisTypes);

type IAxisDefaultStyle = IAxisStyle;
type IAxisDefaultBaseStyle = Omit<
    IAxisDefaultStyle,
    'axisBackgroundColor' | 'axisLineColor' | 'majorTickColor'
>;

export const kAxisStyleBaseDefaults: IAxisDefaultBaseStyle = {
    axisLineThickness: 1,

    majorTickLength: 3,
    majorTickThickness: 1,

    majorGridLineDistanceMin: 50,

    minorGridLineDistanceMin: 10,
    minorIntervalCountMax: 5,

    labelStyle: {
        align: {
            mainAxis: 'center',
            secondaryAxis: 'center',
        },
        textStyle: {
            fontSize: 12,
            padding: 3,
        },
    },
    majorLabelStyle: {
        textStyle: {
            fontWeight: 'bold',
        },
    },
    minorLabelStyle: {
        textStyle: {},
    },

    padding: new Animated.Value(0),
};

export const kAxisStyleLightDefaults: IAxisDefaultStyle = _.merge(
    {},
    kAxisStyleBaseDefaults,
    {
        axisBackgroundColor: Colors.white,
        axisLineColor: Colors.grey400,

        majorTickColor: Colors.grey300,

        labelStyle: {
            textStyle: {
                color: Colors.grey600,
            },
        },
        majorLabelStyle: {
            textStyle: {
                color: Colors.grey800,
            },
        },
        minorLabelStyle: {
            textStyle: {
                color: Colors.grey400,
            },
        },
    } as IAxisDefaultStyle
);

export const kAxisStyleDarkDefaults: IAxisDefaultStyle = _.merge(
    {},
    kAxisStyleBaseDefaults,
    {
        axisBackgroundColor: Colors.black,
        axisLineColor: Colors.grey600,

        majorTickColor: Colors.grey700,

        labelStyle: {
            textStyle: {
                color: Colors.grey400,
            },
        },
        majorLabelStyle: {
            textStyle: {
                color: Colors.grey200,
            },
        },
        minorLabelStyle: {
            textStyle: {
                color: Colors.grey600,
            },
        },
    } as IAxisDefaultStyle
);
