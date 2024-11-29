import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions, ScrollView, Image, ImageBackground} from "react-native";
import axios from "axios";
import { PieChart } from "react-native-chart-kit";
import BASE_URL from '../../components/ApiConfig';
import { icons } from "../../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Sell = () => {
  interface Product {
    title: string;
    description: string;
    image: string;
    price: number;
    locate: string;
  }
  
  const [products, setProducts] = useState<Product[]>([]);
  const [chartDataByCategory, setChartDataByCategory] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found');
            return;
        }

        const response = await axios.get(`${BASE_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
      });

        setProducts(response.data);
        updateChartData(response.data);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  interface DescriptionCounts {
    [key: string]: number;
  }

  interface ChartFormattedData {
    name: string;
    population: number;
    color: string;
    legendFontColor: string;
    legendFontSize: number;
  }

  interface DataByCategory {
    category: string;
    chartFormattedData: ChartFormattedData[];
  }

  const updateChartData = (data: Product[]): void => {
    const categories: string[] = [ "Imported Commercial Rice",
      "Local Commercial Rice",
      "Corn ",
      "Livestock & Poultry Products",
      "Fisheries",
      "Lowland Vegetables",
      "Highland Vegetables",
      "Fruits",
      "Species",
      "Rootcrops",];
    const dataByCategory: DataByCategory[] = categories.map((category) => {
      const filteredProducts: Product[] = data.filter((product) => product.title === category);
      const descriptionCounts: DescriptionCounts = filteredProducts.reduce((acc: DescriptionCounts, product: Product) => {
        acc[product.description] = (acc[product.description] || 0) + 1;
        return acc;
      }, {});

      const chartFormattedData: ChartFormattedData[] = Object.entries(descriptionCounts).map(([description, count]) => ({
        name: description,
        population: count,
        color: getRandomColor(),
        legendFontColor: "#000",
        legendFontSize: 14,
      }));

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

  interface HandleViewMore {
    (category: string): void;
  }

  const handleViewMore: HandleViewMore = (category) => {
    const filteredProducts = products.filter((product) => product.title === category);
    setSelectedCategory(category);
    setCategoryProducts(filteredProducts);
    setModalVisible(true);
  };

  const renderCategoryDetails = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalHeader}>
            {selectedCategory} Products
          </Text>
          {/* Total Post Count */}
          <Text style={styles.totalPosts}>
            Total Posts: {categoryProducts.length}
          </Text>
          <View style={styles.productList}>
            {categoryProducts.map((item, index) => (
              <View key={index} style={styles.productItem}>
                {/* Product Image */}
                <Image
                  source={{
                    uri: `${BASE_URL}/storage/product/images/${item.image}`,
                  }}
                  style={styles.productImage}
                />
                {/* Product Details */}
                <Text style={styles.productText}>
                  Description: {item.description}
                </Text>
                <Text style={styles.productText}>Price: ₱{item.price}</Text>
                <Text style={styles.productText}>
                  Location:{" "}
                  {item.locate
                    ? item.locate
                    : "Location data not available"}
                </Text>
              </View>
            ))}
          </View>
          {/* Close Modal Button */}
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
          source={icons.Agribid} // Your image source
          style={styles.backgroundImage} // Style for the image
          resizeMode="cover" // You can use 'contain' or 'cover' depending on the effect you want
        >

      {renderCategoryDetails()}
      <ScrollView>
        <View style={styles.gridContainer}>
          {chartDataByCategory.map(({ category, chartFormattedData }) => (
            <View key={category} style={styles.card}>
              <Text style={styles.chartTitle}>{category}</Text>
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
              <TouchableOpacity
                onPress={() => handleViewMore(category)}
                style={styles.viewMoreButton}
              >
                <Text style={styles.viewMoreText}>View More</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      </ImageBackground>
    </View>
  );
};

export default Sell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: 10,
  },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  totalPosts: {
    fontSize: 16,
  },
  viewMoreButton: {
    marginTop: 10,
    backgroundColor: "#f0f0f0",
    padding: 8,
    borderRadius: 5,
  },
  viewMoreText: {
    fontSize: 14,
    color: "#0066cc",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 10,
    alignSelf: "center",
    padding: 20,
    maxHeight: "80%",
    width: "60%",
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  productList: {
    marginBottom: 20,
  },
  productItem: {
    padding: 10,
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  productImage: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  productText: {
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
