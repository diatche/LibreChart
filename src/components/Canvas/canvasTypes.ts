import { ViewStyle } from 'react-native';

export interface CanvasProps {
    width?: number;
    height?: number;
    style?: ViewStyle;
}

export interface CanvasType extends CanvasProps {
    width: number;
    height: number;
    
    getContext: (contextId: "2d", options?: CanvasRenderingContext2DSettings) => CanvasRenderingContext2D;
}
