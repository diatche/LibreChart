import Decimal from 'decimal.js';
import {
    AxisType,
    AxisTypeMapping,
} from 'evergrid';
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
import { IAxisStyle } from '../types';

export interface ChartAxisProps extends ViewProps, Required<IAxisStyle> {
    type: AxisType;
    /** Tick locations in ascending order in content coordinates. */
    tickLocations: Decimal[];
    /** Set to `true` if the axis scale is negative. */
    isInverted: boolean;
    /** Called on thickness layout change. */
    onOptimalThicknessChange: (thickness: number) => void;
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
        const {
            axisLineThickness,
        } = this.props;

        let style: ViewStyle = {
            borderColor: this.props.axisLineColor,
            backgroundColor: this.props.axisBackgroundColor,
        };

        switch (this.props.type) {
            case 'topAxis':
                style = {
                    ...style,
                    borderBottomWidth: axisLineThickness,
                    marginBottom: -axisLineThickness,
                };
            case 'bottomAxis':
                style = {
                    ...style,
                    borderTopWidth: axisLineThickness,
                    marginTop: -axisLineThickness,
                };
                break;
            case 'leftAxis':
                style = {
                    ...style,
                    borderRightWidth: axisLineThickness,
                    marginRight: -axisLineThickness,
                };
                break;
            case 'rightAxis':
                style = {
                    ...style,
                    borderLeftWidth: axisLineThickness,
                    marginLeft: -axisLineThickness,
                };
                break;
        }

        return [
            styles.container,
            axisStyles[this.props.type].container,
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
     * The tick container style.
     * 
     * Holds ticks.
     */
    getTickContainerStyle() {
        // TODO: cache style until prop change
        return [
            styles.tickContainer,
            axisStyles[this.props.type].tickContainer,
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
            switch (this.props.type) {
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
        return [
            styles.labelContainer,
            axisStyles[this.props.type].labelContainer,
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
            axisStyles[this.props.type].labelInnerContainer,
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

    getLabelStyle() {
        // TODO: cache style until prop change
        let style: TextStyle = {
            fontSize: this.props.labelFontSize,
            color: this.props.labelColor,
            margin: this.props.labelMargin,
        };
        return [styles.label, style];
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
        this.props.onOptimalThicknessChange(thickness);
    }

    render() {
        let labelInnerContainerStyle = this.getLabelInnerContainerStyle();
        let tickStyle = this.getTickStyle();
        let labelStyle = this.getLabelStyle();
        let labels = this.getLabels();

        let ticks: React.ReactNode[] = [];
        let labelInnerContainers: React.ReactNode[] = [];

        for (let i = 0; i < labels.length; i++) {
            ticks.push(<View key={i} style={tickStyle} />);

            labelInnerContainers.push((
                <View
                    key={i}
                    style={labelInnerContainerStyle}
                >
                    <Text style={labelStyle}>
                        {labels[i]}
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
                    <View style={this.getTickContainerStyle()}>
                        {ticks}
                    </View>
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
    tickContainer: {
        // flex: 1,
        justifyContent: 'space-around',
        // borderWidth: 2,
        // borderColor: 'rgba(150, 70, 230, 0.5)',
    },
    labelContainer: {
        flex: 1,
        // borderWidth: 2,
        // borderColor: 'rgba(100, 110, 230, 0.5)',
    },
    labelInnerContainer: {
        flex: 1,
        alignSelf: 'center',
        alignItems: 'center',
        // borderWidth: 2,
        // borderColor: 'rgba(100, 210, 130, 0.5)',
    },
    label: {
        // borderWidth: 2,
        // borderColor: 'rgba(200, 110, 130, 0.5)',
    }
});

const axisStyles: AxisTypeMapping<any> = {
    topAxis: StyleSheet.create({
        container: {
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
