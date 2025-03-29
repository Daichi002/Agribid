import { MaterialIcons } from "@expo/vector-icons";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Button,
  Modal,
  Alert,
  TouchableWithoutFeedback,
} from "react-native";
import PrevailingPriceCalculator from "./PrevailingPriceCalculator";
import CustomButton from './CustomButton2';

// Mapping of categories to commodities
const initialCategories = {
  "Imported Commercial Rice": ["Premium"],
  "Local Commercial Rice": ["Special-Red Rice", "Special-Black Rice", "Special-Brown Rice", "Special-Glutinous(white)", "Special-Glutinous(tapol)", "Premium", "Regular", "Well-Milled"],
  "Corn": ["Yellow Corn Grit", "White Corn Grit"],
  "Livestock & Poultry Products": ["Pork Ham(Kasin)", "Pork Belly(liempo)", "Pork Chop", "Pork Ribs", "Pork Pata(hind)", "Whole Dressed Chicken(fully dressed)", "Chicken Eggs(medium)"],
  "Fisheries": ["Tilapia", "Bangus", "Alumahin", "Tamban"],
  "Lowland Vegetables": ["Ampalaya", "Sitao", "Pechay(Native)", "Squash", "Eggplant", "Tomato", "Sweet Pepper", "Cucumber", "Bottle Gourd(Upo)"],
  "Highland Vegetables": ["Cabbage", "Carrots", "Habitchuelas(baguio beans)", "White Potato", "Pichay(Baguio)", "Chayote"],
  "Fruits": ["Calamansi", "Banana(Cardava)", "Banana(Lakatan)", "Banana(Latundan)", "Papaya", "Mango", "Watermelon"],
  "Species": ["Red Onion", "White Onion(imported)", "Garlic(imported)", "Ginger", "Chilli(Labuyo)"],
  "Rootcrops": ["Sweet Potato"],
};

// Define category colors with transparency (alpha value)
const categoryColors: { [key: string]: string } = {
  "Imported Commercial Rice": "rgba(56, 142, 60, 0.7)",
  "Local Commercial Rice": "rgba(56, 142, 60, 0.7)",
  "Corn": "rgba(123, 31, 162, 0.7)",
  "Livestock & Poultry Products": "rgba(25, 118, 210, 0.7)",
  "Fisheries": "rgba(245, 124, 0, 0.7)",
  "Lowland Vegetables": "rgba(251, 192, 45, 0.7)",
  "Highland Vegetables": "rgba(25, 118, 210, 0.7)",
  "Fruits": "rgba(211, 47, 47, 0.7)",
  "Species": "rgba(56, 142, 60, 0.7)",
  "Rootcrops": "rgba(251, 192, 45, 0.7)",
};

interface CategoryCommodityInputProps {
  onSubmit: (data: any) => void;
  currentWeek: Array<{ category: string; commodity: string; price_range: string; prevailing_price_this_week: string }>;
}

export default function CategoryCommodityInput({ onSubmit, currentWeek }: CategoryCommodityInputProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [prices, setPrices] = useState<{ [category: string]: { [commodity: string]: { priceRange?: string; prevailingPrice?: string } } }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [newCommodity, setNewCommodity] = useState("");

  const [surveyModalVisible, setSurveyModalVisible] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);  
  const [selectedCategoryS, setSelectedCategoryS] = useState<string | null>(null);

  const selectedCategory = useRef<keyof typeof initialCategories>("Imported Commercial Rice");

  
  useEffect(() => {
    console.log("Current week changed to:", currentWeek); // Log the current week
    console.log("Categories:", categories); // Log the categories
  }, [categories,currentWeek]);

  const [activeField, setActiveField] = useState<string | null>(null);

  const handleFocusChange = (newField: string | null) => {
    setActiveField(newField); // Track the active input field
  };

  const handleInputChangeWithFocus = (category: string, commodity: string, field: string, value: string) => {
    // Add ".00" to prevailingPrice only when focus changes
    if (field === 'prevailingPrice' && activeField !== 'prevailingPrice') {
      value = value.includes('.') ? value : `${value}.00`;
    }

    // Process input change using your existing handler
    handleInputChange(category, commodity, field, value);
  };

  const handleInputChange = (category: string, commodity: string, field: string, value: string) => {
    if (field === "priceRange" || field === "prevailingPrice") {
      // Remove any invalid characters (allow only digits, decimals, and hyphen for range)
      let numericValue = value.replace(/[^0-9.\- ]/g, "");
  
      // Handle the case where the user enters a range (e.g., "23.40-30.50")
      if (numericValue.includes("-")) {
        // Ensure there are no spaces between the hyphen and the numbers
        numericValue = numericValue.replace(/\s+/g, "");
  
        // Split the range into two values
        let [minValue, maxValue] = numericValue.split("-").map(val => {
          // Clean up the individual values (remove extra spaces, if any)
          let cleanedValue = val.replace(/[^0-9.]/g, "");
  
          // Ensure there's only one decimal point and restrict the number of digits
          const parts = cleanedValue.split(".");
          if (parts.length > 2) {
            cleanedValue = parts[0] + "." + parts.slice(1).join(""); // Keep only one decimal point
          }
  
          // Ensure no more than 6 digits before the decimal and 2 after
          cleanedValue = cleanedValue.replace(/^(\d{5})\d+/, "$1");
          cleanedValue = cleanedValue.replace(/(\.\d{2})\d+/, "$1");
  
          return cleanedValue;
        });
  
        // Ensure both min and max values are valid (e.g., if one is missing, default to "0.00")
        minValue = minValue || "0.00";
        maxValue = maxValue || "";
  
        // Reconstruct the range with two values
        numericValue = `${minValue} - ${maxValue}`;
      } else {
        // Handle single values like "202.23" or "55.00"
        // Clean the value and ensure it's a valid numeric format with two decimals
        numericValue = numericValue.replace(/[^0-9.]/g, "");
  
        // Handle the case where the user enters a number with no decimals (e.g., "123213")
        if (!numericValue.includes(".")) {
          // Wait until user types at least 3 digits before appending ".00"
          if (numericValue.length >= 3) {
            numericValue += ".00";  // Add ".00" only if at least 3 digits are entered
          }
        } else {
          // Ensure there's no more than 2 decimal places
          const parts = numericValue.split(".");
          if (parts[1].length > 2) {
            numericValue = parts[0] + "." + parts[1].slice(0, 2);  // Keep only 2 decimal places
          }
        }
      }
  
      // Update state with the cleaned value (either a single value or range)
      setPrices((prevPrices) => ({
        ...prevPrices,
        [category]: {
          ...prevPrices[category],
          [commodity]: {
            ...prevPrices[category]?.[commodity],
            [field]: numericValue,
          },
        },
      }));
    }
  };
  
  
  
  
  
  

  const addCommodity = () => {
    if (newCommodity.trim() === "") {
      Alert.alert("Error", "Commodity name cannot be empty");
      return;
    }
    setCategories((prevCategories) => ({
      ...prevCategories,
      [selectedCategory.current]: [
        ...(prevCategories[selectedCategory.current] || []),
        newCommodity.trim(),
      ],
    }));
    setModalVisible(false);
    setNewCommodity("");
  };

  const deleteCommodity = (category: keyof typeof initialCategories, commodity: string) => {
    setCategories((prevCategories) => ({
      ...prevCategories,
      [category]: prevCategories[category].filter((item) => item !== commodity),
    }));
    setPrices((prevPrices) => {
      const updatedPrices = { ...prevPrices };
      delete updatedPrices[category]?.[commodity];
      return updatedPrices;
    });
  };

  const prepareDataForSubmission = () => {
    const dataToSubmit = Object.keys(categories).map((category) => ({
      category,
      commodities: categories[category as keyof typeof initialCategories].map((commodity) => ({
        name: commodity,
        priceRange: prices[category]?.[commodity]?.priceRange || "",
        prevailingPrice: prices[category]?.[commodity]?.prevailingPrice || "",
      })),
    }));
    console.log("Prepared data:", dataToSubmit); // Log the prepared data
    return dataToSubmit;
  };
  
  const handleSubmit = () => {
    const data = prepareDataForSubmission();
    console.log("Data to submit:", data); // Add this log to check the data
    onSubmit(data);
  };



  useEffect(() => {
    const transformedCategories = { ...initialCategories };
  
    currentWeek.forEach(({ category, commodity, price_range, prevailing_price_this_week }) => {
          const categoryKey = category as keyof typeof initialCategories;
          if (!transformedCategories[categoryKey]) {
            transformedCategories[categoryKey] = [];
          }
      
          if (!transformedCategories[categoryKey].includes(commodity)) {
            transformedCategories[categoryKey].push(commodity);
          }
  
      setPrices((prevPrices) => ({
        ...prevPrices,
        [category]: {
          ...(prevPrices[category] || {}),
          [commodity]: {
            priceRange: price_range || "",
            prevailingPrice: prevailing_price_this_week || "",
          },
        },
      }));
    });
  
    setCategories(transformedCategories);
  }, [currentWeek]);

  
  const handleCommodityClick = (commodity: string, category: string) => {
    setSelectedCommodity(commodity);
    setSelectedCategoryS(category);
    setSurveyModalVisible(true);

  };
  
  

  return (
    <View style={styles.container}>

<CustomButton title="Submit Data" onPress={handleSubmit} />

{Object.keys(categories).map((category) => (
  <View
    key={category}
    style={[
      styles.categoryContainer,
      { backgroundColor: categoryColors[category] || "#fff" },
    ]}
  >
    <View style={styles.categoryHeader}>
      <Text style={styles.categoryTitle}>{category}</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => {
          selectedCategory.current = category as keyof typeof initialCategories;
          setModalVisible(true);
        }}
      >
        <Text style={styles.buttonText}>Add Commodity</Text>
      </TouchableOpacity>
    </View>

    {categories[category as keyof typeof initialCategories]?.map((commodity) => (
      <View key={commodity} style={styles.commodityContainer}>
        <View style={styles.commodityRow}>
         
        <TouchableWithoutFeedback onPress={() => handleCommodityClick(commodity, category)}>
        <Text style={styles.commodityText}>{commodity}</Text>
      </TouchableWithoutFeedback>
         
          <TextInput
            style={styles.input}
            placeholder="Price Range"
            value={prices[category]?.[commodity]?.priceRange}
            onChangeText={(value) =>
              handleInputChangeWithFocus(category, commodity, "priceRange", value)
            }
            onFocus={() => handleFocusChange("priceRange")}
            onBlur={() => handleFocusChange(null)}
          />
          <TextInput
            style={styles.input}
            placeholder="Prevailing Price"
            value={prices[category]?.[commodity]?.prevailingPrice}
            onChangeText={(value) =>
              handleInputChangeWithFocus(category, commodity, "prevailingPrice", value)
            }
            onFocus={() => handleFocusChange("prevailingPrice")}
            onBlur={() => handleFocusChange(null)}
          />
          <TouchableOpacity
            onPress={() => deleteCommodity(category as keyof typeof initialCategories, commodity)}
            style={styles.deleteButton}
          >
            <MaterialIcons name="delete" size={24} color="red" />
          </TouchableOpacity>
        </View>
      </View>
    ))}
  </View>
))}


      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Commodity</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Commodity Name"
              value={newCommodity}
              onChangeText={setNewCommodity}
            />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addCommodity}>
              <Text style={styles.buttonTextadd}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          </View>
        </View>
      </Modal>

      <Modal
  visible={surveyModalVisible}
  transparent={true}
  animationType="slide"
  onRequestClose={() => setSurveyModalVisible(false)}
>
  <View style={styles.surveyModalContainer}>
    <View style={styles.surveyModalContent}>
      <Text style={styles.surveyModalTitle}>{selectedCommodity} PRP</Text>

      {/* Pass required props to PrevailingPriceCalculator */}
      <PrevailingPriceCalculator
      selectedCommodity={selectedCommodity || ""}
      category={selectedCategoryS || ""}
      updatePrices={(prp, priceRange) => {
        console.log("PRP:", prp, "Price Range:", priceRange);
        
        setPrices((prevPrices) => ({
          ...prevPrices,
          [selectedCategoryS || ""]: {
            ...(prevPrices[selectedCategoryS || ""] || {}),
            [selectedCommodity || ""]: {
              ...(prevPrices[selectedCategoryS || ""]?.[selectedCommodity || ""] || {}),
              priceRange: priceRange || "",
              prevailingPrice: prp || "",
            },
          },
        }));
      }}
      closeModal={() => setSurveyModalVisible(false)}
    />

      <Button title="Close" onPress={() => setSurveyModalVisible(false)} />
    </View>
  </View>
</Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  categoryContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 5,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  commodityContainer: {
    marginBottom: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
  },
  commodityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commodityText: {
    fontSize: 12,
    flex: 1,
    // paddingRight: 5,
    width: "40%",
  },
  input: {
    width: "35%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 5,
    backgroundColor: "#fff",
    fontSize: 12,
  },
  deleteButton: {
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "80%",
    padding: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalInput: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    padding: 8,
    marginBottom: 20,
  },

  button: {
    backgroundColor: '#007bff', // Blue color (change as needed)
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: 10,
  },
  buttonText: {
    color: '#fff', // White text
    fontSize: 10,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Aligns buttons side by side
    marginTop: 10,
  },
  addButton: {
    backgroundColor: '#28a745', // Green color for "Add"
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1, // Makes buttons equal width
    marginRight: 5, // Adds spacing between buttons
  },
  cancelButton: {
    backgroundColor: '#007bff', // Blue color for "Cancel"
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginLeft: 5,
  },
  buttonTextadd: {
    color: '#fff', // White text
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  surveyModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  surveyModalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  surveyModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  surveyModalText: {
    fontSize: 16,
    marginBottom: 20,
  },
});
