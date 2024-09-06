import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, Image, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { Picker } from '@react-native-picker/picker';

import axios from "axios";
import { useNavigation } from "@react-navigation/native";
import ProductDetails from "../../components/productdetails";

import { icons } from "../../constants";


const Sell = () => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortCriteria, setSortCriteria] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [price, setPrice] = useState("");
  const [filterOption, setFilterOption] = useState("locate");
  const [filterLetters, setFilterLetters] = useState("");
  const [currentDate] = useState(new Date().toLocaleDateString());
  const [selectedProduct, setSelectedProduct] = useState(null);

  const categories = ["Fruits", "Poultry", "Fish", "Vegetable", "Crops"];// category filter options
  const locations = ["Location 1", "Location 2", "Location 3"];//location filter options

  const navigation = useNavigation();


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

    //go to product details
  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    console.log('i am getting pass',product);
    navigation.navigate("ProductDetails", { product });
  };

  //search query
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
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

  //fix this sort base on date latest must be on top 
  .sort((a, b) => {
    // Sort by created_at date (ascending or descending)
    const dateA = new Date(a.created_at);
    const dateB = new Date(b.created_at);

    // Change sort order dynamically based on sortOrder value ///still need fixing ahhhhhhhh!!!!!!!!
    return sortOrder === "asc" ? dateB - dateA : dateA - dateB;
  });

  const renderItem = ({ item }) => (
    <View style={styles.productItem}>
      <Image source={{ uri: `http://localhost:8000/storage/product/images/${item.image}` }} style={styles.productImage} />
      <View>
        {/* plan of change layout of sort  */}
        <Text style={styles.productTitle}>{item.title}</Text>
        <Text style={styles.productDescription}>Description: {item.description}</Text>
        <Text style={styles.productDescription}>Located: {item.locate}</Text>
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
          <TouchableOpacity onPress={() =>  navigation.navigate("createsell")}>
              <Text style={styles.addProductLink}>Post to Sell</Text>
            </TouchableOpacity>
            <Text style={styles.totalProducts}>Total Post: {totalProducts}</Text>
          </View>
          <View style={styles.searchSortFilter}>
            <TextInput
              style={styles.search}
              placeholder="Search here"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <View style={styles.sortFilterContainer}>
              <Image 
              source={icons.slider} 
              style={styles.slider}
              resizeMode="contain" // Ensure the image fits within the circular container
              /> 
            <View style={styles.dropdownContainer}>              
                <Picker
                  selectedValue={sortCriteria}
                  onValueChange={(itemValue) => setSortCriteria(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Category" value="" style={styles.pickerItem}  />
                  {categories.map((category, index) => (
                    <Picker.Item key={index} label={category} value={category} />
                  ))}
                </Picker>
              </View>

                <View style={styles.dropdownContainer}>
                  <Picker
                    selectedValue={filterOption}
                    onValueChange={(itemValue) => setFilterOption(itemValue)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Location" value="" />
                    {locations.map((location, index) => (
                      <Picker.Item key={index} label={location} value={location} />
                    ))}
                  </Picker>
                </View>
                <View style={styles.dropdownContainer}>                
                <TextInput
                    style={styles.picker}
                    placeholder="Enter Price"
                    value={price}
                    onChangeText={(text) => {
                      // Ensure the input contains only numbers
                      if (/^\d*\.?\d*$/.test(text)) {
                        setPrice(text);
                      }
                    }}
                    keyboardType="numeric" // Show numeric keyboard
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

export default Sell;

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
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  totalProducts: {
    fontSize: 16,
  },
  searchSortFilter: {
    marginBottom: 20,
  },
  slider: {
    width: 30, // Adjust size as needed
    height: 30,
    marginRight: 10, // Space between slider and next element
  },


  picker: {
    height: 40, // Slightly taller to ensure visibility of text
    flex: 1, // Take up available space
    backgroundColor: '#B4CBB7',
    borderColor: 'black',
    borderWidth: 1,
    textAlign: 'center',
    paddingHorizontal: 10, // Add padding for better text visibility
    width: '100%', // Ensure it scales with screen size
    minHeight: 40, // Ensure usability on smaller screens
    marginVertical: 10, // Add vertical margin for better spacing
    layout: 'fix'
  },

  dropdownContainer: {
    flex: 1,
    marginHorizontal: 5, // Space between dropdowns
    marginVertical: 5, // Space between dropdowns and other elements
  },

  input: {
    height: 30,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginHorizontal: 5, // Space between input fields
    flex: 1, // Make input fields flexible
  },
  sortFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out children evenly
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    backgroundColor: '#fff',
    maxWidth: '100%',
    alignSelf: 'center',
    overflow: 'hidden',
  },
  sortBar: {
    flex: 1, // Allow the sort bar to take up available space
    marginRight: 10, // Space between sort bar and filter bar
  },
  filterBar: {
    flex: 1, // Allow the filter bar to take up more space
    flexDirection: 'row', // Arrange filter elements horizontally
    alignItems: 'center', // Align items vertically in the center
  },

  search: {
    height: 40,
    width: '50%',
    borderWidth: 1,
    borderColor: '#ccc',
    alignSelf: 'start'
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
    alignItems: 'center',
  },
  productImage: {
    width: 100,  // Ensure width is not too small
    height: 100, // Ensure height is not too small
    resizeMode: 'cover',
    borderRadius: 5, // Optional: rounded corners
    marginRight: 10, // Space between image and text
    backgroundColor: '#e0e0e0', // Optional: a background color to debug
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