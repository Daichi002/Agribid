import React, { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, StyleSheet, Modal, Button } from "react-native";
//import AsyncStorage from '@react-native-async-storage/async-storage';

const ProductDetails = ({ product }) => {
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [comment, setComment] = useState(""); 
  const [comments, setComments] = useState([]); 

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const storedComments = await AsyncStorage.getItem(`product_${product.id}_comments`);
        if (storedComments) {
          setComments(JSON.parse(storedComments));
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
    };

    fetchComments();
  }, [product.id]);

  const toggleOriginalImage = () => {
    setShowOriginalImage(prevState => !prevState);
  };

  const handleCommentChange = (text) => {
    setComment(text);
  };

  const handleCommentSubmit = async () => {
    if (comment.trim() !== "") {
      const newComment = {
        text: comment,
        user: "Anonymous",
        timestamp: new Date().toISOString(),
      };
      const updatedComments = [...comments, newComment];
      setComments(updatedComments);
      await AsyncStorage.setItem(`product_${product.id}_comments`, JSON.stringify(updatedComments));
      setComment("");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{product.title}</Text>
      <TouchableOpacity onPress={toggleOriginalImage}>
        <Image
          source={{ uri: `http://localhost:8000/storage/product/image/${product.image}` }}
          style={styles.productImage}
        />
      </TouchableOpacity>

      <View style={styles.line} />

      <Text style={styles.description}>Description: {product.description}</Text>

      {/* Original Image Modal */}
      <Modal visible={showOriginalImage} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={toggleOriginalImage}>
            <Text style={styles.closeText}>&times;</Text>
          </TouchableOpacity>
          <Image
            source={{ uri: `http://localhost:8000/storage/product/image/${product.image}` }}
            style={styles.originalImage}
          />
        </View>
      </Modal>

      {/* Comment Section */}
      <View style={styles.commentSection}>
        <ScrollView style={styles.commentsList}>
          {comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentInfo}>Commented by {comment.user} on {new Date(comment.timestamp).toLocaleString()}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Comment Input */}
        <TextInput
          value={comment}
          onChangeText={handleCommentChange}
          placeholder="Add a comment..."
          style={styles.commentInput}
          multiline
        />
        <Button title="Comment" onPress={handleCommentSubmit} />
      </View>
    </ScrollView>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 250,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  line: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 16,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  originalImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    color: '#fff',
    fontSize: 30,
  },
  commentSection: {
    marginTop: 16,
  },
  commentsList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  comment: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  commentText: {
    fontSize: 16,
  },
  commentInfo: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  commentInput: {
    height: 60,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
});
