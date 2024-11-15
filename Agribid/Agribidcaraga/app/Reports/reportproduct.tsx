import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAlert } from '../../components/AlertContext';
import axios from 'axios';

const ReportScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = route.params as { productId: string };
  const { showAlert } = useAlert();

  const [selectedReason, setSelectedReason] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const handleReasonSelect = (reason: React.SetStateAction<string>) => {
    setSelectedReason(reason);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      alert("Please select a reason for reporting.");
      return;
    }
  
    try {
      // Get the auth token
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.error('No auth token found');
        return;
      }
  
      // Get the logged-in user's ID
      const userInfo = await AsyncStorage.getItem('userInfo');
      if (!userInfo) {
        console.error('No user info found');
        return;
      }
  
      const { id: userId } = JSON.parse(userInfo);
  
      if (!userId) {
        console.error('User ID not found in user info');
        return;
      }
  
      // Log or send report data (e.g., with fetch or Axios)
      console.log(`Report submitted for Product ID: ${productId} by User ID: ${userId} with reason: ${selectedReason} and details: ${additionalDetails}`);
  
      // Send report to the server (uncomment and customize as needed)
      const response = await axios.post(
        'http://192.168.31.160:8000/api/reports',
        {
          productId,
          Reporter: userId,
          reason: selectedReason,
          details: additionalDetails,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 200) {
        showAlert('Report Submited!', 3000);
        console.log("Report submitted successfully");
        navigation.goBack();
      } else {
        console.error("Failed to submit report");
      }
      
  
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Report Product</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why are you reporting this product?</Text>
        
        {/* Report Reasons */}
        {['Inappropriate Content', 'Misleading Information', 'Fraudulent Activity', 'Other'].map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[
              styles.choiceButton,
              selectedReason === reason && styles.choiceButtonSelected,
            ]}
            onPress={() => handleReasonSelect(reason)}
          >
            <Text style={styles.choiceText}>{reason}</Text>
          </TouchableOpacity>
        ))}

        {/* Optional Additional Details */}
        <Text style={styles.optionalTitle}>Additional Details (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Provide more information if necessary..."
          multiline
          value={additionalDetails}
          onChangeText={setAdditionalDetails}
        />
      </View>
      
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
          <Text style={styles.submitButtonText}>Submit Report</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  choiceButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  choiceButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  choiceText: {
    color: '#333',
    fontSize: 16,
  },
  optionalTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 8,
  },
  input: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f9f9f9',
    textAlignVertical: 'top',
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  submitButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  submitButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#dddddd',
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  cancelButtonText: {
    color: '#333333',
    fontWeight: 'bold',
  },
});
