import { VectorUtil } from '../../src/utils/vectorUtil';

describe('VectorUtil', () => {
    describe('cohenSutherlandLineClip', () => {
        it('should return line intersection with top left corner of a square', () => {
            let line = VectorUtil.cohenSutherlandLineClip(
                1,
                1,
                3,
                5,
                2,
                2,
                4,
                4
            );
            expect(line).toEqual([2, 3, 2.5, 4]);
        });

        it('should return line partially inside of a square, intersecting the top', () => {
            let line = VectorUtil.cohenSutherlandLineClip(
                3,
                3,
                4,
                5,
                2,
                2,
                4,
                4
            );
            expect(line).toEqual([3, 3, 3.5, 4]);
        });

        it('should return line intersection with bottom right corner of a square', () => {
            let line = VectorUtil.cohenSutherlandLineClip(
                3,
                1,
                5,
                5,
                2,
                2,
                4,
                4
            );
            expect(line).toEqual([3.5, 2, 4, 3]);
        });

        it('should return line intersection with bottom and top edge of a rectangle', () => {
            let line = VectorUtil.cohenSutherlandLineClip(
                1,
                1,
                3,
                5,
                1,
                2.5,
                5,
                3.5
            );
            expect(line).toEqual([1.75, 2.5, 2.25, 3.5]);
        });

        it('should return nothing when outside of a square', () => {
            let line = VectorUtil.cohenSutherlandLineClip(
                1,
                1,
                3,
                5,
                3,
                2,
                4,
                3
            );
            expect(line).toBeUndefined();
        });

        it('should return nothing a point for a line rect', () => {
            let line = VectorUtil.cohenSutherlandLineClip(
                1,
                1,
                3,
                5,
                2,
                2,
                2,
                4
            );
            expect(line).toEqual([2, 3, 2, 3]);
        });
    });

    describe('rectsIntersect', () => {
        it('should intersect on the left', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 1, 0, 2, 2)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(1, 0, 2, 2, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should not intersect on the left', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 2, 0, 2, 2)
            ).toBeFalsy();
            expect(
                VectorUtil.rectsIntersect(2, 0, 2, 2, 0, 0, 2, 2)
            ).toBeFalsy();
        });

        it('should intersect on the right', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, -1, 0, 2, 2)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(-1, 0, 2, 2, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should not intersect on the right', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, -2, 0, 2, 2)
            ).toBeFalsy();
            expect(
                VectorUtil.rectsIntersect(-2, 0, 2, 2, 0, 0, 2, 2)
            ).toBeFalsy();
        });

        it('should intersect from the top', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 0, 1, 2, 2)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(0, 1, 2, 2, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should not intersect from the top', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 0, 2, 2, 2)
            ).toBeFalsy();
            expect(
                VectorUtil.rectsIntersect(0, 2, 2, 2, 0, 0, 2, 2)
            ).toBeFalsy();
        });

        it('should intersect from the bottom', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 0, -1, 2, 2)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(0, -1, 2, 2, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should not intersect from the bottom', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 0, -2, 2, 2)
            ).toBeFalsy();
            expect(
                VectorUtil.rectsIntersect(0, -2, 2, 2, 0, 0, 2, 2)
            ).toBeFalsy();
        });

        it('should intersect from the middle', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 1, 1, 1, 1)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(1, 1, 1, 1, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should intersect with y-infinite rect', () => {
            expect(
                VectorUtil.rectsIntersect(
                    0,
                    0,
                    2,
                    2,
                    -10,
                    -Infinity,
                    20,
                    Infinity
                )
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(
                    -10,
                    -Infinity,
                    20,
                    Infinity,
                    0,
                    0,
                    2,
                    2
                )
            ).toBeTruthy();

            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, -10, -10, 20, Infinity)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(-10, -10, 20, Infinity, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should not intersect with y-infinite rect', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, -10, 10, 20, Infinity)
            ).toBeFalsy();
            expect(
                VectorUtil.rectsIntersect(-10, 10, 20, Infinity, 0, 0, 2, 2)
            ).toBeFalsy();
        });

        it('should intersect with x-infinite rect', () => {
            expect(
                VectorUtil.rectsIntersect(
                    0,
                    0,
                    2,
                    2,
                    -Infinity,
                    -10,
                    Infinity,
                    20
                )
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(
                    -Infinity,
                    -10,
                    Infinity,
                    20,
                    0,
                    0,
                    2,
                    2
                )
            ).toBeTruthy();

            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, -10, -10, Infinity, 20)
            ).toBeTruthy();
            expect(
                VectorUtil.rectsIntersect(-10, -10, Infinity, 20, 0, 0, 2, 2)
            ).toBeTruthy();
        });

        it('should not intersect with x-infinite rect', () => {
            expect(
                VectorUtil.rectsIntersect(0, 0, 2, 2, 10, -10, Infinity, 20)
            ).toBeFalsy();
            expect(
                VectorUtil.rectsIntersect(10, -10, Infinity, 20, 0, 0, 2, 2)
            ).toBeFalsy();
        });
    });
});
