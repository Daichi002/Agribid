import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Button, Modal, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native"; // For navigation
import { useAlert } from '../components/AlertContext'; // Assuming you have an alert context for showing alerts

interface LicensingScreenProps {
  onAccept: () => void;
  onDecline: () => void;
}

const LicensingScreen: React.FC<LicensingScreenProps> = () => {
  const { showAlert } = useAlert();
  const navigation = useNavigation(); // Navigation hook

  const handleAccept = () => {
    showAlert('You have accepted the AgriPlace Terms sevices.', 1000, 'green', 'Thank You!');
    navigation.navigate('(auth)/login'); // Navigate to login after acceptance
  };

  const handleDecline = () => {
    showAlert('You have declined the AgriPlace Terms sevices. Access to the platform is restricted.', 1000, 'red', 'Notice');
      // Navigate to the login screen
      navigation.navigate('index');
      
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.heading}>AgriPlace Terms and Services</Text>
        
        <Text style={styles.sectionTitle}>1. Terms and Services Overview</Text>
        <Text style={styles.text}>
        AgriPlace operates as a digital platform facilitating transactions between farmers, buyers, and associated stakeholders. 
          This Terms and Services agreement governs the use of AgriPlace’s platform, services, and tools to ensure transparency, efficiency, 
          and compliance with applicable laws.
        </Text>

        <Text style={styles.sectionTitle}>2. Platform Access</Text>
        <Text style={styles.subTitle}>Farmers:</Text>
        <Text style={styles.text}>
          - Free-for-life access to list and sell agricultural products.{"\n"}
          - Farmers agree to comply with all listing standards, including accurate representation of product quality, quantity, and availability.{"\n"}
          - AgriPlace provides optional training and support for farmers to optimize their use of the platform.
        </Text>
        <Text style={styles.subTitle}>Buyers:</Text>
        <Text style={styles.text}>
          - Access is subject to commission fees on completed transactions.{"\n"}
          - Buyers must verify their accounts to ensure authenticity and agree to terms of fair trade, including timely payment and adherence to agreed-upon delivery conditions.
        </Text>

        <Text style={styles.sectionTitle}>3. Transaction Guidelines</Text>
        <Text style={styles.text}>
          - All transactions must occur within the platform's secure systems to ensure transparency and protection for both parties.{"\n"}
          - AgriPlace reserves the right to mediate disputes between farmers and buyers to ensure fair resolutions.{"\n"}
          - Payments must be processed using AgriPlace’s approved payment methods to maintain transaction integrity.
        </Text>

        <Text style={styles.sectionTitle}>4. Licensing Rights</Text>
        <Text style={styles.text}>
          - AgriPlace retains ownership of all proprietary technology, tools, and features provided on the platform.{"\n"}
          - Users are granted a non-transferable, revocable license to use the platform solely for agricultural trade and related activities.{"\n"}
          - Any unauthorized use, reproduction, or distribution of AgriPlace’s tools or content is strictly prohibited.
        </Text>

        <Text style={styles.sectionTitle}>5. FPOs and Aggregators</Text>
        <Text style={styles.text}>
          - Farmer Producer Organizations (FPOs) can use the platform to aggregate products from member farmers.{"\n"}
          - FPOs are responsible for ensuring compliance with AgriPlace’s guidelines among their members.{"\n"}
          - Revenue-sharing agreements between AgriPlace and FPOs are determined based on predefined terms.
        </Text>

        <Text style={styles.sectionTitle}>6. Compliance and Data Usage</Text>
        <Text style={styles.text}>
          - All users must comply with local, national, and international laws related to agriculture and trade.{"\n"}
          - AgriPlace collects and processes user data solely to enhance platform services, including market insights, logistics planning, and targeted support.{"\n"}
          - Data is never sold to third parties without explicit consent.
        </Text>

        <Text style={styles.sectionTitle}>7. Termination</Text>
        <Text style={styles.text}>
          - AgriPlace reserves the right to suspend or terminate accounts found in violation of these terms, including fraudulent activity or misrepresentation of goods.{"\n"}
          - Users may opt to terminate their access at any time, provided all ongoing transactions are completed and obligations met.
        </Text>

        <Text style={styles.sectionTitle}>8. Dispute Resolution</Text>
        <Text style={styles.text}>
          - In case of disputes, users agree to binding arbitration facilitated by AgriPlace’s designated legal partner.{"\n"}
          - AgriPlace’s decision in dispute cases will be final unless appealed through legal channels outlined in the licensing agreement.
        </Text>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <Button title="Accept" onPress={handleAccept} />
        <Button title="Decline" onPress={handleDecline} color="red" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  scrollView: {
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: "#555",
    textAlign: "justify", // Justifies the text
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default LicensingScreen;