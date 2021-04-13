import React from 'react';
import {
    Animated,
    LayoutChangeEvent,
    StyleSheet,
    TextStyle,
    View,
    ViewProps,
    ViewStyle,
} from 'react-native';
import { ITickLabel, normalizedLabelSafe } from '../types';
import {
    AxisType,
    AxisTypeMapping,
    IAxisOptions,
    IAxisStyle,
} from '../layout/axis/axisTypes';
import { ITickVector } from '../scale/Scale';
import ChartLabel from './ChartLabel';
import { kDefaultAxisLabelAlignments } from '../const';

export interface ChartAxisContentProps<T>
    extends ViewProps,
        Required<IAxisStyle> {
    axisType: AxisType;
    /** Tick locations in ascending order in content coordinates. */
    ticks: ITickVector<T>[];
    /** Set to `true` if the axis scale is negative. */
    isInverted: boolean;
    /** Called on thickness layout change. */
    onOptimalThicknessChange: (thickness: number) => void;
    /** Return a label for the tick. */
    getTickLabel: IAxisOptions<T>['getTickLabel'];
    /** The maximum label length in the direction of the axis */
    labelLength: number;
    /**
     * The amount to offset labels so that they aligns with
     * tick marks.
     */
    labelOffset: number | Animated.Value | Animated.AnimatedInterpolation;
}

interface ChartAxisContentState {}

export default class ChartAxisContent<T> extends React.PureComponent<
    ChartAxisContentProps<T>,
    ChartAxisContentState
> {
    getTickLabel(tick: ITickVector<T>): ITickLabel {
        // TODO: cache labels until prop change
        return normalizedLabelSafe(this.props.getTickLabel(tick));
    }

    getTickLabels(): ITickLabel[] {
        // TODO: cache labels until prop change
        return this.props.ticks.map(x => this.getTickLabel(x));
    }

    /**
     * The outer container style.
     *
     * Draw's the background and axis line.
     */
    getContainerStyle() {
        // TODO: cache style until prop change
        return [styles.container, axisStyles[this.props.axisType].container];
    }

    /**
     * The inner container style.
     *
     * Holds all the tick and label containers
     * and distributes them.
     *
     * This container's dimensions are the optimal
     * for the axis.
     */
    getInnerContainerStyle() {
        // TODO: cache style until prop change
        return [
            styles.innerContainer,
            axisStyles[this.props.axisType].innerContainer,
        ];
    }

    /**
     * The tick container style.
     *
     * Holds ticks.
     */
    getTickContainerStyle() {
        // TODO: cache style until prop change
        return [
            styles.tickContainer,
            axisStyles[this.props.axisType].tickContainer,
        ];
    }

    /**
     * The label container style.
     *
     * Holds inner label containers.
     */
    getLabelContainerStyle() {
        // TODO: cache style until prop change
        let style: Animated.AnimatedProps<ViewStyle> = {};
        switch (this.props.axisType) {
            case 'topAxis':
            case 'bottomAxis':
                style.width = '100%';
                style.marginLeft = this.props.labelOffset;
                if (this.props.isInverted) {
                    style.flexDirection = 'row-reverse';
                }
                break;
            case 'leftAxis':
            case 'rightAxis':
                style.height = '100%';
                style.marginTop = this.props.labelOffset;
                if (this.props.isInverted) {
                    style.flexDirection = 'column-reverse';
                }
                break;
        }
        return [
            styles.labelContainer,
            axisStyles[this.props.axisType].labelContainer,
            style,
        ];
    }

    /**
     * The label inner container style.
     *
     * Holds labels.
     */
    getLabelInnerContainerStyle() {
        // TODO: cache style until prop change
        return [
            styles.labelInnerContainer,
            axisStyles[this.props.axisType].labelInnerContainer,
        ];
    }

    getTickStyle() {
        // TODO: cache style until prop change
        let style: ViewStyle = {
            backgroundColor: this.props.majorTickColor,
        };

        switch (this.props.axisType) {
            case 'topAxis':
            case 'bottomAxis':
                style = {
                    ...style,
                    width: this.props.majorTickThickness,
                    height: this.props.majorTickLength,
                };
                break;
            case 'leftAxis':
            case 'rightAxis':
                style = {
                    ...style,
                    width: this.props.majorTickLength,
                    height: this.props.majorTickThickness,
                };
                break;
        }

        return style;
    }

    getLabelStyle() {
        // TODO: cache style until prop change
        let style: TextStyle = {};
        switch (this.props.axisType) {
            case 'topAxis':
            case 'bottomAxis':
                style.width = this.props.labelLength;
                break;
            case 'leftAxis':
            case 'rightAxis':
                style.height = this.props.labelLength;
                break;
        }
        return [styles.label, this.props.labelStyle.textStyle, style];
    }

    onInnerContainerLayout(event: LayoutChangeEvent) {
        // This is the optimal axis size, ask to adjust layout
        let thickness = 0;
        switch (this.props.axisType) {
            case 'topAxis':
            case 'bottomAxis':
                thickness = event.nativeEvent.layout.height;
                break;
            case 'leftAxis':
            case 'rightAxis':
                thickness = event.nativeEvent.layout.width;
                break;
        }
        this.props.onOptimalThicknessChange(thickness);
    }

    render() {
        let labelInnerContainerStyle = this.getLabelInnerContainerStyle();
        let tickStyle = this.getTickStyle();
        let labelStyle = this.getLabelStyle();
        let labels = this.getTickLabels();

        let ticks: React.ReactNode[] = [];
        let labelInnerContainers: React.ReactNode[] = [];

        let labelAlignDefault = {
            ...kDefaultAxisLabelAlignments[this.props.axisType],
            ...this.props.labelStyle.align,
        };

        for (let i = 0; i < labels.length; i++) {
            const label = labels[i];
            ticks.push(<View key={i} style={tickStyle} />);

            labelInnerContainers.push(
                <ChartLabel
                    {...label}
                    alignX={label.align?.x || labelAlignDefault.x}
                    alignY={label.align?.y || labelAlignDefault.y}
                    textStyle={[labelStyle, label.textStyle]}
                    style={labelInnerContainerStyle}
                />
            );
        }

        return (
            <Animated.View style={this.getContainerStyle()}>
                <Animated.View
                    style={this.getInnerContainerStyle()}
                    onLayout={event => this.onInnerContainerLayout(event)}
                >
                    <Animated.View style={this.getTickContainerStyle()}>
                        {ticks}
                        <View style={styles.placeholder} />
                    </Animated.View>
                    <Animated.View style={this.getLabelContainerStyle()}>
                        {labelInnerContainers}
                    </Animated.View>
                </Animated.View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // margin: -2,
        // borderWidth: 2,
        // borderColor: 'rgba(200, 210, 130, 0.5)',
    },
    innerContainer: {
        // borderWidth: 2,
        // borderColor: 'rgba(100, 210, 230, 0.5)',
    },
    tickContainer: {
        justifyContent: 'space-between',
        // margin: -2,
        // borderWidth: 2,
        // borderColor: 'rgba(150, 70, 230, 0.5)',
    },
    labelContainer: {
        flex: 1,
        justifyContent: 'space-around',
        // margin: -2,
        // borderWidth: 2,
        // borderColor: 'rgba(100, 110, 230, 0.5)',
    },
    labelInnerContainer: {
        // borderWidth: 2,
        // borderColor: 'rgba(100, 210, 130, 0.5)',
    },
    label: {
        // borderWidth: 2,
        // borderColor: 'rgba(200, 110, 130, 0.5)',
    },
    placeholder: {
        width: 0,
        height: 0,
    },
});

const axisStyles: AxisTypeMapping<any> = {
    topAxis: StyleSheet.create({
        container: {
            width: '100%',
            flexDirection: 'column-reverse',
        },
        innerContainer: {
            flexDirection: 'column-reverse',
        },
        tickContainer: {
            flexDirection: 'row',
        },
        labelContainer: {
            flexDirection: 'row',
        },
        labelInnerContainer: {},
    }),
    bottomAxis: StyleSheet.create({
        container: {
            width: '100%',
            flexDirection: 'column',
        },
        innerContainer: {
            flexDirection: 'column',
        },
        tickContainer: {
            flexDirection: 'row',
        },
        labelContainer: {
            flexDirection: 'row',
        },
        labelInnerContainer: {},
    }),
    leftAxis: StyleSheet.create({
        container: {
            height: '100%',
            flexDirection: 'row-reverse',
        },
        innerContainer: {
            flexDirection: 'row-reverse',
        },
        tickContainer: {
            flexDirection: 'column',
        },
        labelContainer: {
            flexDirection: 'column',
            justifyContent: 'center',
        },
        labelInnerContainer: {},
    }),
    rightAxis: StyleSheet.create({
        container: {
            height: '100%',
            flexDirection: 'row',
        },
        innerContainer: {
            flexDirection: 'row',
        },
        tickContainer: {
            flexDirection: 'column',
        },
        labelContainer: {
            flexDirection: 'column',
            justifyContent: 'center',
        },
        labelInnerContainer: {},
    }),
};
