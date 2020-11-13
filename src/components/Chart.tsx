import React from 'react';
import Evergrid, {
    EvergridProps,
    LayoutSource,
    IItem,
} from 'evergrid'
import { kPointReuseID, kGridReuseID } from '../const';
import {
    LayoutEngine,
    LayoutEngineProps
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';

type ForwardEvergridProps = Partial<EvergridProps>;

export interface ChartProps extends ForwardEvergridProps, LayoutEngineProps {

}

interface ChartState {}

export default class Chart extends React.PureComponent<ChartProps, ChartState> {
    innerRef = React.createRef<Evergrid>();
    layout: LayoutEngine;

    constructor(props: ChartProps) {
        super(props);
        this.layout = new LayoutEngine(props);
    }

    get innerView() {
        return this.innerRef.current;
    }

    componentDidMount() {
        this.layout.configure(this);
    }

    componentWillUnmount() {
        this.layout.unconfigure(this);
    }

    getLayoutSources(): LayoutSource[] {
        return [
            ...this.layout.getLayoutSources(),
            ...this.props.layoutSources || [],
        ];
    }

    updateLayout() {
        this.layout.scheduleUpdate(this);
    }

    render() {
        return (
            <Evergrid
                anchor={{ x: 0.5, y: 0.5 }}
                {...this.props}
                ref={this.innerRef}
                layoutSources={this.getLayoutSources()}
                renderItem={(item: IItem<any>) => this.renderItem(item)}
                onViewportSizeChanged={() => this.updateLayout()}
                onScaleChanged={() => this.updateLayout()}
            />
        );
    }

    renderItem({ index, animated, reuseID }: IItem<any>) {
        switch (reuseID) {
            case kPointReuseID:
                return <ChartPoint diameter={animated.viewLayout.size.x} />;
            case kGridReuseID:
                return (
                    <ChartGrid
                        majorCountX={this.layout.gridInfo.majorCount.x}
                        majorCountY={this.layout.gridInfo.majorCount.y}
                    />
                );
            // case 'bottomAxis':
            //     return <View style={styles.bottomAxis} />
            // case 'bottomAxisMajor':
            //     return (
            //         <View style={styles.bottomAxisMajorContainer}>
            //             <View style={styles.bottomAxisMajorTick} />
            //             <Text style={styles.bottomAxisMajorLabel}>{index}</Text>
            //         </View>
            //     );
            // case 'rightAxis':
            //     return <View style={styles.rightAxis} />
            // case 'rightAxisMajor':
            //     return (
            //         <View style={styles.rightAxisMajorContainer}>
            //             <View style={styles.rightAxisMajorTick} />
            //             <View style={styles.rightAxisMajorLabelContainer}>
            //                 <Text style={styles.rightAxisMajorLabel}>{index}</Text>
            //             </View>
            //         </View>
            //     );
            // case 'horizontalGrid':
            //     return <View style={styles.horizontalGrid} />
            // case 'verticalGrid':
            //     return <View style={styles.verticalGrid} />
            default: 
                return null;
        }
    }
}
