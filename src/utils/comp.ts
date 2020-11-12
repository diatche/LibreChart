import Decimal from 'decimal.js';
import isMatchWith from 'lodash.ismatchwith';

/**
 * Performs a partial deep comparison between object and source to
 * determine if object contains equivalent property values.
 * @param object The object to inspect.
 * @param source The object of property values to match.
 * @returns {boolean} Returns true if object is a match, else false.
 */
export const isMatch = (object: any, source: any): boolean => {
    return isMatchWith(object, source, _isMatchCompare);
}

const _isMatchCompare = (object: any, source: any): boolean | undefined => {
    if (
        typeof object === 'object' &&
        typeof source === 'object' &&
        object instanceof Decimal &&
        source instanceof Decimal
    ) {
        // Retain decimal precision during comparison
        return source.eq(object);
    }
    // Default lodash comparison
    return undefined;
};
