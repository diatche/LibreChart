import React from 'react';
import {
    Animated,
    View,
} from 'react-native';
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Stop,
} from 'react-native-svg';
import {
    ILineDataStyle,
    ILinePoint,
} from '../data/LineDataSource';

export interface ChartLineProps extends ILineDataStyle {
    /**
     * View rect in the form [x, y, width, height]
     * in canvas coordinates.
     */
    rect: number[];
    /** Svg `d` prop. */
    path: string;
    /** Point locations in canvas coordinates. */
    points: ILinePoint[];
    /** Point styles corresponding to points. */
    pointStyles?: (ILineDataStyle | undefined)[];
    /** View scale. */
    scale: Animated.ValueXY;
}

const ChartLine = React.memo((props: ChartLineProps) => {
    const defaultPointOuterColor = props.pointOuterColor || props.strokeColor;

    if (typeof props.strokeWidth === 'object') {
        throw new Error('Animated values no supported on ChartLine');
    }
    if (typeof props.pointOuterRadius === 'object') {
        throw new Error('Animated values no supported on ChartLine');
    }

    const viewOverlap = Math.max(
        (props.strokeWidth || 0) / 2,
        props.pointOuterRadius || 0,
        ...Object.values(props.pointStyles || {})
            .map(s => {
                if (!s?.pointOuterRadius) {
                    return 0;
                }
                if (typeof s.pointOuterRadius === 'object') {
                    throw new Error('Animated values no supported on ChartLine');
                }
                return s.pointOuterRadius;
            }),
    );

    const rectWidthWithOverlap = props.rect[2] + viewOverlap * 2;
    const rectWithOverlap = [
        props.rect[0] - viewOverlap,
        props.rect[1] - viewOverlap,
        rectWidthWithOverlap,
        props.rect[3] + viewOverlap * 2,
    ];
    
    const viewBox = rectWithOverlap.map(String).join(' ');
    const drawLine = (props.pointStyles || props.strokeColor) && props.strokeWidth;
    const gradID = `grad_${props.rect[0]}_${props.rect[1]}`;

    // console.debug('rendering path: ' + props.path);
    return (
        <View style={{
            flex: 1,
            marginHorizontal: -viewOverlap,
            marginVertical: -viewOverlap,
            // backgroundColor: 'rgba(200, 210, 130, 0.1)',
        }}>
            <Svg
                width='100%'
                height='100%'
                preserveAspectRatio="none"
                viewBox={viewBox}
            >
                {drawLine && (
                    <Defs>
                        <LinearGradient
                            id={gradID}
                            x1='0%'
                            y1='0%'
                            x2='100%'
                            y2='0%'
                        >
                            {props.points.map((p, i) => {
                                let pointStyle = props.pointStyles?.[i];
                                let color = String(pointStyle?.strokeColor || props.strokeColor);
                                let offset = (p.originalPoint.x - rectWithOverlap[0]) / rectWidthWithOverlap;
                                return (
                                    <Stop
                                        key={`g${i}`}
                                        offset={`${offset * 100}%`}
                                        stopColor={color}
                                        stopOpacity='1'
                                    />
                                )
                            })}
                        </LinearGradient>
                    </Defs>
                )}
                {drawLine && (
                    <Path
                        d={props.path}
                        fill='none'
                        strokeLinecap='round'
                        strokeWidth={props.strokeWidth}
                        // stroke={props.strokeColor as string}
                        stroke={`url(#${gradID})`}
                        strokeDasharray={(
                            props.strokeDashArray && props.strokeDashArray.length !== 0
                                ? props.strokeDashArray.map(String).join(',')
                                : ''
                        )}
                    />
                )}
                {((props.pointStyles || defaultPointOuterColor) && props.pointOuterRadius) && props.points.map((p, i) => {
                    if (p.clipped) {
                        return null;
                    }
                    let pointStyle = props.pointStyles?.[i];
                    let pointOuterColor = String(
                        pointStyle
                            ? pointStyle.pointOuterColor || pointStyle.strokeColor
                            : defaultPointOuterColor
                    );
                    return (
                        <Circle
                            key={`o${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={(pointStyle?.pointOuterRadius || props.pointOuterRadius) as number}
                            fill={pointOuterColor}
                        />
                    )
                })}
                {((props.pointStyles || props.pointInnerColor) && props.pointInnerRadius) && props.points.map((p, i) => {
                    if (p.clipped) {
                        return null;
                    }
                    let pointStyle = props.pointStyles?.[i];
                    return (
                        <Circle
                            key={`i${i}`}
                            cx={p.x}
                            cy={p.y}
                            r={(pointStyle?.pointInnerRadius || props.pointInnerRadius) as number}
                            fill={String(pointStyle?.pointInnerColor || props.pointInnerColor)}
                        />
                    )
                })}
                {/* <Circle cx={props.rect[0]} cy={props.rect[1]} r={props.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0] + props.rect[2]} cy={props.rect[1]} r={props.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0]} cy={props.rect[1] + props.rect[3]} r={props.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0] + props.rect[2]} cy={props.rect[1] + props.rect[3]} r={props.strokeWidth! * 2} fill='red' /> */}
            </Svg>
        </View>
    );
}, /*(prevProps, nextProps) => {
    let prevKeys = Object.keys(prevProps) as (keyof ChartLineProps)[];
    let nextKeys = Object.keys(nextProps) as (keyof ChartLineProps)[];
    if (prevKeys.length !== nextKeys.length) {
        return false;
    }
    let keys = new Set([
        ...prevKeys,
        ...nextKeys,
    ]);
    if (keys.has('rect')) {
        // Compare separately
        if (!isMatch(prevProps.rect, nextProps.rect)) {
            return false;
        }
        keys.delete('rect');
    }
    if (keys.has('points')) {
        // Compare using "path" instead
        keys.delete('points');
    }
    if (keys.has('strokeDashArray')) {
        // Compare separately
        if (!isMatch(prevProps.strokeDashArray, nextProps.strokeDashArray)) {
            return false;
        }
        keys.delete('strokeDashArray');
    }
    if (keys.has('pointStyles')) {
        // Compare separately
        if (!isMatch(prevProps.pointStyles, nextProps.pointStyles)) {
            return false;
        }
        keys.delete('pointStyles');
    }
    for (let key of keys) {
        if (prevProps[key] !== nextProps[key]) {
            return false;
        }
    }
    return true;
}*/);

export default ChartLine;
