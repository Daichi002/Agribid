import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CommentReportModalProps {
  visible: boolean;
  onClose: () => void;
  data?: {
    commentText: string;
    commenter: { FirstName: string; LastName: string };
    createdAt: string;
  };
}

const CommentReportModal: React.FC<CommentReportModalProps> = ({ visible, onClose, data }) => {
  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="fade" visible={visible}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Comment Report</Text>
          {data ? (
            <>
              <Text style={styles.subTitle}>Commenter:</Text>
              <Text style={styles.text}>
                {data.commenter.FirstName} {data.commenter.LastName}
              </Text>

              <Text style={styles.subTitle}>Comment:</Text>
              <View style={styles.details}>
              <Text style={styles.text}>{data.commentText}</Text>
              </View>
              <Text style={styles.subTitle}>Reported On:</Text>
              <Text style={styles.text}>{new Date(data.createdAt).toLocaleString()}</Text>
            </>
          ) : (
            <Text style={styles.noDataText}>No data available</Text>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0)', // Darkened background to focus on modal
  },
  modalContent: {
    width: '30%', // Increased width for larger screens
    height  : '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'flex-start', // Align text to the left for a cleaner layout
    elevation: 10, // Adds a subtle shadow for a modern effect
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#555',
    marginTop: 10,
  },
  details:{
    padding: 5,
    width: '100%',
    borderWidth : 1,
    height: "40%",
  },
  text: {
    fontSize: 16,
    color: '#444',
    marginVertical: 5,
  },
  noDataText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007BFF', // Bright, modern blue
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignSelf: 'center',
    width: '80%',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default CommentReportModal;
