import { AxisType } from './layout/axis/axisTypes';
import { IChartGridStyle, IChartGridStyleInput, Alignment2D } from './types';
import { Colors } from './utils/colors';

export const kRefLayoutReuseID = 'ref';
export const kGridReuseID = 'grid';

export const kChartGridStyleBaseDefaults: IChartGridStyleInput = {
    majorGridLineThickness: 1,
    minorGridLineThickness: 1,
};

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

export const kDefaultAxisLabelAlignments: {
    [A in AxisType]: Alignment2D;
} = {
    topAxis: { x: 'center', y: 'bottom' },
    bottomAxis: { x: 'center', y: 'top' },
    leftAxis: { x: 'right', y: 'center' },
    rightAxis: { x: 'left', y: 'center' },
};
