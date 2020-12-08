import Decimal from 'decimal.js';
import { IPoint } from 'evergrid';
import debounce from 'lodash.debounce';
import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ILineDataStyle } from '../data/LineDataSource';
import { IDataPointStyle } from '../types';
import { isMatch } from '../utils/comp';

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
    pointStyles?: (IDataPointStyle | undefined)[];
    /** View scale. */
    scale: Animated.ValueXY;
}

interface ScaledPointValues extends Pick<
    IDataPointStyle, 
    'pointInnerRadius'
    | 'pointOuterRadius'
> {}

interface ScaledValues extends ScaledPointValues, Pick<
    ILineDataStyle, 
    'strokeWidth'
    | 'strokeDashArray'
> {
    pointStyles?: (ScaledPointValues | undefined)[];
}

const scaleToView = (value: number | undefined, scale: number): number => {
    return value && new Decimal(value / Math.abs(scale || 1)).toNumber() || 0;
};

const scalePointStyle = (values: ScaledPointValues, scale: number): ScaledPointValues => {
    return {
        pointInnerRadius: scaleToView(values.pointInnerRadius, scale),
        pointOuterRadius: scaleToView(values.pointOuterRadius, scale),
    };
};

const scaleValues = (values: ScaledValues, scale: number): ScaledValues => {
    return {
        ...scalePointStyle(values, scale),
        strokeWidth: scaleToView(values.strokeWidth, scale),
        strokeDashArray: values.strokeDashArray?.map(x => scaleToView(x, scale)),
        pointStyles: values.pointStyles?.map(style => style && scalePointStyle(style, scale)),
    };
};

const ChartLine = React.memo((props: ChartLineProps) => {
    const scaledProps: ScaledValues = {
        strokeWidth: props.strokeWidth || 0,
        strokeDashArray: props.strokeDashArray,
        pointInnerRadius: props.pointInnerRadius || 0,
        pointOuterRadius: props.pointOuterRadius || 0,
        pointStyles: props.pointStyles,
    };
    // const sizePct = `${((1 + props.overlap) * 100)}%`;
    // const marginPct = `${(-props.overlap * 100)}%`;
    const pointOuterColor = props.pointOuterColor || props.strokeColor;

    const [scale, setScale] = React.useState<IPoint>(() => ({
        // @ts-ignore: _value is private
        x: Math.abs(props.scale.x._value || 0),
        // @ts-ignore: _value is private
        y: Math.abs(props.scale.y._value || 0),
    }));
    const scaledValues = scaleValues(scaledProps, scale.x);

    const viewOverlap = Math.max(
        (props.strokeWidth || 0) / 2,
        props.pointOuterRadius || 0,
        ...Object.values(props.pointStyles || {})
            .map(s => s?.pointOuterRadius || 0),
    );
    // const viewOverlap2 = viewOverlap * 2;
    const xContentOverlap = viewOverlap / scale.x;
    const yContentOverlap = viewOverlap / scale.y;

    const rectWithOverlap = [
        props.rect[0] - xContentOverlap,
        props.rect[1] - yContentOverlap,
        props.rect[2] + xContentOverlap * 2,
        props.rect[3] + yContentOverlap * 2,
    ];
    const viewBox = rectWithOverlap.map(String).join(' ');

    const xOverlap = xContentOverlap / props.rect[2];
    const yOverlap = yContentOverlap / props.rect[3];

    React.useEffect(() => {
        let mounted = true;
        let updater = debounce((scale: IPoint) => {
            if (!mounted) {
                return;
            }
            setScale({
                x: Math.abs(scale.x),
                y: Math.abs(scale.y),
            });
        }, 50);
        let sub = props.scale.addListener(updater);
        return () => {
            mounted = false;
            props.scale.removeListener(sub);
        };
    }, [props.scale]);

    // console.debug('rendering path: ' + props.path);
    return (
        <View style={{
            width: `${(1 + xOverlap * 2) * 100}%`,
            height: `${(1 + yOverlap * 2) * 100}%`,
            marginHorizontal: `${-xOverlap * 100}%`,
            marginVertical: `${-yOverlap * 100}%`,
            // backgroundColor: 'rgba(200, 210, 130, 0.1)',
        }}>
            <Svg viewBox={viewBox} >
                {props.strokeColor && scaledValues.strokeWidth! > 0 && (
                    <Path
                        d={props.path}
                        fill='none'
                        strokeLinecap='round'
                        strokeWidth={scaledValues.strokeWidth}
                        stroke={props.strokeColor}
                        strokeDasharray={(
                            scaledValues.strokeDashArray && scaledValues.strokeDashArray.length !== 0
                                ? scaledValues.strokeDashArray.map(String).join(',')
                                : ''
                        )}
                    />
                )}
                {(scaledValues.pointStyles || pointOuterColor && scaledValues.pointOuterRadius! > 0) && props.points.map((p, i) => (
                    <Circle
                        key={`o${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={scaledValues.pointStyles?.[i]?.pointOuterRadius || scaledValues.pointOuterRadius}
                        fill={props.pointStyles?.[i]?.pointOuterColor || pointOuterColor}
                    />
                ))}
                {(scaledValues.pointStyles || props.pointInnerColor && scaledValues.pointInnerRadius! > 0) && props.points.map((p, i) => (
                    <Circle
                        key={`i${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={scaledValues.pointStyles?.[i]?.pointInnerRadius || scaledValues.pointInnerRadius}
                        fill={props.pointStyles?.[i]?.pointInnerColor || props.pointInnerColor}
                    />
                ))}
                {/* <Circle cx={props.rect[0]} cy={props.rect[1]} r={scaledValues.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0] + props.rect[2]} cy={props.rect[1]} r={scaledValues.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0]} cy={props.rect[1] + props.rect[3]} r={scaledValues.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0] + props.rect[2]} cy={props.rect[1] + props.rect[3]} r={scaledValues.strokeWidth! * 2} fill='red' /> */}
            </Svg>
        </View>
    );
}, (prevProps, nextProps) => {
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
});

export default ChartLine;
