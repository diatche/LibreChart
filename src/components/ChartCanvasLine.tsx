import Decimal from 'decimal.js';
import { IPoint } from 'evergrid';
import React from 'react';
import { Animated, PixelRatio, View } from 'react-native';
import * as d3 from 'd3-shape';
import { ILineDataStyle } from '../data/LineDataSource';
import { IDataPointStyle } from '../types';
import { isMatch } from '../utils/comp';
import Canvas, { CanvasType } from './Canvas';
import debounce from 'lodash.debounce';

const kPixelRatio = PixelRatio.get();
console.debug('kPixelRatio: ' + kPixelRatio);

export interface ChartLineProps extends ILineDataStyle {
    /** SVG view box. For example: `0 0 100 100`. */
    viewBox: string;
    /** Overlap as a fraction. */
    overlap: number;
    line?: d3.Line<IPoint>;
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

const k100p = '100%';

const ChartLine = React.memo((props: ChartLineProps) => {
    const [canvas, setCanvas] = React.useState<CanvasType | null>(null);
    const propsToScale: ScaledValues = {
        strokeWidth: props.strokeWidth || 0,
        strokeDashArray: props.strokeDashArray,
        pointInnerRadius: props.pointInnerRadius || 0,
        pointOuterRadius: props.pointOuterRadius || 0,
        pointStyles: props.pointStyles,
    };
    const sizePct = `${((1 + props.overlap) * 100)}%`;
    const marginPct = `${(-props.overlap * 100)}%`;
    const pointOuterColor = String(props.pointOuterColor || props.strokeColor || 0);

    const [scale, setScale] = React.useState<IPoint>(() => ({
        // @ts-ignore: _value is private
        x: Math.abs(props.scale.x._value || 0),
        // @ts-ignore: _value is private
        y: Math.abs(props.scale.y._value || 0),
    }));
    const scaledValues = scaleValues(propsToScale, 1/kPixelRatio);

    const [size, setSize] = React.useState({ width: 0, height: 0 });

    React.useEffect(() => {
        let updater = debounce((scale: IPoint) => setScale({
            x: Math.abs(scale.x),
            y: Math.abs(scale.y),
        }), 200);
        let sub = props.scale.addListener(updater);
        return () => props.scale.removeListener(sub);
    }, [
        props.scale,
        // props.strokeWidth,
        // props.pointInnerRadius,
        // props.pointOuterRadius,
    ]);

    // if (canvas) {
    //     let ctx = canvas.getContext('2d');
    //     // console.debug(`ctx: ${ctx}`);
    //     if (ctx) {
    //         ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    //         // console.debug(`canvas scale: ${JSON.stringify(scale)}`);
    //         // console.debug(`canvas width: ${ctx.canvas.width}, height: ${ctx.canvas.height}`);
    //         if (props.line && pointOuterColor && (scaledValues.strokeWidth || 0) > 0) {
    //             ctx.beginPath();
    //             ctx.lineWidth = scaledValues.strokeWidth!;
    //             ctx.lineCap = 'round';
    //             ctx.strokeStyle = pointOuterColor;
    //             scaledValues.strokeDashArray && ctx.setLineDash(scaledValues.strokeDashArray);
    //             let line = props.line.context(ctx);
    //             console.debug(`drawing points: ${props.points.length}`);
    //             line(props.points.map(p => ({
    //                 x: p.x * scale.x * kPixelRatio,
    //                 y: p.y * scale.y * kPixelRatio,
    //             })));
    //             ctx.stroke();
    //         }
    //     }
    // }

    React.useEffect(() => {
        if (!canvas) {
            return;
        }
        let ctx = canvas.getContext('2d');
        // console.debug(`ctx: ${ctx}`);
        if (!ctx) {
            return;
        }
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        console.debug(`canvas scale: ${JSON.stringify(scale)}`);
        console.debug(`canvas width: ${ctx.canvas.width}, height: ${ctx.canvas.height}`);
        if (props.line && pointOuterColor && (scaledValues.strokeWidth || 0) > 0) {
            ctx.beginPath();
            ctx.lineWidth = scaledValues.strokeWidth!;
            ctx.lineCap = 'round';
            ctx.strokeStyle = pointOuterColor;
            scaledValues.strokeDashArray && ctx.setLineDash(scaledValues.strokeDashArray);
            let line = props.line.context(ctx);
            console.debug(`drawing points: ${props.points.length}`);
            line(props.points.map(p => ({
                x: p.x * scale.x * kPixelRatio,
                y: p.y * scale.y * kPixelRatio,
            })));
            ctx.stroke();
        }

        // return () => ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }, [scale.x, scale.y, canvas]);

    return (
        <View
            style={{
                width: sizePct,
                height: sizePct,
                margin: marginPct,
                borderWidth: 2,
                borderColor: 'rgba(200, 210, 130, 0.5)',
            }}
            onLayout={event => setSize({
                width: event.nativeEvent.layout.width,
                height: event.nativeEvent.layout.height,
            })}
        >
            {size.width !== 0 && size.height !== 0 && (
                <Canvas
                    style={size}
                    width={size.width * 2}
                    height={size.height * 2}
                    ref={canvas => setCanvas(canvas)}
                />
            )}
            {/* <Svg
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
            </Svg> */}
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
        // Compare separately
        if (!isMatch(prevProps.points, nextProps.points)) {
            return false;
        }
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
