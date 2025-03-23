import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';


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

interface CommodityPriceListProps {
  data: any; // Replace 'any' with the appropriate type if known
}

const CommodityPriceList: React.FC<CommodityPriceListProps> = ({ data}) => {
  interface WeekData {
    week: string;
    lastWeek: string;
    weekdata: { [key: string]: CategoryItem };
  }

  // const [srp, setSrp] = useState<{ [key: string]: WeekData } | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null); // To store the selected week for modal
  const [week, setWeek] = useState<string>(''); // To store the selected week for modal
  const [lastweek, setlastweek] = useState<string | null>(null); // To store the selected week for modal
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null); // To store the selected category for modal
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // const onRefresh = useCallback(async () => {
  //   setIsRefreshing(true);
  //   await getSrpData();
  //   Toast.show('Srp List updated', Toast.SHORT);
  //   setIsRefreshing(false);
  // }, []);

  // useEffect(() => {
  //   getSrpData();
  // }, []);

  // const getSrpData = async () => {
  //   try {
  //     const storedData = await AsyncStorage.getItem('srpData');
  //     if (storedData) {
  //       const data = JSON.parse(storedData);
  //       console.log("Retrieved data from AsyncStorage:", data);
  //       setSrp(data);
  //     } else {
  //       console.log("No data found in AsyncStorage");
  //     }
  //   } catch (error) {
  //     console.error("Error retrieving data from AsyncStorage:", error);
  //   }
  // };

  // Render a single commodity with light/dark color coding
  interface CommodityItem {
    commodity: string;
    price_range: string;
    prevailing_price_this_week: string;
    prevailing_price_last_week: string;
  }

  const renderCommodityPreview = (item: CommodityItem, index: number, categoryColor: string) => {
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

  interface HandlePreviewClickParams {
    weekKey: string;
    categoryKey: string;
    weekTitle: string;
    lastweek: string;
  }

  const handlePreviewClick = ({ weekKey, categoryKey, weekTitle, lastweek }: HandlePreviewClickParams) => {
    setSelectedWeek(weekKey);
    setWeek(weekTitle);
    setlastweek(lastweek);
    setSelectedCategory(categoryKey);
  };

  interface CategoryItem {
    category: string;
    items: CommodityItem[];
  }

  const renderCategoryPreview = (item: CategoryItem, lastweek: string) => {
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
          <View style={styles.nameplate}>
            <Text style={styles.text}>Commodities</Text>
            <Text style={styles.text}>|</Text>
            <Text style={styles.text}>PriceRange</Text>
            <Text style={styles.text}>|</Text>
          </View>
          <View style={styles.prevailingContainer}>
            <Text style={styles.text}>Prevailing prices</Text>
            <View style={styles.weeknameplateContainer}>
              <Text style={styles.weektext}>This week</Text>
              <Text style={styles.weektext}>|</Text>
              <View style={styles.prevailingContainer}>
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

  const renderWeekPreview = ({ item, index }: { item: string; index: number }) => {
    if (!data) {
      return null;
    }
    const weekData: { week: string; lastWeek: string; weekdata: { [key: string]: CategoryItem } } = data[item];

    // Function to format the date as "Nov-24"
  const formatDate = (dateString: string): string => {
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
        <TouchableOpacity onPress={() => handlePreviewClick({ weekKey: item, categoryKey: firstCategory.category, weekTitle, lastweek })}>
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
  
  

  const renderFullCategory = ({ item }: { item: CategoryItem }) => {
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
      {data ? (
        <FlatList
          data={Object.keys(data)} // Week data
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
            <Text style={styles.modalTitle}>Week: {week}</Text>
            <View style={styles.nameplate}>
              <View style={styles.nameplate}>
              <Text style={styles.text}>Commodities</Text>
              <Text style={styles.text}>|</Text>
              <Text style={styles.text}>PriceRange</Text>
              <Text style={styles.text}>|</Text>
              </View>
              <View style={styles.prevailingContainer}>               
                <Text style={styles.text}>Prevailing prices</Text>
                <View style={styles.weeknameplateContainer}>
                  <Text style={styles.weektext}>This week</Text>
                  <Text style={styles.weektext}>|</Text>
                  <View style={styles.prevailingContainer}>
                  <Text style={styles.weektext}>Last week</Text>
                  <Text style={styles.weekDate}>{lastweek}</Text>
                  </View>
                </View>
              </View>
            </View>

            {selectedWeek && data && data[selectedWeek] && (
              <FlatList
              data={[...(Object.values(data[selectedWeek].weekdata) as CategoryItem[])]} // Reverse categories for selected week
              renderItem={renderFullCategory}
              keyExtractor={(item, idx) => idx.toString()}
            />            
            )}
            {selectedWeek && data && data[selectedWeek] && data[selectedWeek].weekdata && Object.keys(data[selectedWeek].weekdata).length === 0 && (
              <Text>No data available for this week.</Text>
            )}

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
  },
  weekContainer: {
    marginBottom: 15,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    borderWidth: 1,
  },
  categoryTitle: {
    fontSize: 18,
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
    fontSize: 14,
    textAlign: 'center',
    margin: 2,
  },
  nameplate: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space out "Commodities | PriceRange | Prevailing prices"
    marginBottom: 5,
    borderBottomWidth: 1,
    resizeMode: 'contain',
  },
  
  text: {
    fontSize: 12.5,
    fontWeight: 'bold',
    marginRight: 8,
  },
  
  prevailingContainer: {
    flexDirection: 'column',  // Stack "Prevailing prices" and the "This week | Last week" vertically
    justifyContent: 'flex-start',  // Align to the top of the container
    alignItems: 'flex-start',  // Align to the left of the container
  },
  
  weeknameplateContainer: {
    flexDirection: 'row', // Align "This week" and "Last week" horizontally
    alignItems: 'flex-start', // Align the "T" and "P" vertically
    marginTop: 2, // Optional: Space between "Prevailing prices" and "This week | Last week"
  },
  
  weektext: {
    fontSize: 8,
    marginRight: 5, // Add spacing between "This week" and "|"
  },
  
  weekDate: {
    fontSize: 8,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
  },
  modalContent: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 10,
    width: '95%',
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
});

export default CommodityPriceList;
