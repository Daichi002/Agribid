import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Linking, Image } from 'react-native';
import { icons } from '../constants';

interface ContactAdminProps {
  visible: boolean;
  onClose: () => void;
}

const ContactAdmin: React.FC<ContactAdminProps> = ({ visible, onClose }) => {

  const openFacebookPage = () => {
    const facebookUrl = 'https://www.facebook.com/DAAmadCaraga'; // Replace with the actual URL
    Linking.openURL(facebookUrl).catch((err) =>
      console.error('Failed to open URL:', err)
    );
  };


  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose} // Handles Android back button
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
            <View style={styles.bubble}>
            <Text style={styles.messageText}>
              Contact Admin: If you have any questions or concerns, please reach out to us.
            </Text>
            <TouchableOpacity onPress={openFacebookPage}>
              <Text style={styles.linkText}>Visit their Official Facebook page
                <Image source={icons.facebook} style={{ width: 24, height: 24 }} />
              </Text>
            </TouchableOpacity>
          </View>
              <View style={styles.pointer} />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  modalContainer: {
    marginRight: 30,
    marginBottom: 120,
  },
  bubble: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    maxWidth: 250,
    elevation: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#007bff',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: 'white',
    alignSelf: 'flex-end',
    marginRight: 10,
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 10,
  },
});

export default ContactAdmin;
