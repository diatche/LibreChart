import React from 'react';
import { CanvasProps, CanvasType } from './canvasTypes';

// export default class CanvasWeb extends React.PureComponent<CanvasProps> implements CanvasType {

//     private _htmlCanvas: HTMLCanvasElement | null = null;

//     getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D {
//         return this._htmlCanvas?.getContext(contextId, options)!;
//     }

//     render() {
//         console.debug('web canvas');
//         return (
//             <canvas
//                 {...this.props}
//                 ref={canvas => {
//                     this._htmlCanvas = canvas;
//                     if (typeof this.props.ref === 'function') {
//                         this.props.ref(this);
//                     }
//                 }}
//             />
//         );
//     }
// }

const CanvasWeb = React.forwardRef((props: Omit<CanvasProps, 'style'>, ref: React.ForwardedRef<HTMLCanvasElement>) => (
    <canvas {...props} ref={ref} />
));

export default CanvasWeb;
