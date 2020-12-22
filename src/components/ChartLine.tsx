import { IPoint } from 'evergrid';
import React from 'react';
import {
    Animated,
    View,
} from 'react-native';
import Svg, {
    Circle,
    Path,
} from 'react-native-svg';
import { ILineDataStyle } from '../data/LineDataSource';
import { IPointStyle } from '../types';

export interface ChartLineProps extends ILineDataStyle {
    /**
     * View rect in the form [x, y, width, height]
     * in canvas coordinates.
     */
    rect: number[];
    /** Svg `d` prop. */
    path: string;
    /** Point locations in canvas coordinates. */
    points: IPoint[];
    /** Point styles corresponding to points. */
    pointStyles?: (IPointStyle | undefined)[];
    /** View scale. */
    scale: Animated.ValueXY;
}

const ChartLine = React.memo((props: ChartLineProps) => {
    const pointOuterColor = props.pointOuterColor || props.strokeColor;

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

    const rectWithOverlap = [
        props.rect[0] - viewOverlap,
        props.rect[1] - viewOverlap,
        props.rect[2] + viewOverlap * 2,
        props.rect[3] + viewOverlap * 2,
    ];
    
    const viewBox = rectWithOverlap.map(String).join(' ');

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
                {props.strokeColor && props.strokeWidth! > 0 && (
                    <Path
                        d={props.path}
                        fill='none'
                        strokeLinecap='round'
                        strokeWidth={props.strokeWidth}
                        stroke={props.strokeColor as string}
                        strokeDasharray={(
                            props.strokeDashArray && props.strokeDashArray.length !== 0
                                ? props.strokeDashArray.map(String).join(',')
                                : ''
                        )}
                    />
                )}
                {(props.pointStyles || pointOuterColor && props.pointOuterRadius! > 0) && props.points.map((p, i) => (
                    <Circle
                        key={`o${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={(props.pointStyles?.[i]?.pointOuterRadius || props.pointOuterRadius) as number}
                        fill={(props.pointStyles?.[i]?.pointOuterColor || pointOuterColor) as string}
                    />
                ))}
                {(props.pointStyles || props.pointInnerColor && props.pointInnerRadius! > 0) && props.points.map((p, i) => (
                    <Circle
                        key={`i${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={(props.pointStyles?.[i]?.pointInnerRadius || props.pointInnerRadius) as number}
                        fill={(props.pointStyles?.[i]?.pointInnerColor || props.pointInnerColor) as string}
                    />
                ))}
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
