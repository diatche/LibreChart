import Decimal from 'decimal.js';
import {
    AxisType,
    AxisTypeMapping,
} from 'evergrid';
import React from 'react';
import {
    Animated,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewProps,
    ViewStyle,
} from 'react-native';
import { IAxisStyle } from '../types';

export interface ChartAxisProps extends ViewProps, Required<IAxisStyle> {
    type: AxisType;
    tickLocations: Decimal[];
    thickness$: Animated.Value;
    resizeAnimationDuration: number;
}

interface ChartAxisState {}

export default class ChartAxis extends React.PureComponent<ChartAxisProps, ChartAxisState> {

    getLabel(value: Decimal): string {
        // TODO: cache labels until prop change
        try {
            return this.props.getLabel(value);
        } catch (error) {
            console.error('Error in getLabel(): ' + error.message);
            return '';
        }
    }

    getLabels(): string[] {
        // TODO: cache labels until prop change
        return this.props.tickLocations.map(x => this.getLabel(x));
    }

    /**
     * The outer container style.
     * 
     * Draw's the background and axis line.
     */
    getContainerStyle() {
        // TODO: cache style until prop change
        let style: ViewStyle = {
            borderColor: this.props.axisColor,
            backgroundColor: this.props.axisBackgroundColor,
        };

        switch (this.props.type) {
            case 'topAxis':
                style = {
                    ...style,
                    // top: 0,
                    // left: 0,
                    // width: '100%',
                    borderBottomWidth: this.props.axisThickness,
                };
            case 'bottomAxis':
                style = {
                    ...style,
                    // bottom: 0,
                    // left: 0,
                    // width: '100%',
                    borderTopWidth: this.props.axisThickness,
                };
                break;
            case 'leftAxis':
                style = {
                    ...style,
                    // top: 0,
                    // left: 0,
                    // height: '100%',
                    borderRightWidth: this.props.axisThickness,
                };
                break;
            case 'rightAxis':
                style = {
                    ...style,
                    // top: 0,
                    // right: 0,
                    // height: '100%',
                    borderLeftWidth: this.props.axisThickness,
                };
                break;
        }

        return [
            styles.container,
            style,
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
            axisStyles[this.props.type].innerContainer,
        ];
    }

    /**
     * The tick and label container style.
     * 
     * Holds the inner tick and label container.
     */
    getTickContainerStyle() {
        // TODO: cache style until prop change
        return [
            styles.tickContainer,
            axisStyles[this.props.type].tickContainer,
        ];
    }

    /**
     * The tick and label inner container style.
     * 
     * Holds the tick and labels.
     */
    getTickInnerContainerStyle() {
        // TODO: cache style until prop change
        return [
            styles.tickInnerContainer,
            axisStyles[this.props.type].tickInnerContainer,
        ];
    }

    getTickStyle() {
        // TODO: cache style until prop change
        let style: ViewStyle = {
            backgroundColor: this.props.majorTickColor,
        };

        switch (this.props.type) {
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

    getLabelStyle(): TextStyle {
        // TODO: cache style until prop change
        return {
            fontSize: this.props.labelFontSize,
            color: this.props.labelColor,
            margin: this.props.labelMargin,
        };
    }

    onInnerContainerLayout(event: LayoutChangeEvent) {
        // This is the optimal axis size, ask to adjust layout
        let thickness = 0;
        switch (this.props.type) {
            case 'topAxis':
            case 'bottomAxis':
                thickness = event.nativeEvent.layout.height;
                break;
            case 'leftAxis':
            case 'rightAxis':
                thickness = event.nativeEvent.layout.width;
                break;
        }
        let duration = this.props.resizeAnimationDuration;
        if (duration > 0) {
            Animated.timing(this.props.thickness$, {
                toValue: thickness,
                duration,
                useNativeDriver: false,
            }).start();
        } else {
            this.props.thickness$.setValue(thickness);
        }
    }

    render() {
        let tickContainerStyle = this.getTickContainerStyle();
        let tickInnerContainerStyle = this.getTickInnerContainerStyle();
        let tickStyle = this.getTickStyle();
        let labelStyle = this.getLabelStyle();
        let labels = this.getLabels();

        let tickInnerContainers: React.ReactNode[] = [];
        for (let i = 0; i < labels.length; i++) {
            tickInnerContainers.push((
                <View
                    key={i}
                    style={tickContainerStyle}
                >
                    <View style={tickInnerContainerStyle}>
                        <View style={tickStyle} />
                        <Text style={labelStyle}>
                            {labels[i]}
                        </Text>
                    </View>
                </View>
            ));
        }
    
        return (
            <View style={this.getContainerStyle()}>
                <View
                    style={this.getInnerContainerStyle()}
                    onLayout={event => this.onInnerContainerLayout(event)}
                >
                    {tickInnerContainers}
                </View>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        // backgroundColor: 'red',
    },
    tickContainer: {
        flex: 1,
    },
    tickInnerContainer: {
        // alignContent: 'center',
        // justifyContent: 'center',
        // backgroundColor: 'red',
    },
    label: {
        textAlign: 'center',
    }
});

const axisStyles: AxisTypeMapping<any> = {
    topAxis: StyleSheet.create({
        returns: {
            flexDirection: 'row',
            // justifyContent: 
        },
        tickContainer: {
            bottom: 0,
        },
        tickInnerContainer: {
            flexDirection: 'column-reverse',
        },
    }),
    rightAxis: StyleSheet.create({
        innerContainer: {
            flexDirection: 'column',
        },
        tickContainer: {
            left: 0,
        },
        tickInnerContainer: {
            flexDirection: 'row',
        },
    }),
    bottomAxis: StyleSheet.create({
        innerContainer: {
            flexDirection: 'row',
        },
        tickContainer: {
            top: 0,
        },
        tickInnerContainer: {
            flexDirection: 'column',
        },
    }),
    leftAxis: StyleSheet.create({
        innerContainer: {
            flexDirection: 'column',
        },
        tickContainer: {
            right: 0,
        },
        tickInnerContainer: {
            flexDirection: 'row-reverse',
        },
    }),
};
