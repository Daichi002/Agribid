import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window'); 

// Define category colors with transparency (alpha value)
const categoryColors = {
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

interface SideModalProps {
  isVisible: boolean;
  onClose: () => void;
  srpData: any;
}

const SideModal: React.FC<SideModalProps> = ({ isVisible, onClose, srpData }) => {
  const slideAnim = useRef(new Animated.Value(-200)).current; // Initial off-screen position
  const opacityAnim = useRef(new Animated.Value(0)).current; // Initial transparency

 // Trigger animations based on isVisible
 useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 20, // Final position from the left
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1, // Fully visible
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -500, // Off-screen position
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0, // Fully transparent
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);


  // Fetch category color or fallback to default
 // Safe check for srpData and category
 const categoryColor = srpData && srpData.length > 0 && categoryColors[srpData[0].category]
 ? categoryColors[srpData[0].category]
 : "rgba(0, 0, 0, 0.7)"; // Default to black if no color or no category found

  // Calculate lighter color (adjust alpha value for lightness)
  const lightenColor = (color) => {
    const rgba = color.match(/\d+/g); // Extract RGB values from rgba string
    if (rgba) {
      const [r, g, b, a] = rgba;
      const lightenFactor = 0.2; // Factor to lighten the color
      return `rgba(${r}, ${g}, ${b}, ${Math.min(parseFloat(a) + lightenFactor, 1)})`; // Increase alpha to lighten
    }
    return color; // Return original color if parsing fails
  };

  const lightCategoryColor = lightenColor(categoryColor); // Get lighter version of the category color

  return (
    <Animated.View
      style={[
        styles.modalBox,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.headerText}>COMMODITIES SRP</Text>

        <View style={styles.container}>
            {srpData && srpData.length > 0 ? (
              <View>
                {/* Category with its original color */}
                <Text style={[styles.categoryText, { backgroundColor: categoryColor }]}>
                  Category: {srpData[0].category}
                </Text>

                {/* Other details with the lightened category color */}
                <Text style={[styles.lightText, { backgroundColor: lightCategoryColor }]}>
                  Commodity: {srpData[0].commodity}
                </Text>
                <Text style={[styles.lightText, { backgroundColor: lightCategoryColor }]}>
                  Price Range: {srpData[0].price_range}
                </Text>
                <Text style={[styles.lightText, { backgroundColor: lightCategoryColor }]}>
                  Prevailing Prices this week: {srpData[0].prevailing_price_this_week}
                </Text>
                <Text style={[styles.lightText, { backgroundColor: lightCategoryColor }]}>
                  Prevailing Prices last week: {srpData[0].prevailing_price_last_week}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectCategoryText}>Select Category and Commodity First</Text>
            )}
        </View>
      </View>

      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalBox: {
    position: 'absolute',
    top: '10%',
    left: 0,
    width: width * 0.85,
    height: '70%', // Fixed height for the modal
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'flex-start', // Make sure content starts from the top
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
    flexDirection: 'column', // Stack content vertically
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center', // Align content to the top
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    borderBottomWidth: 1, // Underline the header
    width: '100%',
    paddingBottom: 5,
  },
  container: {
    flex: 1,
    justifyContent: 'center', // Align content to the top
    alignItems: 'center', // Align text to the left
    width: '100%',
    height: 150,
    paddingTop: 10,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 5,
    padding: 1,
    color: '#fff', // White text for contrast
    marginBottom: 8,
    borderRadius: 5,
    textAlign: 'center', // Center the text
    flexShrink: 1, // Allow the text to shrink
    overflow: 'visible', // Ensure overflow is visible and not hidden
    flexGrow: 0, // Ensures the container does not grow, but shrinks if necessary
  },
  
  lightText: {
    fontSize: 14,
    color: '#757575', // Light gray text
    marginVertical: 5,
    paddingHorizontal: 5,
    padding: 1,
    borderRadius: 5,
    flexShrink: 1,
    overflow: 'visible', // Ensure overflow is visible
    flexGrow: 0, // Prevents it from growing, and allows it to shrink if necessary
  },
  
  selectCategoryText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'gray',
    textAlign: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    elevation: 2,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'green',
    borderRadius: 5,
    alignSelf: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


export default SideModal;
