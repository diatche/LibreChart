import moment from 'moment';
import {
    IAxisStyle,
} from '../../../src/layout/axis/axisTypes';
import {
    kAxisStyleLightDefaults,
} from '../../../src/layout/axis/axisConst';
import {
    getTickStyles,
} from '../../../src/utils/date/dateStyle'
import { TextStyle } from 'react-native';

const strongStyle: TextStyle = {
    color: 'red',
    fontWeight: '300',
};

const regularStyle: TextStyle = {
    color: 'green',
    fontWeight: '200',
};

const subtleStyle: TextStyle = {
    color: 'blue',
    fontWeight: '100',
};

describe('dateStyle', () => {

    describe('getTickStyles', () => {

        const axisStyle: IAxisStyle = {
            ...kAxisStyleLightDefaults,
            majorLabelColor: strongStyle.color!,
            labelColor: regularStyle.color!,
            minorLabelColor: subtleStyle.color!,

            majorLabelFontWeight: strongStyle.fontWeight!,
            labelFontWeight: regularStyle.fontWeight!,
            minorLabelFontWeight: subtleStyle.fontWeight!,
        };

        it('should style correctly with 100 millisecond scale', () => {
            let styles = getTickStyles(moment.duration(100, 'millisecond'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(strongStyle);
            expect(styles['second']).toEqual(strongStyle);
            expect(styles['millisecond']).toEqual(regularStyle);
        });

        it('should style correctly with 200 millisecond scale', () => {
            let styles = getTickStyles(moment.duration(200, 'millisecond'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(strongStyle);
            expect(styles['second']).toEqual(strongStyle);
            expect(styles['millisecond']).toEqual(regularStyle);
        });

        it('should style correctly with 500 millisecond scale', () => {
            let styles = getTickStyles(moment.duration(500, 'millisecond'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(strongStyle);
            expect(styles['second']).toEqual(regularStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 1 second scale', () => {
            let styles = getTickStyles(moment.duration(10, 'second'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(strongStyle);
            expect(styles['second']).toEqual(regularStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 10 second scale', () => {
            let styles = getTickStyles(moment.duration(10, 'second'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(strongStyle);
            expect(styles['second']).toEqual(regularStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 20 second scale', () => {
            let styles = getTickStyles(moment.duration(20, 'second'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(regularStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 30 second scale', () => {
            let styles = getTickStyles(moment.duration(30, 'second'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(regularStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 1 minute scale', () => {
            let styles = getTickStyles(moment.duration(10, 'minute'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(regularStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 10 minute scale', () => {
            let styles = getTickStyles(moment.duration(10, 'minute'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(strongStyle);
            expect(styles['minute']).toEqual(regularStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 20 minute scale', () => {
            let styles = getTickStyles(moment.duration(20, 'minute'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(regularStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 30 minute scale', () => {
            let styles = getTickStyles(moment.duration(30, 'minute'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(regularStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 1 hour scale', () => {
            let styles = getTickStyles(moment.duration(1, 'hour'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(regularStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 3 hour scale', () => {
            let styles = getTickStyles(moment.duration(3, 'hour'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(strongStyle);
            expect(styles['hour']).toEqual(regularStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 12 hour scale', () => {
            let styles = getTickStyles(moment.duration(12, 'hour'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(regularStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 1 day scale', () => {
            let styles = getTickStyles(moment.duration(1, 'day'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(regularStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 2 day scale', () => {
            let styles = getTickStyles(moment.duration(1, 'day'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(regularStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 10 day scale', () => {
            let styles = getTickStyles(moment.duration(10, 'day'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(strongStyle);
            expect(styles['day']).toEqual(regularStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 20 day scale', () => {
            let styles = getTickStyles(moment.duration(20, 'day'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(regularStyle);
            expect(styles['day']).toEqual(regularStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 1 month scale', () => {
            let styles = getTickStyles(moment.duration(1, 'month'), axisStyle);

            expect(styles['year']).toEqual(strongStyle);
            expect(styles['month']).toEqual(regularStyle);
            expect(styles['day']).toEqual(subtleStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 3 month scale', () => {
            let styles = getTickStyles(moment.duration(3, 'month'), axisStyle);

            expect(styles['year']).toEqual(regularStyle);
            expect(styles['month']).toEqual(subtleStyle);
            expect(styles['day']).toEqual(subtleStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 6 month scale', () => {
            let styles = getTickStyles(moment.duration(6, 'month'), axisStyle);

            expect(styles['year']).toEqual(regularStyle);
            expect(styles['month']).toEqual(subtleStyle);
            expect(styles['day']).toEqual(subtleStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 1 year scale', () => {
            let styles = getTickStyles(moment.duration(1, 'year'), axisStyle);

            expect(styles['year']).toEqual(regularStyle);
            expect(styles['month']).toEqual(subtleStyle);
            expect(styles['day']).toEqual(subtleStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });

        it('should style correctly with 10 year scale', () => {
            let styles = getTickStyles(moment.duration(10, 'year'), axisStyle);

            expect(styles['year']).toEqual(regularStyle);
            expect(styles['month']).toEqual(subtleStyle);
            expect(styles['day']).toEqual(subtleStyle);
            expect(styles['hour']).toEqual(subtleStyle);
            expect(styles['minute']).toEqual(subtleStyle);
            expect(styles['second']).toEqual(subtleStyle);
            expect(styles['millisecond']).toEqual(subtleStyle);
        });
    });
});
