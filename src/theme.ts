import {
    kChartGridStyleDarkDefaults,
    kChartGridStyleLightDefaults,
} from './const';
import {
    kAxisStyleDarkDefaults,
    kAxisStyleLightDefaults,
} from './layout/axis/axisConst';
import { IAxisStyle } from './layout/axis/axisTypes';
import { IChartGridStyle } from './types';
import { Colors } from './utils/colors';

type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export interface ChartTheme {
    backgroundColor?: string;
    axis?: IAxisStyle;
    grid?: IChartGridStyle;
}

export type PartialChartTheme = DeepPartial<ChartTheme>;

export const kDefaultLightChartTheme: Required<ChartTheme> = {
    backgroundColor: Colors.white,
    axis: kAxisStyleLightDefaults,
    grid: kChartGridStyleLightDefaults,
};

export const kDefaultDarkChartTheme: Required<ChartTheme> = {
    backgroundColor: Colors.black,
    axis: kAxisStyleDarkDefaults,
    grid: kChartGridStyleDarkDefaults,
};
