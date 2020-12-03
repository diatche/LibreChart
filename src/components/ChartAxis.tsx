import React from 'react';
import {
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewProps,
    ViewStyle,
} from 'react-native';
import { ITickLabel } from '../types';
import {
    AxisType,
    AxisTypeMapping,
    IAxisContentStyle,
    IAxisOptions,
} from '../layout/axis/axisTypes';
import { ITickLocation } from '../scale/Scale';

export interface ChartAxisProps<T> extends ViewProps, Required<IAxisContentStyle> {
    axisType: AxisType;
    /** Tick locations in ascending order in content coordinates. */
    ticks: ITickLocation<T>[];
    majorTickLength: number;
    /** Set to `true` if the axis scale is negative. */
    isInverted: boolean;
    /** Called on thickness layout change. */
    onOptimalThicknessChange: (thickness: number) => void;
    /** Return a label for the tick. */
    getTickLabel: Required<IAxisOptions<T>>['getTickLabel'];
    /** The maximum label length in the direction of the axis */
    labelLength: number;
}

interface ChartAxisState {}

export default class ChartAxis<T> extends React.PureComponent<ChartAxisProps<T>, ChartAxisState> {

    getTickLabel(tick: ITickLocation<T>): ITickLabel {
        // TODO: cache labels until prop change
        try {
            let label = this.props.getTickLabel(tick);
            if (typeof label === 'string') {
                label = { title: label };
            }
            return label;
        } catch (error) {
            console.error('Uncaught error while getting tick label: ' + error.message);
            return { title: '' };
        }
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
        return [
            styles.container,
            axisStyles[this.props.axisType].container,
        ];
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
     * The label container style.
     * 
     * Holds inner label containers.
     */
    getLabelContainerStyle() {
        // TODO: cache style until prop change
        let style: ViewStyle = {};
        if (this.props.isInverted) {
            // Reverse label order
            switch (this.props.axisType) {
                case 'topAxis':
                case 'bottomAxis':
                    style = {
                        ...style,
                        flexDirection: 'row-reverse',
                    };
                    break;
                case 'leftAxis':
                case 'rightAxis':
                    style = {
                        ...style,
                        flexDirection: 'column-reverse',
                    };
                    break;
            }
        }
        switch (this.props.axisType) {
            case 'topAxis':
                style.paddingBottom = this.props.majorTickLength;
                break;
            case 'bottomAxis':
                style.paddingTop = this.props.majorTickLength;
                break;
            case 'leftAxis':
                style.paddingRight = this.props.majorTickLength;
                break;
            case 'rightAxis':
                style.paddingLeft = this.props.majorTickLength;
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

    getLabelStyle() {
        // TODO: cache style until prop change
        let style: TextStyle = {
            fontSize: this.props.labelFontSize,
            color: this.props.labelColor,
        };
        switch (this.props.axisType) {
            case 'topAxis':
            case 'bottomAxis':
                style.width = this.props.labelLength;
                style.marginHorizontal = -this.props.labelLength / 2;
                style.marginVertical = this.props.labelMargin;
                break;
            case 'leftAxis':
            case 'rightAxis':
                style.height = this.props.labelLength;
                style.marginHorizontal = this.props.labelMargin;
                style.marginVertical = -this.props.labelLength / 2;
                break;
        }
        return [styles.label, style];
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
        let labelStyle = this.getLabelStyle();
        let labels = this.getTickLabels();
        let labelInnerContainers: React.ReactNode[] = [];

        for (let i = 0; i < labels.length; i++) {
            labelInnerContainers.push((
                <View
                    key={i}
                    style={labelInnerContainerStyle}
                >
                    <Text style={[labelStyle, labels[i].style]}>
                        {labels[i].title}
                    </Text>
                </View>
            ));
        }
    
        return (
            <View style={this.getContainerStyle()}>
                <View
                    style={this.getInnerContainerStyle()}
                    onLayout={event => this.onInnerContainerLayout(event)}
                >
                    <View style={this.getLabelContainerStyle()}>
                        {labelInnerContainers}
                    </View>
                </View>
            </View>
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
    labelContainer: {
        flex: 1,
        justifyContent: 'space-around',
        // borderWidth: 2,
        // borderColor: 'rgba(100, 110, 230, 0.5)',
    },
    labelInnerContainer: {
        flex: 1,
        alignItems: 'center',
        // borderWidth: 2,
        // borderColor: 'rgba(100, 210, 130, 0.5)',
    },
    label: {
        width: '100%',
        textAlign: 'center',
        // borderWidth: 2,
        // borderColor: 'rgba(200, 110, 130, 0.5)',
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
        labelInnerContainer: {
            flexDirection: 'column-reverse',
        },
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
        labelInnerContainer: {
            flexDirection: 'column',
        },
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
        labelInnerContainer: {
            flexDirection: 'row-reverse',
        },
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
        labelInnerContainer: {
            flexDirection: 'row',
        },
    }),
};
