import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Modal, StyleSheet, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from './CustomButton2';
import { icons } from '@/constants';
import { ScrollView } from 'react-native-gesture-handler';

// Define category colors with transparency (alpha value)
type CategoryColors = {
  [key: string]: string;
};

const categoryColors: CategoryColors = {
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

interface CommodityPriceListProps {
  data: any; // Replace 'any' with the appropriate type if known
}

const CommodityPriceList: React.FC<CommodityPriceListProps> = ({ data }) => {
  const [srp, setSrp] = useState<{ [key: string]: WeekData } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null); // To store the selected week for modal
  const [week, setWeek] = useState<string>(''); // To store the selected week for modal
  const [lastweek, setlastweek] = useState<string | null>(null); // To store the selected week for modal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // To store the selected category for modal

  useEffect(() => {
    getSrpData();
  }, []);

  const getSrpData = async () => {
    try {
      const storedData = await AsyncStorage.getItem('srpData');
      if (storedData) {
        const data = JSON.parse(storedData);
        // console.log("Retrieved data from AsyncStorage:", data);
        setSrp(data);
      } else {
        console.log("No data found in AsyncStorage");
      }
    } catch (error) {
      console.error("Error retrieving data from AsyncStorage:", error);
    }
  };

  // Render a single commodity with light/dark color coding
  const renderCommodityPreview = (item: { commodity: string; price_range: string; prevailing_price_this_week: string; prevailing_price_last_week: string }, index: number, categoryColor: string) => {
    // Use the provided categoryColor for the background
    const backgroundColor =
      index % 2 === 0
        ? categoryColor // Use base color for even items
        : categoryColor.replace(/0\.\d+\)$/, "0.4)"); // Adjust opacity for a lighter shade on odd items

    return (
      <View style={styles.commodityPreviewContainer} key={item.commodity}>
        <Text style={[styles.commodityText, { backgroundColor }]}>{item.commodity}</Text>
        <Text style={[styles.commodityText, { backgroundColor }]}>{item.price_range}</Text>
        <Text style={[styles.commodityText, { backgroundColor }]}>
          {item.prevailing_price_this_week} / {item.prevailing_price_last_week}
        </Text>
      </View>
    );
  };

  const handlePreviewClick = (weekKey: string, categoryKey: string, weekTitle: string, lastweek: string) => {
    setSelectedWeek(weekKey);
    setWeek(weekTitle)
    setlastweek(lastweek)
    setSelectedCategory(categoryKey);
    };

  const renderCategoryPreview = (item: { category: string; items: { commodity: string; price_range: string; prevailing_price_this_week: string; prevailing_price_last_week: string }[] }, lastweek: string) => {
    // Fetch category-specific color or fallback to black
    const categoryColor = categoryColors[item.category];

    // Debugging logs
    // console.log("Category:", item.category);
    // console.log("Category Color:", categoryColor);
    // console.log("Last Week:", lastweek);

    if (!categoryColor) {
      console.warn(`No color defined for category: ${item.category}`);
    }

    return (
      <View style={styles.categoryContainer}>
        {/* Category Title with Background Color */}
        <View style={styles.nameplate}>
          <Text style={styles.text}>Commodities</Text>
          <Text style={styles.text}>|</Text>
          <Text style={styles.text}>PriceRange</Text>
          <Text style={styles.text}>|</Text>
          <View style={styles.prevailingContainer}>
            <Text style={styles.text}>Prevailing prices</Text>
            <View style={styles.weeknameplateContainer}>
              <Text style={styles.weektext}>This week</Text>
              <Text style={styles.weektext}>|</Text>
              <View>
              <Text style={styles.weektext}>Last week</Text>
              <Text style={styles.weekDate}>{lastweek}</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={[styles.categoryTitle, { backgroundColor: categoryColor || "rgba(0, 0, 0, 0.7)" }]}>
          {item.category}
        </Text>
        {/* Render commodities while passing the categoryColor */}
        {item.items.map((commodity, index) =>
          renderCommodityPreview(commodity, index, categoryColor)
        )}
      </View>
    );
  };

  interface WeekData {
    week: string;
    lastWeek: string;
    weekdata: {
      [key: string]: {
        category: string;
        items: {
          commodity: string;
          price_range: string;
          prevailing_price_this_week: string;
          prevailing_price_last_week: string;
        }[];
      };
    };
  }
  
  const renderWeekPreview = ({ item, index }: { item: string; index: number }) => {
    if (!srp) {
      return null;
    }
    const weekData: WeekData = srp[item];

    // Function to format the date as "Nov-24"
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.toLocaleString('default', { month: 'short' }); // Get abbreviated month
    const day = date.getDate(); // Get the day
    return `${month}-${day}`;
  };

  // Extract and format the start and end dates
  const weekRange = weekData.week.split(" - ");
  const startDateFormatted = formatDate(weekRange[0]);
  const endDateFormatted = formatDate(weekRange[1]);

  const weekTitle = `${startDateFormatted}-${endDateFormatted}`; // Combine them into "Nov-24-Nov30"

  // Extract and format the start and end dates
  const lastweekRange = weekData.lastWeek.split(" - ");
  const laststartDateFormatted = formatDate(lastweekRange[0]);
  const lastendDateFormatted = formatDate(lastweekRange[1]);

  const lastweek = `${laststartDateFormatted}-${lastendDateFormatted}`; 

  // console.log("Formatted Week:", weekTitle, lastweek);


    // console.log("Week Data:", weekTitle, weekData);
    // Check if weekData exists and has the 'weekdata' property
    if (!weekData || !weekData.weekdata) {
      console.warn(`No weekdata found for ${weekTitle}`);
      return null; // Don't render anything if weekdata is missing
    }
  
    // Get the first category of the week for preview
    const firstCategory = Object.values(weekData.weekdata)[0];
  
    return (
      <View key={index} style={styles.weekContainer}>
        <TouchableOpacity onPress={() => handlePreviewClick(item, firstCategory.category, weekTitle, lastweek)}>
          <Text style={styles.weekTitle}>{weekTitle}</Text>
          <FlatList
            data={[firstCategory]} // Only the first category is shown in the preview
            renderItem={({ item }) => renderCategoryPreview(item, lastweek)}
            keyExtractor={(item, idx) => idx.toString()}
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  

  const renderFullCategory = ({ item }: { item: { category: string; items: { commodity: string; price_range: string; prevailing_price_this_week: string; prevailing_price_last_week: string }[] } }) => {
    const categoryColor = categoryColors[item.category] || "rgba(0, 0, 0, 0.7)"; // Default to black if no color
    return (
      <View style={styles.categoryContainer}>
        <Text style={[styles.categoryTitle, { backgroundColor: categoryColor }]}>{item.category}</Text>
        {item.items.map((commodity, index) => renderCommodityPreview(commodity, index, categoryColor))}
      </View>
    );
  };

  const closeModal = () => {
    setSelectedWeek(null);
    setSelectedCategory(null);
  };

  return (
    <View style={styles.container}>
      {srp ? (
        <FlatList
          data={Object.keys(srp)} // Week data
          renderItem={renderWeekPreview}
          keyExtractor={(item, idx) => idx.toString()}
        />
      ) : (
        <Text>Loading...</Text>
      )}

      {/* Modal to show full week data */}
      <Modal
        visible={selectedWeek !== null && selectedCategory !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
            <Text style={styles.modalTitle}>Week: {week}</Text>

            {/* <TouchableOpacity
            onPress={closeModal}
            style={styles.buttonContainer}
          >
            <View style={styles.buttonContent}>
              <Image
                source={icons.create2} 
                style={styles.icon}
                resizeMode="contain"
              />
              <Text style={styles.buttonText}>
                Close 
              </Text>
            </View>
          </TouchableOpacity> */}
            </View>
            <View style={styles.nameplate}>
              <>
              <Text style={styles.text}>Commodities</Text>
              <Text style={styles.text}>|</Text>
              <Text style={styles.text}>PriceRange</Text>
              <Text style={styles.text}>|</Text>
              </>
              <View style={styles.prevailingContainer}>               
                <Text style={styles.text}>Prevailing prices</Text>
                <View style={styles.weeknameplateContainer}>
                  <Text style={styles.weektext}>This week</Text>
                  <Text style={styles.weektext}>|</Text>
                  <View>
                  <Text style={styles.weektext}>Last week</Text>
                  <Text style={styles.weekDate}>{lastweek}</Text>
                  </View>
                </View>
              </View>
            </View>
          <ScrollView>
            {selectedWeek && srp && srp[selectedWeek] && (
              console.log("Selected Week:", selectedWeek),
              <FlatList
                data={Object.values(srp[selectedWeek].weekdata)} // All categories for selected week
                renderItem={renderFullCategory}
                keyExtractor={(item, idx) => idx.toString()}
              />
            )}
          </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    justifyContent: 'center', // Center vertically
    alignItems: 'center', // Center horizontally
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },  
  weekContainer: {
    marginBottom: 15,
    backgroundColor: 'white',
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    borderWidth: 1,
  },
  categoryTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    paddingLeft: 5,
    marginBottom: 5,
  },
  categoryContainer: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
  },
  commodityPreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  commodityText: {
    flex: 1,
    fontSize: 20,
    textAlign: 'center',
    margin: 2,
  },
  nameplate: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 150,
    paddingBottom: 10,
  },
  text: {
    fontSize: 30,
    fontWeight: 'bold',
    marginRight: 8,
  },
  prevailingContainer: {
    alignItems: 'center',
  },
  weeknameplateContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  weektext: {
    fontSize: 20,
    marginHorizontal: 5,
  },
  weekDate:{
    fontSize: 15,
    marginHorizontal: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 10,
    width: '90%',
    height: '90%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#00796b',
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  icon: {
    width: 30,
    height: 30,
  },
  buttonContainer: {
    backgroundColor: '#28a745',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CommodityPriceList;
