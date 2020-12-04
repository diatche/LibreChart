import Decimal from 'decimal.js';
import React from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { ILinePoint, ILineDataStyle } from '../data/LineDataSource';
import { isMatch } from '../utils/comp';

export interface ChartLineProps extends ILineDataStyle {
    /** SVG view box. For example: `0 0 100 100`. */
    viewBox: string;
    /** Overlap as a fraction. */
    overlap: number;
    /** Svg `d` prop. */
    path: string;
    /** Point locations in canvas coordinates. */
    points: ILinePoint[];
    /** View scale. */
    scale: Animated.Value;
}

type ScaledValues = Pick<
    Required<ILineDataStyle>, 
    'strokeWidth'
    | 'strokeDashArray'
    | 'pointInnerRadius'
    | 'pointOuterRadius'
>;

const scaleToView = (value: number, scale: number): number => {
    return new Decimal(value / Math.abs(scale)).toNumber();
};

const scaleValues = (values: ScaledValues, scale: number): ScaledValues => {
    return {
        strokeWidth: scaleToView(values.strokeWidth, scale),
        strokeDashArray: values.strokeDashArray.map(x => scaleToView(x, scale)),
        pointInnerRadius: scaleToView(values.pointInnerRadius, scale),
        pointOuterRadius: scaleToView(values.pointOuterRadius, scale),
    };
};

const k100p = '100%';

const ChartLine = React.memo((props: ChartLineProps) => {
    const propsToScale: ScaledValues = {
        strokeWidth: props.strokeWidth || 0,
        strokeDashArray: props.strokeDashArray || [],
        pointInnerRadius: props.pointInnerRadius || 0,
        pointOuterRadius: props.pointOuterRadius || 0,
    };
    const sizePct = `${((1 + props.overlap) * 100)}%`;
    const marginPct = `${(-props.overlap * 100)}%`;
    const pointOuterColor = props.pointOuterColor || props.strokeColor;

    let pointsToDraw = props.points;
    let pointsLen = pointsToDraw.length;
    if (pointsLen !== 0) {
        if (pointsToDraw[0].clipped && pointsToDraw[pointsLen - 1].clipped) {
            pointsToDraw = pointsToDraw.slice(1, -1);
        } else if (pointsToDraw[0].clipped) {
            pointsToDraw = pointsToDraw.slice(1);
        } else if (pointsToDraw[pointsLen - 1].clipped) {
            pointsToDraw = pointsToDraw.slice(0, -1);
        }
    }

    const [scaledValues, setScaledValues] = React.useState(() => (
        // @ts-ignore: _value is private
        scaleValues(propsToScale, props.scale._value || 0)
    ));

    React.useEffect(() => {
        let sub = props.scale.addListener(({ value: scale }) => {
            setScaledValues(scaleValues(propsToScale, scale));
        });
        return () => props.scale.removeListener(sub);
    }, [
        props.scale,
        props.strokeWidth,
        props.pointInnerRadius,
        props.pointOuterRadius,
    ]);

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
                {props.strokeColor && scaledValues.strokeWidth > 0 && (
                    <Path
                        d={props.path}
                        fill='none'
                        strokeLinecap='round'
                        strokeWidth={scaledValues.strokeWidth}
                        stroke={props.strokeColor}
                        strokeDasharray={(
                            scaledValues.strokeDashArray.length !== 0
                                ? scaledValues.strokeDashArray.map(String).join(',')
                                : ''
                        )}
                    />
                )}
                {pointOuterColor && scaledValues.pointOuterRadius > 0 && pointsToDraw.map((p, i) => (
                    <Circle
                        key={`o${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={scaledValues.pointOuterRadius}
                        fill={pointOuterColor}
                    />
                ))}
                {props.pointInnerColor && scaledValues.pointInnerRadius > 0 && pointsToDraw.map((p, i) => (
                    <Circle
                        key={`i${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={scaledValues.pointInnerRadius}
                        fill={props.pointInnerColor}
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
    for (let key of keys) {
        if (prevProps[key] !== nextProps[key]) {
            return false;
        }
    }
    return true;
});

export default ChartLine;
