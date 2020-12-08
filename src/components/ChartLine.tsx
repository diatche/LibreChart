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
    /** SVG view box. For example: `0 0 100 100`. */
    viewBox: string;
    /** Overlap as a fraction. */
    overlap: number;
    /** Svg `d` prop. */
    path: string;
    /** Point locations in canvas coordinates. */
    points: IPoint[];
    /** Point styles corresponding to points. */
    pointStyles?: (IDataPointStyle | undefined)[];
    /** View scale. */
    scale: Animated.Value;
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

const k100p = '100%';

const ChartLine = React.memo((props: ChartLineProps) => {
    const propsToScale: ScaledValues = {
        strokeWidth: props.strokeWidth || 0,
        strokeDashArray: props.strokeDashArray,
        pointInnerRadius: props.pointInnerRadius || 0,
        pointOuterRadius: props.pointOuterRadius || 0,
        pointStyles: props.pointStyles,
    };
    const sizePct = `${((1 + props.overlap) * 100)}%`;
    const marginPct = `${(-props.overlap * 100)}%`;
    const pointOuterColor = props.pointOuterColor || props.strokeColor;

    // @ts-ignore: _value is private
    const [scale, setScale] = React.useState(() => Math.abs(props.scale._value || 0));
    const scaledValues = scaleValues(propsToScale, scale);

    React.useEffect(() => {
        let mounted = true;
        let updater = debounce(({ value }: { value: number }) => {
            if (!mounted) {
                return;
            }
            setScale(Math.abs(value));
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
            width: sizePct,
            height: sizePct,
            margin: marginPct,
            // borderWidth: 2,
            // borderColor: 'rgba(200, 210, 130, 0.5)',
        }}>
            <Svg
                height={k100p}
                width={k100p}
                viewBox={props.viewBox}
            >
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
