// import Canvas from 'react-native-canvas';
// export default Canvas;

// export * from 'react-native-canvas';

import React from "react";
import { Platform } from 'react-native';
import { CanvasProps, CanvasType } from "./canvasTypes";

const Canvas$: Promise<{ default: CanvasType }> = Platform.OS === 'web'
    ? import('./CanvasWeb') as any
    : import('react-native-canvas') as any;

// export interface CanvasUniProps extends CanvasProps<CanvasUni> {}

// interface CanvasUniState {
//     canvasClass?: any;
// }

// export default class CanvasUni extends React.PureComponent<CanvasUniProps, CanvasUniState> implements CanvasType {
//     private _canvas?: any;

//     constructor(props: CanvasUniProps) {
//         super(props);
//         this.state = {};
//         Canvas$.then(res => {
//             this.setState({
//                 canvasClass: res.default || null,
//             });
//         });
//     }

//     getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D {
//         return this._canvas?.getContext(contextId, options);
//     }

//     render() {
//         console.debug('uni canvas');
//         const Canvas = this.state.canvasClass;
//         return (Canvas &&
//             <Canvas
//                 {...this.props}
//                 ref={(canvas: any) => {
//                     this._canvas = canvas;
//                 }}
//             /> || null
//         );
//     }
// }

const CanvasUni = React.forwardRef((props: CanvasProps, ref: React.ForwardedRef<CanvasType>) => {
    const [Canvas, setCanvas] = React.useState<any>(null);
    
    React.useEffect(() => {
        Canvas$.then((res: any) => setCanvas(res?.default || null));
    }, []);

    return (Canvas ?
        <Canvas {...props} ref={ref} />
    : null);
});

export default CanvasUni;
