import moment from 'moment';
import {
    formatDateDelta,
} from '../../../src/utils/date/dateFormat';

describe('dateFormat', () => {

    describe('formatDateDelta', () => {

        it('should format whole months', () => {
            let label = formatDateDelta(
                moment('2020-02-01'),
                moment.duration(1, 'month'),
                { now: moment('2020-10-01') },
            );
            expect(label).toBe('Feb');
        });

        // it('should format partial months', () => {
        //     let label = formatDateDelta(
        //         moment('2020-02-01'),
        //         moment.duration(0.25, 'month'),
        //         { now: moment('2020-10-01') },
        //     );
        //     expect(label).toBe('Feb');
        // });
    });
});
