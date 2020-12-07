import React from 'react';

export interface CanvasProps {
    ref: ((canvas: Canvas) => any) | React.RefObject<Canvas>;
}

export default class Canvas extends React.PureComponent<CanvasProps> {

    private _canvas: HTMLCanvasElement | null = null;

    // constructor(props: CanvasProps) {
    //     super(props);
    // }

    getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): CanvasRenderingContext2D | null {
        return this._canvas?.getContext(contextId, options) || null;
    }

    render() {
        return (
            <canvas
                {...this.props}
                ref={canvas => {
                    this._canvas = canvas;
                    if (typeof this.props.ref === 'function') {
                        this.props.ref(this);
                    }
                }}
            />
        );
    }
}

// const Canvas = React.memo((props: CanvasProps) => {
//     const canvasRef = React.useRef<any>(null);

//     React.useEffect(() => {
//         const canvas = canvasRef.current!;
//         const context = canvas.getContext('2d') as CanvasRenderingContext2D;
//         props.handleContext(context);
//     }, []);

//     return <canvas {...props} />;
// });

// export default Canvas;
