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
    /** Tick locations in ascending order in content coordinates. */
    tickLocations: Decimal[];
    /** Set to `true` if the axis scale is negative. */
    isInverted: boolean;
    thickness$: Animated.Value;
    resizeAnimationDuration: number;
}

interface ChartAxisState {}

export default class ChartAxis extends React.PureComponent<ChartAxisProps, ChartAxisState> {
    private _layoutThickness = 0;

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
            axisThickness,
        } = this.props;

        let style: ViewStyle = {
            borderColor: this.props.axisColor,
            backgroundColor: this.props.axisBackgroundColor,
        };

        switch (this.props.type) {
            case 'topAxis':
                style = {
                    ...style,
                    borderBottomWidth: axisThickness,
                    marginBottom: -axisThickness,
                };
            case 'bottomAxis':
                style = {
                    ...style,
                    borderTopWidth: axisThickness,
                    marginTop: -axisThickness,
                };
                break;
            case 'leftAxis':
                style = {
                    ...style,
                    borderRightWidth: axisThickness,
                    marginRight: -axisThickness,
                };
                break;
            case 'rightAxis':
                style = {
                    ...style,
                    borderLeftWidth: axisThickness,
                    marginLeft: -axisThickness,
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
            styles.innerContainer,
            axisStyles[this.props.type].innerContainer,
            style,
        ];
    }

    /**
     * The tick and label container style.
     * 
     * Holds the inner tick and label container.
     */
    getTickContainerStyle() {
        // TODO: cache style until prop change
        let style: ViewStyle = {};
        if (this.props.isInverted) {
            // Reverse tick alignment
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
            styles.tickContainer,
            axisStyles[this.props.type].tickContainer,
            style,
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
        if (Math.abs(thickness - this._layoutThickness) < 2) {
            return;
        }
        this._layoutThickness = thickness;
        console.debug('thickness: ' + thickness);
        // return;
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
        // margin: -2,
        // borderWidth: 2,
        // borderColor: 'rgba(200, 210, 130, 0.5)',
    },
    innerContainer: {
        // borderWidth: 2,
        // borderColor: 'rgba(100, 210, 230, 0.5)',
    },
    tickContainer: {
        flex: 1,
        // borderWidth: 2,
        // borderColor: 'rgba(100, 110, 230, 0.5)',
    },
    tickInnerContainer: {
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
            width: '100%',
            flexDirection: 'row',
            alignSelf: 'flex-end',
        },
        tickContainer: {
            alignSelf: 'flex-end',
        },
        tickInnerContainer: {
            flexDirection: 'column-reverse',
        },
    }),
    bottomAxis: StyleSheet.create({
        container: {
            flexDirection: 'column',
        },
        innerContainer: {
            width: '100%',
            flexDirection: 'row',
            alignSelf: 'flex-start',
        },
        tickContainer: {
            alignSelf: 'flex-start',
        },
        tickInnerContainer: {
            flexDirection: 'column',
        },
    }),
    leftAxis: StyleSheet.create({
        container: {
            flexDirection: 'column-reverse',
        },
        innerContainer: {
            height: '100%',
            flexDirection: 'column',
            alignSelf: 'flex-end',
        },
        tickContainer: {
            alignSelf: 'flex-end',
            justifyContent: 'center',
        },
        tickInnerContainer: {
            flexDirection: 'row-reverse',
        },
    }),
    rightAxis: StyleSheet.create({
        container: {
            flexDirection: 'column',
        },
        innerContainer: {
            height: '100%',
            flexDirection: 'column',
            alignSelf: 'flex-start',
        },
        tickContainer: {
            alignSelf: 'flex-start',
            justifyContent: 'center',
        },
        tickInnerContainer: {
            flexDirection: 'row',
        },
    }),
};
