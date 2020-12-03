import {
    kAxisBackgroundReuseIDs,
    kAxisBackgroundReuseIDTypes,
    kAxisContentReuseIDs,
    kAxisContentReuseIDTypes,
} from '../../src/utils/axisConst';

describe('axisConst', () => {

    describe('kAxisContentReuseIDs, kAxisContentReuseIDTypes', () => {

        it('should reverse reuse IDs', () => {
            expect(kAxisContentReuseIDTypes[kAxisContentReuseIDs['bottomAxis']]).toBe('bottomAxis');
            expect(kAxisContentReuseIDTypes[kAxisContentReuseIDs['topAxis']]).toBe('topAxis');
            expect(kAxisContentReuseIDTypes[kAxisContentReuseIDs['leftAxis']]).toBe('leftAxis');
            expect(kAxisContentReuseIDTypes[kAxisContentReuseIDs['rightAxis']]).toBe('rightAxis');
        });
    });

    describe('kAxisBackgroundReuseIDs, kAxisBackgroundReuseIDTypes', () => {

        it('should reverse reuse IDs', () => {
            expect(kAxisBackgroundReuseIDTypes[kAxisBackgroundReuseIDs['bottomAxis']]).toBe('bottomAxis');
            expect(kAxisBackgroundReuseIDTypes[kAxisBackgroundReuseIDs['topAxis']]).toBe('topAxis');
            expect(kAxisBackgroundReuseIDTypes[kAxisBackgroundReuseIDs['leftAxis']]).toBe('leftAxis');
            expect(kAxisBackgroundReuseIDTypes[kAxisBackgroundReuseIDs['rightAxis']]).toBe('rightAxis');
        });
    });
});
