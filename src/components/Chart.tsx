import React from 'react';
import RecyclerGridView, {
    RecyclerGridViewProps,
    LayoutSource,
    IItem,
} from 'recycler-grid-view';
import { kPointReuseID, kGridReuseID } from '../const';
import {
    LayoutEngine,
    LayoutEngineProps
} from '../internal';
import ChartGrid from './ChartGrid';
import ChartPoint from './ChartPoint';

type ForwardRecyclerGridViewProps = Partial<RecyclerGridViewProps>;

export interface ChartProps extends ForwardRecyclerGridViewProps, LayoutEngineProps {

}

interface ChartState {}

export default class Chart extends React.PureComponent<ChartProps, ChartState> {
    gridViewRef = React.createRef<RecyclerGridView>();
    layout: LayoutEngine;

    constructor(props: ChartProps) {
        super(props);
        this.layout = new LayoutEngine(props);
    }

    get innerView() {
        return this.gridViewRef.current;
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
        this.layout.update(this);
    }

    render() {
        return (
            <RecyclerGridView
                anchor={{ x: 0.5, y: 0.5 }}
                {...this.props}
                ref={this.gridViewRef}
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
                        majorCountX={this.layout.gridMajorCount.x}
                        majorCountY={this.layout.gridMajorCount.y}
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
