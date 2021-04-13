import { StyleProp, TextStyle } from 'react-native';
import { IAxisStyle } from '../../layout/axis/axisTypes';
import {
    DateUnit,
    DateUnitMapping,
    kDateUnitsAsc,
    kDateUnitsLength,
    kDateUnitUniformMs,
    mapDateUnits,
} from './dateBase';
import { getUniformMs } from './duration';

export const getTickStyles = (
    duration: moment.Duration,
    style: IAxisStyle
): DateUnitMapping<StyleProp<TextStyle>> => {
    // Find unit which has a regular label style
    let uniformMs = getUniformMs(duration);
    let regularIndex = 0;
    let otherRegularIndex = -1;
    for (let i = 0; i < kDateUnitsLength; i++) {
        let dateUnit = kDateUnitsAsc[i];
        let unitDensity = uniformMs / kDateUnitUniformMs[dateUnit];
        if (unitDensity < 1 && dateUnit === 'month') {
            // Not full month, mark days as regular
            regularIndex = i - 1;
            let days = duration.as('days');
            if (days > 10) {
                // Too many days, mark month as regular as well
                otherRegularIndex = i;
            }
            break;
        }
        if (unitDensity < 0.25) {
            break;
        }
        regularIndex = i;
    }

    return mapDateUnits(
        (dateUnit: DateUnit, index: number): StyleProp<TextStyle> => {
            let labelStyle: StyleProp<TextStyle> = [style.labelStyle.textStyle];
            if (index === regularIndex || index === otherRegularIndex) {
                // Regular style
            } else if (index > regularIndex) {
                // Strong style
                labelStyle.push(style.majorLabelStyle.textStyle);
            } else {
                // Subtle style
                labelStyle.push(style.minorLabelStyle.textStyle);
            }
            return labelStyle;
        }
    );
};
