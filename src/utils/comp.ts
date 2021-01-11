import Decimal from 'decimal.js';
import isMatchWith from 'lodash.ismatchwith';

export interface IMatcher<T = any> {
    isType: (x: any) => boolean;
    isEqual: (object: T, source: T) => boolean;
}

/**
 * Performs a partial deep comparison between object and source to
 * determine if object contains equivalent property values.
 * @param object The object to inspect.
 * @param source The object of property values to match.
 * @param matchers Custom equality matchers.
 * @returns {boolean} Returns true if object is a match, else false.
 */
export const isMatch = (object: any, source: any, matchers?: IMatcher[]): boolean => {
    if (!matchers) {
        return isMatchWith(object, source, () => undefined);
    }
    return isMatchWith(object, source, (object, source) => {
        for (let matcher of matchers) {
            if (matcher.isType(object) && matcher.isType(source)) {
                return matcher.isEqual(object, source);
            }
        }
        // Default lodash comparison
        return undefined;
    });
};
