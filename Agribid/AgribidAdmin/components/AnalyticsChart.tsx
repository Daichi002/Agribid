import React, { useMemo } from "react";
import { View, Text } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

const screenWidth = Dimensions.get("window").width;

interface Transaction {
  is_approve: boolean;
  product?: {
    commodity: string;
  };
}

interface AnalyticsChartProps {
  transactions: Transaction[];
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ transactions }) => {
  // Process data for approved vs pending
  const { approvedCount, pendingCount, productSales } = useMemo(() => {
    let approved = 0;
    let pending = 0;
    let sales: Record<string, number> = {};

    transactions.forEach(({ is_approve, product }) => {
      if (is_approve) approved++;
      else pending++;

      if (product) {
        sales[product.commodity] = (sales[product.commodity] || 0) + 1;
      }
    });

    return {
      approvedCount: approved,
      pendingCount: pending,
      productSales: Object.entries(sales).map(([name, count]) => ({
        name,
        count,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        legendFontColor: "#7F7F7F",
        legendFontSize: 12,
      })),
    };
  }, [transactions]);

  return (
    <View style={{ padding: 10, backgroundColor: "#fff", borderRadius: 10, marginBottom: 20, flexDirection: "row", justifyContent: "space-between" }}>
  
  {/* Bar Chart: Approved vs Pending */}
  <View style={{ flex: 1, alignItems: "center" }}>
    <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Transaction Status</Text>
    <BarChart
      data={{
        labels: ["Approved", "Pending"],
        datasets: [{ data: [approvedCount, pendingCount] }],
      }}
      width={screenWidth / 2 - 20} 
      height={200}
      chartConfig={{
        backgroundColor: "#f4f4f4",
        backgroundGradientFrom: "#fff",
        backgroundGradientTo: "#fff",
        color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
        barPercentage: 0.5,
      }}
      fromZero
      yAxisLabel=""
      yAxisSuffix=""
    />
  </View>

  {/* Pie Chart: Most Sold Products */}
  <View style={{ flex: 1, alignItems: "center" }}>
    <Text style={{ textAlign: "center", fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>Most Sold Products</Text>
    <PieChart
      data={productSales}
      width={screenWidth / 2 - 20} 
      height={200}
      chartConfig={{
        color: (opacity = 1) => `rgba(0, 255, 0, ${opacity})`,
      }}
      accessor="count"
      backgroundColor="transparent"
      absolute
      paddingLeft="10"
    />
  </View>

</View>

  );
};

export default AnalyticsChart;
