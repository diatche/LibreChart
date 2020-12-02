import { TextStyle } from "react-native";
import { IAxisStyle } from "../../types";
import {
    DateUnit,
    DateUnitMapping,
    kDateUnitsAsc,
    kDateUnitsLength,
    kDateUnitUniformMs,
    mapDateUnits,
} from "./dateBase";
import { getUniformMs } from "./duration";

export const getTickStyles = (duration: moment.Duration, style: IAxisStyle): DateUnitMapping<TextStyle> => {
    // Find unit which has a normal loabel style
    let uniformMs = getUniformMs(duration);
    let normalIndex = 0;
    for (let i = 0; i < kDateUnitsLength; i++) {
        let dateUnit = kDateUnitsAsc[i];
        let unitDensity = uniformMs / kDateUnitUniformMs[dateUnit];
        // console.debug(`${dateUnit} unitDensity: ` + unitDensity);
        if (dateUnit === 'month') {
            if (unitDensity < 0.4) {
                break;   
            }
        }
        if (unitDensity < 0.25) {
            break;
        }
        normalIndex = i;
    }

    return mapDateUnits((dateUnit: DateUnit, index: number): TextStyle => {
        if (index > normalIndex) {
            return {
                color: style.majorLabelColor,
                fontWeight: style.majorLabelFontWeight,
            };
        } else if (index < normalIndex) {
            return {
                color: style.minorLabelColor,
                fontWeight: style.minorLabelFontWeight,
            };
        } else {
            return {
                color: style.labelColor,
                fontWeight: style.labelFontWeight,
            };
        }
    });
};
