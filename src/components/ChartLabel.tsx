import React from 'react';
import {
    Animated,
    FlexStyle,
    StyleSheet,
    TextProps,
    ViewProps,
} from 'react-native';
import { ITickLabel, Alignment2D } from '../types';

export interface ChartLabelProps
    extends Omit<ITickLabel, 'align'>,
        Animated.AnimatedProps<ViewProps> {
    alignX?: Alignment2D['x'];
    alignY?: Alignment2D['y'];
    numberOfLines?: number;
    // onTextLayout?: (size: { width: number; height: number }) => void;
}

const ChartLabel = (props: ChartLabelProps) => {
    const {
        alignX = 'center',
        alignY = 'center',
        numberOfLines,
        title,
        textStyle,
        style,
        render,
        // onTextLayout: onTextLayoutProp,
        ...otherProps
    } = props;

    // const titleSize = React.useRef(new Animated.ValueXY()).current;
    // const [titleSize, setTitleSize] = React.useState({ text: '', x: 0, y: 0 });

    // const titleSizeTextRef = React.useRef('');

    const textProps: Animated.AnimatedProps<TextProps> = {
        selectable: false,
        style: [
            {
                textAlign: alignX,
                // width: titleSize.x,
                // height: titleSize.y,
            },
            // titleSize.text === title
            //     ? {
            //           width: titleSize.x,
            //           height: titleSize.y,
            //       }
            //     : undefined,
            textStyle,
        ],
        numberOfLines,
    };

    // const onTextLayout = React.useCallback(
    //     (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    //         let text = event.nativeEvent.lines.map(x => x.text).join('\n');
    //         if (text === titleSizeTextRef.current) {
    //             // Measure title text only once
    //             return;
    //         }
    //         let width = 0;
    //         let height = 0;
    //         for (let line of event.nativeEvent.lines) {
    //             if (line.width > width) {
    //                 width = line.width;
    //             }
    //             height += line.height;
    //         }
    //         titleSizeTextRef.current = text;
    //         onTextLayoutProp?.({
    //             width: Math.ceil(width) + 6,
    //             height: Math.ceil(height),
    //         });
    //         // setTitleSize({
    //         //     text,
    //         //     x: Math.ceil(width) + 6,
    //         //     y: Math.ceil(height),
    //         // });
    //     },
    //     [onTextLayoutProp]
    // );

    let content: React.ReactNode;
    if (render) {
        content = render(textProps);
        if (typeof content === 'string') {
            throw new Error(
                'Use the title prop to display a basic text string'
            );
        }
    } else {
        content = (
            <Animated.Text
                {...textProps}
                // onTextLayout={Platform.OS !== 'web' ? onTextLayout : undefined}
            >
                {title || ''}
            </Animated.Text>
        );
    }

    return (
        <Animated.View
            {...otherProps}
            style={[
                styles.container,
                { justifyContent: kAlignContentMapY[alignY] },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.innerContainer,
                    { justifyContent: kAlignContentMapX[alignX] },
                ]}
            >
                {content}
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        overflow: 'hidden',
    },
    innerContainer: {
        flexDirection: 'row',
    },
});

const kAlignContentMapX: {
    [K in Alignment2D['x']]: FlexStyle['justifyContent'];
} = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
};

const kAlignContentMapY: {
    [K in Alignment2D['y']]: FlexStyle['justifyContent'];
} = {
    top: 'flex-start',
    center: 'center',
    bottom: 'flex-end',
};

export default ChartLabel;
