# Change Log

## main

Changes on the `main` branch, but not yet released, will be listed here.

### Bug Fixes

-   Fixed a bug where the axis background would not fill completely when an axis thickness was specified.

## 0.9.0

**27 Apr 2021**

### Bug Fixes

-   [[#39](https://github.com/diatche/LibreChart/pull/39)] Fixed applying and merging of scale layout styles.
-   [[#39](https://github.com/diatche/LibreChart/pull/39)]When zooming out, the plot no longer performs unecessary renders.
-   [[#39](https://github.com/diatche/LibreChart/pull/39)]`LineDataSource` now redraws after a small scale changes.

### Breaking Changes

-   [[#39](https://github.com/diatche/LibreChart/pull/39)]Using Evergrid v0.2.0. See [breaking changes](https://github.com/diatche/evergrid/blob/master/CHANGELOG.md#020).

## 0.8.0 - 0.8.2

**26 Apr 2021**

### Features

-   [[#36](https://github.com/diatche/LibreChart/pull/36)] `ILabelStyle` now has a `viewLayout` property, which contains `offset`, `size` and `anchor` properties.
-   [[#36](https://github.com/diatche/LibreChart/pull/36)] `ILabelStyle.textStyle` now takes animated values.
-   [[#36](https://github.com/diatche/LibreChart/pull/36)] Added `axisThickness` to `IAxisStyle`, which fixes the axis thickness to a value or animated value.

### Bug Fixes

-   [[#36](https://github.com/diatche/LibreChart/pull/36)] Text labels were not showing on iOS.
-   [[#36](https://github.com/diatche/LibreChart/pull/36)] Axes were not showing on iOS.
-   [[#37](https://github.com/diatche/LibreChart/pull/37)] Fixed an error related to `Text` component with some `LineDataSource` style configurations.
-   [[#38](https://github.com/diatche/LibreChart/pull/38)] When a background is specified on a label's `textStyle`, it no longer spans the whole item container width.
-   [[#38](https://github.com/diatche/LibreChart/pull/38)] Fixed merging of axis label text styles.

### Breaking Changes

-   [[#36](https://github.com/diatche/LibreChart/pull/36)] `LabelDataSource` now expects separate view and text alignments, specified by `ILabelStyle.viewLayout.anchor` and `ILabelStyle.align` respectively.
-   [[#36](https://github.com/diatche/LibreChart/pull/36)] Removed `viewOffset` from `ILabelStyle`. Use `viewLayout.offset` instead.
-   [[#36](https://github.com/diatche/LibreChart/pull/36)] Removed `numberOfLines` from `ILabelStyle`. Use `viewLayout.size` to limit the size.

## 0.7.1

**22 Apr 2021**

### Bug Fixes

-   Using default `@ungap/weakrefs` import path to avoid issues in native builds.

## 0.7.0

**15 Apr 2021**

### Features

-   [[#35](https://github.com/diatche/LibreChart/pull/35)] Added `align` to `ILabelStyle`, which allows setting an alignment edge for labels on the chart and axes.

### Breaking Changes

-   [[#35](https://github.com/diatche/LibreChart/pull/35)] Renamed `style` on `ILabelStyle` to `textStyle`.
-   [[#35](https://github.com/diatche/LibreChart/pull/35)] Removed axis style properties: `labelFontSize`, `labelMargin`, `labelFontWeight`, `labelColor` and their minor and major variants. These are now configured using: `labelStyle`, `majorLabelStyle`, `minorLabelStyle`.

## 0.6.0

**13 Apr 2021**

### Features

-   [[#27](https://github.com/diatche/LibreChart/pull/27)] When specifying an axes on a plot, passing `true` for an axis-type will add a default axis, and passing `false` or `undefined` for an axis-type will not add an axis.
-   [[#28](https://github.com/diatche/LibreChart/pull/28)] Moved content padding and hysteresis options from `AutoScaleController` to `ScaleController`, allowing `FixedScaleController` to be configured in the same way.
-   [[#32](https://github.com/diatche/LibreChart/pull/32)] Added `syncThickness` and `unsyncThickness` methods to `Axis`, which allow synchronizing multiple axes' thicknesses.
-   [[#33](https://github.com/diatche/LibreChart/pull/33)] The `Axis` configuration option `getTickLabel` now accepts custom render methods.
-   [[#34](https://github.com/diatche/LibreChart/pull/34)] Added `LabelDataSource` which allows adding text labels to the chart.

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
