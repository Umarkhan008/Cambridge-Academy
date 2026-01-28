import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { LineChart, BarChart, PieChart, ProgressChart } from 'react-native-chart-kit';
import { COLORS, SIZES, FONTS } from '../constants/theme';
import globalStyles from '../styles/globalStyles';

const screenWidth = Dimensions.get('window').width;

const Chart = ({ title, data, type = 'line', height = 220, width, style }) => {
    const chartWidth = width || (screenWidth - (SIZES.padding * 2) - (SIZES.padding * 1.5));

    const chartConfig = {
        backgroundGradientFrom: COLORS.surface,
        backgroundGradientTo: COLORS.surface,
        color: (opacity = 1) => COLORS.primary + (opacity < 1 ? Math.round(opacity * 255).toString(16) : ''),
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => COLORS.textSecondary,
        propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: COLORS.primary
        },
        // For Pie Chart labels
        color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    };

    const renderChart = () => {
        switch (type) {
            case 'line':
                return (
                    <LineChart
                        data={data}
                        width={chartWidth}
                        height={height}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                        withInnerLines={false}
                        withOuterLines={false}
                    />
                );
            case 'bar':
                return (
                    <BarChart
                        data={data}
                        width={chartWidth}
                        height={height}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        showValuesOnTopOfBars
                        withInnerLines={false}
                    />
                );
            case 'pie':
                return (
                    <PieChart
                        data={data}
                        width={chartWidth}
                        height={height}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[10, 0]}
                        absolute
                    />
                );
            case 'progress':
                return (
                    <ProgressChart
                        data={data}
                        width={chartWidth}
                        height={height}
                        strokeWidth={16}
                        radius={32}
                        chartConfig={chartConfig}
                        hideLegend={false}
                    />
                );
            default:
                return null;
        }
    }

    return (
        <View style={[globalStyles.card, globalStyles.shadow, styles.container, style]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {renderChart()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        justifyContent: 'center'
    },
    title: {
        ...FONTS.h3,
        color: COLORS.text,
        marginBottom: SIZES.base * 2,
    },
    chart: {
        borderRadius: SIZES.radius,
        paddingRight: 0,
    }
});

export default Chart;
