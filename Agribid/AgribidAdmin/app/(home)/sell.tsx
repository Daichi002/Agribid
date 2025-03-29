import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
  Dimensions,
  ScrollView,
  TextInput,
  ImageBackground,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { LineChart, PieChart, ContributionGraph, AbstractChart } from "react-native-chart-kit";
import BASE_URL from "../../components/ApiConfig";
import { icons } from "../../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import ReactDatePicker from "react-datepicker"; // For web
import "react-datepicker/dist/react-datepicker.css"; // Web styles
import ProtectedRoute from '../../components/ProtectedRoute';
import { router } from "expo-router";



interface Product {
  title: string;
  commodity: string;
  description: string;
  image: string;
  price: number;
  locate: string;
  created_at: string;
}

const Sell = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [chartDataByCategory, setChartDataByCategory] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(""); // YYYY-MM-DD format
  const [endDate, setEndDate] = useState(""); // YYYY-MM-DD format
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isWeb = Platform.OS === "web";

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError("");
  
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        setError("Authentication token not found.");
        setIsLoading(false);
        router.push("/login");
      }
  
      let url = `${BASE_URL}/api/adminproducts`; // Ensure endpoint matches your backend route
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
  
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(response.data);
  
      const formattedProducts = response.data.map((product: any) => ({
        id: product.id,
        user_id: product.user_id,
        commodity: product.commodity,
        title: product.title,
        description: product.description,
        quantity: product.quantity,
        price: product.price,
        locate: product.locate,
        image: product.image,
        created_at: product.created_at,
        averageRating: product.ratings_avg_rate || 0, // Default to 0 if no ratings
        ratingsCount: product.ratings_count || 0, // Default to 0 if no ratings
      }));
  
      setProducts(formattedProducts);
      updateChartData(formattedProducts); // Adjust this function to work with formatted data
    } catch (err) {
      setError("Failed to fetch products. Please try again later.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  

  const isValidDate = (date: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD format
    return regex.test(date);
  };

  const handleFetchProducts = () => {
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      alert("Please enter valid dates in the format YYYY-MM-DD.");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be later than the end date.");
      return;
    }
    fetchProducts();
  };

  const updateChartData = (data: Product[]): void => {
    const categories = [
      "Imported Commercial Rice",
      "Local Commercial Rice",
      "Corn ",
      "Livestock & Poultry Products",
      "Fisheries",
      "Lowland Vegetables",
      "Highland Vegetables",
      "Fruits",
      "Species",
      "Rootcrops",
    ];
    const dataByCategory = categories.map((category) => {
      const filteredProducts = data.filter(
        (product) => product.title === category
      );
      const descriptionCounts = filteredProducts.reduce(
        (acc: any, product: Product) => {
          acc[product.commodity] = (acc[product.commodity] || 0) + 1;
          return acc;
        },
        {}
      );

      const chartFormattedData = Object.entries(descriptionCounts).map(
        ([commodity, count]) => ({
          name: commodity,
          population: count,
          color: getRandomColor(),
          legendFontColor: "#000",
          legendFontSize: 14,
        })
      );

      console.log('chart',chartFormattedData);

      return { category, chartFormattedData };
    });

    setChartDataByCategory(dataByCategory);
  };

  const getRandomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <ProtectedRoute>
    <View style={styles.container}>
    <ImageBackground
      source={icons.Agribid}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.datePickerContainer}>
        {/* Manual Input for Start Date */}
        <View style={styles.inputWrapper}>
          {isWeb ? (
            <ReactDatePicker
              selected={startDate ? new Date(startDate) : null}
              onChange={(date) => setStartDate(date.toISOString().split("T")[0])}
              placeholderText="Start Date"
              dateFormat="yyyy-MM-dd"
              className="react-datepicker-input"
            />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Start Date (YYYY-MM-DD)"
                value={startDate}
                onChangeText={setStartDate}
              />
              <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                <Text style={styles.pickerButton}>📅</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Manual Input for End Date */}
        <View style={styles.inputWrapper}>
          {isWeb ? (
            <ReactDatePicker
              selected={endDate ? new Date(endDate) : null}
              onChange={(date) => setEndDate(date.toISOString().split("T")[0])}
              placeholderText="End Date"
              dateFormat="yyyy-MM-dd"
              className="react-datepicker-input"
            />
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="End Date (YYYY-MM-DD)"
                value={endDate}
                onChangeText={setEndDate}
              />
              <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                <Text style={styles.pickerButton}>📅</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Native Date Pickers */}
        {!isWeb && showStartPicker && (
          <DateTimePicker
            value={startDate ? new Date(startDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartPicker(false);
              if (selectedDate) {
                setStartDate(selectedDate.toISOString().split("T")[0]);
              }
            }}
          />
        )}

        {!isWeb && showEndPicker && (
          <DateTimePicker
            value={endDate ? new Date(endDate) : new Date()}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndPicker(false);
              if (selectedDate) {
                setEndDate(selectedDate.toISOString().split("T")[0]);
              }
            }}
          />
        )}

        <TouchableOpacity onPress={handleFetchProducts} style={styles.fetchButton}>
          <Text style={styles.fetchButtonText}>Fetch Data</Text>
        </TouchableOpacity>
      </View>

      {isLoading && <ActivityIndicator size="large" color="#0000ff" style={styles.loadingIndicator} />}
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : products.length === 0 && !isLoading ? (
        <Text style={styles.noDataText}>No products found for the selected date range.</Text>
      ) : (
        <ScrollView>
        <View style={styles.gridContainer}>
          {chartDataByCategory.map(({ category, chartFormattedData }) => (
            <View key={category} style={styles.card}>
              <Text style={styles.chartTitle}>{category}</Text>
      
              {/* PieChart */}
              <PieChart
                data={chartFormattedData}
                width={Dimensions.get("window").width / 2.4}
                height={100}
                chartConfig={{
                  backgroundGradientFrom: "#fff",
                  backgroundGradientTo: "#fff",
                  color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
      
              {/* LineChart */}
              {chartFormattedData && chartFormattedData.length > 0 && (
                <LineChart
                  data={{
                    labels: chartFormattedData.map((data) => data.name), // Use commodity names
                    datasets: chartFormattedData.map((data, index) => ({
                      data: Array(chartFormattedData.length).fill(data.population), // Generate data for each commodity
                      color: () => data.color, // Use the same color as in the PieChart
                      strokeWidth: 2, // Set the stroke width for the lines
                    })),
                  }}
                  width={Dimensions.get("window").width / 2.4}
                  height={100}
                  chartConfig={{
                    backgroundGradientFrom: "#fff",
                    backgroundGradientTo: "#fff",
                    color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
      

      )}
    </ImageBackground>
  </View>
  </ProtectedRoute>
);
};

export default Sell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  backgroundImage: {
    width: "100%",
    height: "100%",
  },
  loadingIndicator: { marginTop: 20 },

  datePickerContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    fontSize: 16,
    padding: 5,
    width: 150,
  },
  pickerButton: {
    fontSize: 18,
    marginLeft: 20,
    color: "#007BFF",
  },
  fetchButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
  },
  fetchButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#888",
    marginTop: 20,
  },
  errorText: {
    textAlign: "center",
    color: "red",
    fontSize: 16,
    marginTop: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    width: Dimensions.get("window").width / 2.4,
    margin: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
});
