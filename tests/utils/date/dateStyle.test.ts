import moment from 'moment';
import {
    IAxisStyle,
} from '../../../src/utils/axisTypes';
import {
    kAxisStyleLightDefaults,
} from '../../../src/utils/axisConst';
import {
    getTickStyles,
} from '../../../src/utils/date/dateStyle';

describe('dateStyle', () => {

    describe('getTickStyles', () => {

        const axisStyle: IAxisStyle = {
            ...kAxisStyleLightDefaults,
            majorLabelColor: 'red',
            labelColor: 'green',
            minorLabelColor: 'blue',

            majorLabelFontWeight: '300',
            labelFontWeight: '200',
            minorLabelFontWeight: '100',
        };

        it('should style days normally with 1 day scale', () => {
            expect(getTickStyles(moment.duration(1, 'month'), axisStyle)).toEqual({
                color: 'red',
                labelFontWeight: '300',
            });

            expect(getTickStyles(moment.duration(1, 'day'), axisStyle)).toEqual({
                color: 'green',
                labelFontWeight: '200',
            });

            expect(getTickStyles(moment.duration(1, 'hour'), axisStyle)).toEqual({
                color: 'blue',
                labelFontWeight: '100',
            });
        });
    });
});
