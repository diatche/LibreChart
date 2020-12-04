import {
    IChartGridStyle,
    IChartGridStyleInput,
} from "./types";
import { Colors } from './utils/colors';

export const kGridReuseID = 'grid';

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