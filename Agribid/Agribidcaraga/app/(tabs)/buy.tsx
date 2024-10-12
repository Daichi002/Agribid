import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Image, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const Buy = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterOption, setFilterOption] = useState("");
  const [filterLetters, setFilterLetters] = useState("");
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [selectedProduct, setSelectedProduct] = useState(null);

  const navigation = useNavigation();

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/api/products?sort=${sortCriteria}&order=${sortOrder}`);
        const enhancedProducts = response.data.map((product) => ({
          ...product,
          created_at: currentDate,
        }));
        setProducts(enhancedProducts);
        setTotalProducts(enhancedProducts.length);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, [currentDate, sortCriteria, sortOrder]);

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    navigation.navigate("ProductDetails", { product });
  };

  const filteredProducts = products
    .filter((product) =>
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .filter((product) => {
      if (filterOption === "") return true;
      const name = product.title.toLowerCase();
      const letters = filterLetters.toLowerCase();
      if (filterOption === "starts_with") {
        return name.startsWith(letters);
      } else if (filterOption === "ends_with") {
        return name.endsWith(letters);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortCriteria === "title") {
        const compareResult = a.title.localeCompare(b.title);
        return sortOrder === "asc" ? compareResult : -compareResult;
      } else if (sortCriteria === "created_at") {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }
      return 0;
    });

  const renderItem = ({ item }) => (
    <View style={styles.productItem}>
      <Image source={{ uri: `http://localhost:8000/storage/product/image/${item.image}` }} style={styles.productImage} />
      <View>
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productDescription}>Description: {item.description}</Text>
        <Text style={styles.productDate}>Date Created: {new Date(item.created_at).toLocaleDateString()}</Text>
        <Button title="View" onPress={() => handleViewDetails(item)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {selectedProduct ? (
        <ProductDetails product={selectedProduct} onBack={() => setSelectedProduct(null)} />
      ) : (
        <>
          <View style={styles.dashboard}>
            <TouchableOpacity onPress={() => navigation.navigate("createsell")}>
              <Text style={styles.addProductLink}>Buy</Text>
            </TouchableOpacity>
            <Text style={styles.totalProducts}>Total Post: {totalProducts}</Text>
          </View>
          <View style={styles.searchSortFilter}>
            <TextInput
              style={styles.input}
              placeholder="Search here"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.sortFilterContainer}>
              <View style={styles.sortBar}>
                <Text>Sort by:</Text>
                <TextInput style={styles.input} value={sortCriteria} onChangeText={setSortCriteria} />
                <Button title={sortOrder === "asc" ? "Ascending" : "Descending"} onPress={toggleSortOrder} />
              </View>
              <View style={styles.filterBar}>
                <Text>Filter by Name:</Text>
                <TextInput style={styles.input} value={filterOption} onChangeText={setFilterOption} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter letter"
                  value={filterLetters}
                  onChangeText={setFilterLetters}
                />
              </View>
            </View>
          </View>
          <FlatList
            data={filteredProducts}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.inventory}
          />
        </>
      )}
    </View>
  );
};

export default Buy;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f0f0f0",
  },
  welcomeMessage: {
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  subText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
  },
  linkText: {
    color: "#0066cc",
    textDecorationLine: "underline",
  },
  dashboard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  addProductLink: {
    fontSize: 16,
    color: "#0066cc",
    textDecorationLine: "underline",
  },
  totalProducts: {
    fontSize: 16,
  },
  searchSortFilter: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
  sortFilterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sortBar: {
    flex: 1,
    marginRight: 10,
  },
  filterBar: {
    flex: 1,
    marginLeft: 10,
  },
  inventory: {
    paddingBottom: 20,
  },
  productItem: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  productImage: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  productDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  productDate: {
    fontSize: 12,
    marginTop: 5,
    color: "#777",
  },
});