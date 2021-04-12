# Change Log

## main

Changes on the `main` branch, but not yet released, will be listed here.

### Features

-   [[#27](https://github.com/diatche/LibreChart/pull/27)] When specifying an axes on a plot, passing `true` for an axis-type will add a default axis, and passing `false` or `undefined` for an axis-type will not add an axis.
-   Moved content padding and hysteresis options from `AutoScaleController` to `ScaleController`, allowing `FixedScaleController` to be configured in the same way.

### Breaking Changes

-   The type `ScaleHysteresisFunction` is now `Hysteresis.StepFunc`.
-   `AutoScaleController` no longer adds content padding by default.
-   Content padding is now applied after `min` and `max` limits on scale controllers.

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
