# Change Log

## main

Changes on the `main` branch, but not yet released, will be listed here.

## 0.6.0

**13 Apr 2021**

### Features

-   [[#27](https://github.com/diatche/LibreChart/pull/27)] When specifying an axes on a plot, passing `true` for an axis-type will add a default axis, and passing `false` or `undefined` for an axis-type will not add an axis.
-   [[#28](https://github.com/diatche/LibreChart/pull/28)] Moved content padding and hysteresis options from `AutoScaleController` to `ScaleController`, allowing `FixedScaleController` to be configured in the same way.
-   [[#32](https://github.com/diatche/LibreChart/pull/32)] Added `syncThickness` and `unsyncThickness` methods to `Axis`, which allow synchronizing multiple axes' thicknesses.
-   [[#33](https://github.com/diatche/LibreChart/pull/33)] The `Axis` configuration option `getTickLabel` now accepts custom render methods.

### Bug Fixes

-   [[#28](https://github.com/diatche/LibreChart/pull/28)] `AutoScaleController` max limit fixed.
-   [[#30](https://github.com/diatche/LibreChart/pull/30)] When using `pointInnerRadius` without `pointOuterRadius` on a `LineDataSource`, points were sometimes clipped before.
-   Axis labels are no longer selectable.

### Breaking Changes

-   [[#28](https://github.com/diatche/LibreChart/pull/28)] The type `ScaleHysteresisFunction` is now `Hysteresis.StepFunc`.
-   [[#28](https://github.com/diatche/LibreChart/pull/28)] `AutoScaleController` no longer adds content padding by default.
-   [[#28](https://github.com/diatche/LibreChart/pull/28)] Content padding is now applied after `min` and `max` limits on scale controllers.

## 0.5.0

**17 Mar 2021**

### Features

-   [[#26](https://github.com/diatche/LibreChart/pull/26)] Added `locale` property to `DateAxis`.

### Bug Fixes

-   [[#26](https://github.com/diatche/LibreChart/pull/26)] Added a workaround for `TypeError: Cannot add property ll, object is not extensible`. See [moment issue](https://github.com/moment/momentjs.com/issues/292).

## 0.4.0

**15 Mar 2021**

### Features

-   [[#25](https://github.com/diatche/LibreChart/pull/25)] Added `onThicknessChange()` and `onOptimalThicknessChange()` to `Axis`.

## 0.3.0

**11 Mar 2021**

### Features

-   Added `defaultMin` and `defaultMax` properties to `AutoScaleController`.

### Bug Fixes

-   [[#23](https://github.com/diatche/LibreChart/pull/23)] Fixed a bug where a single point in a line data source would not be displayed.

## 0.2.0

**18 Feb 2021**

### Features

-   [[#22](https://github.com/diatche/LibreChart/pull/22)] Added a `theme` prop, which propagates to all layout elements.

### Bug Fixes

-   Fixed a bug where background color of the chart could not be changed.

## 0.1.1

**17 Feb 2021**

### Bug Fixes

-   [[#21](https://github.com/diatche/LibreChart/issues/21)] Added a workaround for a bug where a data line is not shown when a gradient is used.
