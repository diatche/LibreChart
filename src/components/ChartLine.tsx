import React from 'react';
import { Animated, View } from 'react-native';
import Svg, {
    Circle,
    Defs,
    LinearGradient,
    Path,
    Stop,
    StopProps,
} from 'react-native-svg';
import { ILineDataStyle, ILinePoint } from '../data/LineDataSource';

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
}

const ChartLine = React.memo(
    (props: ChartLineProps) => {
        const defaultPointOuterColor =
            props.pointOuterColor || props.strokeColor;

        if (
            typeof props.strokeWidth === 'object' ||
            typeof props.pointInnerRadius === 'object' ||
            typeof props.pointOuterRadius === 'object'
        ) {
            throw new Error('Animated values no supported on ChartLine');
        }

        const viewOverlap = Math.max(
            (props.strokeWidth || 0) / 2,
            props.pointInnerRadius || 0,
            props.pointOuterRadius || 0,
            ...Object.values(props.pointStyles || {}).map(s => {
                if (!s) {
                    return 0;
                }
                if (
                    typeof s.pointInnerRadius === 'object' ||
                    typeof s.pointOuterRadius === 'object'
                ) {
                    throw new Error(
                        'Animated values no supported on ChartLine'
                    );
                }
                return Math.max(
                    s.pointInnerRadius || 0,
                    s.pointOuterRadius || 0,
                    0
                );
            })
        );

        const rectWidthWithOverlap = props.rect[2] + viewOverlap * 2;
        const rectWithOverlap = [
            props.rect[0] - viewOverlap,
            props.rect[1] - viewOverlap,
            rectWidthWithOverlap,
            props.rect[3] + viewOverlap * 2,
        ];

        const viewBox = rectWithOverlap.map(String).join(' ');
        const drawLine =
            (props.pointStyles || props.strokeColor) && props.strokeWidth;

        let useGrad = false;
        let gradientStops: StopProps[] = [];
        if (drawLine) {
            gradientStops = props.points.reduce((stops, p, i) => {
                let pointStyle = props.pointStyles?.[i];
                let color = pointStyle?.strokeColor || props.strokeColor;
                // let offset = p.x;
                let offset = (p.x - rectWithOverlap[0]) / rectWidthWithOverlap;
                let stop = {
                    // offset: offset
                    offset: `${offset * 100}%`,
                    stopColor: color,
                    stopOpacity: 1,
                };
                let previousStop = stops[stops.length - 1];
                if (color === previousStop?.stopColor) {
                    // Same color
                    previousStop.offset = stop.offset;
                } else {
                    // Different color
                    stops.push(stop);
                }
                return stops;
            }, [] as StopProps[]);
            useGrad = gradientStops.length > 1;
        }
        const gradID = `grad_${rectWithOverlap.map(String).join('_')}`;
        const gradURL = `url(#${gradID})`;

        // console.debug(`rendering with props ${JSON.stringify(props, null, 2)}`);
        // console.debug(`rendering path ${JSON.stringify(props.points, null, 2)} in viewbox ${JSON.stringify(rectWithOverlap)}`);
        return (
            <View
                style={{
                    flex: 1,
                    marginHorizontal: -viewOverlap,
                    marginVertical: -viewOverlap,
                    // backgroundColor: 'rgba(200, 210, 130, 0.1)',
                }}
            >
                <Svg
                    width='100%'
                    height='100%'
                    preserveAspectRatio='none'
                    viewBox={viewBox}
                >
                    {useGrad && drawLine && (
                        <Defs>
                            <LinearGradient
                                id={gradID}
                                // x1={rectWithOverlap[0]}
                                // y1={rectWithOverlap[1]}
                                // x2={rectWithOverlap[0] + rectWithOverlap[2]}
                                // y2={rectWithOverlap[1] + rectWithOverlap[3]}
                                x1='0%'
                                y1='0%'
                                x2='100%'
                                y2='0%'
                            >
                                {gradientStops.map((stop, i) => {
                                    return (
                                        <Stop
                                            key={`${gradID}[${i}]`}
                                            {...stop}
                                        />
                                    );
                                })}
                            </LinearGradient>
                        </Defs>
                    )}
                    {drawLine ? (
                        <Path
                            d={props.path}
                            fill='none'
                            strokeLinecap='round'
                            strokeWidth={props.strokeWidth}
                            stroke={
                                useGrad
                                    ? gradURL
                                    : (props.strokeColor as string)
                            }
                            strokeDasharray={
                                props.strokeDashArray &&
                                props.strokeDashArray.length !== 0
                                    ? props.strokeDashArray
                                          .map(String)
                                          .join(',')
                                    : ''
                            }
                        />
                    ) : null}
                    {(props.pointStyles || defaultPointOuterColor) &&
                    props.pointOuterRadius
                        ? props.points.map((p, i) => {
                              if (p.clipped) {
                                  return null;
                              }
                              let pointStyle = props.pointStyles?.[i];
                              let pointOuterColor = pointStyle
                                  ? pointStyle.pointOuterColor ||
                                    pointStyle.strokeColor
                                  : defaultPointOuterColor;

                              return (
                                  <Circle
                                      key={`o${i}`}
                                      cx={p.x}
                                      cy={p.y}
                                      r={
                                          (pointStyle?.pointOuterRadius ||
                                              props.pointOuterRadius) as number
                                      }
                                      fill={pointOuterColor}
                                  />
                              );
                          })
                        : null}
                    {(props.pointStyles || props.pointInnerColor) &&
                    props.pointInnerRadius
                        ? props.points.map((p, i) => {
                              if (p.clipped) {
                                  return null;
                              }
                              let pointStyle = props.pointStyles?.[i];
                              return (
                                  <Circle
                                      key={`i${i}`}
                                      cx={p.x}
                                      cy={p.y}
                                      r={
                                          (pointStyle?.pointInnerRadius ||
                                              props.pointInnerRadius) as number
                                      }
                                      fill={
                                          pointStyle?.pointInnerColor ||
                                          props.pointInnerColor
                                      }
                                  />
                              );
                          })
                        : null}
                    {/* <Circle cx={props.rect[0]} cy={props.rect[1]} r={props.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0] + props.rect[2]} cy={props.rect[1]} r={props.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0]} cy={props.rect[1] + props.rect[3]} r={props.strokeWidth! * 2} fill='red' />
                <Circle cx={props.rect[0] + props.rect[2]} cy={props.rect[1] + props.rect[3]} r={props.strokeWidth! * 2} fill='red' /> */}
                </Svg>
            </View>
        );
    } /*(prevProps, nextProps) => {
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
}*/
);

export default ChartLine;
