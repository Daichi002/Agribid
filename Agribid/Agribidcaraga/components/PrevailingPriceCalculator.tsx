import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, ScrollView, TouchableOpacity } from "react-native";

interface PrevailingPriceCalculatorProps {
  selectedCommodity: string;
  category: string;
  updatePrices: (prevailingPrice: string, priceRange: string ) => void;
  closeModal: () => void; // Function to close the modal
}

const PrevailingPriceCalculator: React.FC<PrevailingPriceCalculatorProps> = ({ selectedCommodity, category, updatePrices, closeModal }) => {
  const [prices, setPrices] = useState<string[]>(Array(5).fill("")); // Default 5 inputs

  const [prp, setPrp] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  const handleInputChange = (value: string, index: number) => {
    const regex = /^(?:\d{1,3}(\.\d{0,2})?)?$/; // Matches 1-3 digits and optional 2 decimals
    if (regex.test(value)) {
      const newPrices = [...prices];
      newPrices[index] = value;
      setPrices(newPrices);
    }
  };

  const handleInputBlur = (index: number) => {
    setPrices((prevPrices) => {
      const updatedPrices = [...prevPrices];
      const currentValue = updatedPrices[index];

      if (currentValue && !currentValue.includes(".")) {
        updatedPrices[index] = `${currentValue}.00`; // Append ".00" if no decimal
      } else if (currentValue && /^\d+\.$/.test(currentValue)) {
        updatedPrices[index] = `${currentValue}00`; // Handle case when only "." is left
      }

      return updatedPrices;
    });
  };

  const handleDeleteStore = (index: number) => {
    const newPrices = [...prices];
    newPrices.splice(index, 1);
    setPrices(newPrices);
  };

  const addStore = () => {
    setPrices([...prices, ""]); // Add a new empty price input
  };

  const computePRP = () => {
    const numericPrices = prices.map(Number).filter((p) => !isNaN(p));

    if (numericPrices.length < 3) {
      alert("Please enter at least 3 valid prices.");
      return;
    }

    numericPrices.sort((a, b) => a - b);

    const minPrice = numericPrices[0];
    const maxPrice = numericPrices[numericPrices.length - 1];
    const computedPriceRange = `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)}`;

    const trimmedPrices = numericPrices.slice(1, numericPrices.length - 1);
    const computedPrp = (trimmedPrices.reduce((sum, price) => sum + price, 0) / trimmedPrices.length).toFixed(2);

    // ✅ Call `updatePrices` with correct values
    updatePrices(computedPrp, computedPriceRange);
    
    closeModal();
    
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter Prices:</Text>

      <ScrollView style={styles.listContainer}>
        {prices.map((price, index) => (
          <View key={index} style={styles.inputRow}>
            <Text style={styles.storeLabel}>Store {index + 1}</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Price"
              value={prices[index]}
              onChangeText={(value) => handleInputChange(value, index)}
              onBlur={() => handleInputBlur(index)}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={() => handleDeleteStore(index)} style={styles.deleteButton}>
              <Text style={styles.deleteText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={addStore}>
        <Text style={styles.buttonText}>+ Add Store</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.computeButton} onPress={computePRP}>
        <Text style={styles.buttonText}>Get PRP & Price Range</Text>
      </TouchableOpacity>

      {prp !== null && priceRange !== null && (
        <View style={styles.resultContainer}>
          <Text style={styles.result}>PRP: {prp.toFixed(2)} PHP</Text>
          <Text style={styles.result}>
            Price Range: {priceRange.min.toFixed(2)} - {priceRange.max.toFixed(2)} PHP
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  listContainer: {
    width: "100%",
    maxHeight: 250,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 5,
    borderRadius: 5,
    marginBottom: 8,
  },
  storeLabel: {
    width: "30%",
    fontSize: 14,
    fontWeight: "bold",
  },
  input: {
    width: "50%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingLeft: 10,
  },
  resultContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "red",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  deleteText: {
    color: "white",
    fontWeight: "bold",
  },
  result: {
    fontSize: 16,
    fontWeight: "bold",
    color: "green",
    marginTop: 5,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: "center",
    width: "100%",
  },
  computeButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});

export default PrevailingPriceCalculator;
