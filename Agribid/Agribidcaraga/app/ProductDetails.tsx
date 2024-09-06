import React, { useState, useEffect } from 'react';
import { View, Text, Image, TextInput, Button, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';




interface Product {
  id: number;
  user_id: number
  title: string;
  image: string;
  description: string;
  price: string;
  locate: string;
}

interface Comment {
  text: string;
  user: string;
  timestamp: string;
}

// Define the type for the route parameters
type RootStackParamList = {
  ProductDetails: { product: Product };
};

// Define types for the product and comment
type ProductDetailsRouteProp = RouteProp<RootStackParamList, 'ProductDetails'>;

interface ProductDetailsProps {
  route: ProductDetailsRouteProp;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ route }) => {
  const { product } = route.params; // Access product from route.params

  if (!product) {
    return <Text>No product found!</Text>; // Safeguard in case product is undefined
  }
  const [showOriginalImage, setShowOriginalImage] = useState<boolean>(false);
  const [comment, setComment] = useState<string>(''); // State for the comment
  const [comments, setComments] = useState<Comment[]>([]); // State to store all comments

  useEffect(() => {
    const fetchComments = async () => {
      const storedComments = await AsyncStorage.getItem(`product_${product.id}_comments`);
      if (storedComments) {
        setComments(JSON.parse(storedComments));
        console.log('hi i am product Id',comments);
      }
    };
    
    fetchComments();
  }, [product.id]);

  if (product)  {
    // Safe to use product.id
    console.log('hi i am product Id',product.id);
  }

  const toggleOriginalImage = () => {
    setShowOriginalImage(prevState => !prevState);
  };

  const closeOriginalImage = () => {
    setShowOriginalImage(false);
  };

  const handleCommentChange = (text: string) => {
    setComment(text); // Update comment state as user types
  };

  const handleCommentSubmit = async () => {
    if (comment.trim() !== '') {     // check if comment is empty
      const newComment: Comment = {
        text: comment,
        user: 'Anonymous',           // modify to put user  Username
        timestamp: new Date().toISOString(),  //add timestamp to the comment
      };
      const updatedComments = [...comments, newComment];
      setComments(updatedComments);    //update local state with a new comment
      await AsyncStorage.setItem(`product_${product.id}_comments`, JSON.stringify(updatedComments)); //save comment to local storage
      setComment('');    //clear comment bos after submission
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{product.title}</Text>
      <TouchableOpacity onPress={toggleOriginalImage}>
        <Image
          source={{ uri: `http://localhost:8000/storage/product/images/${product.image}` }}
          style={styles.productImage}
        />
      </TouchableOpacity>

      <View style={styles.line} />

      <Text>Description: {product.description}</Text>

      {/* Original Image Overlay */}
      <Modal
        visible={showOriginalImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeOriginalImage}
      >
        <TouchableOpacity style={styles.overlay} onPress={closeOriginalImage}>
          <Image
            source={{ uri: `http://localhost:8000/storage/product/images/${product.image}` }}
            style={styles.originalImage}
          />
          <TouchableOpacity style={styles.closeButton} onPress={closeOriginalImage}>
            <Text style={styles.closeText}>&times;</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Comment Section */}
      <View style={styles.commentSection}>
        <View style={styles.commentsList}>
          {comments.map((comment, index) => (
            <View key={index} style={styles.comment}>
              <Text>{comment.text}</Text>
              <Text style={styles.commentInfo}>
                Commented by {comment.user} on {new Date(comment.timestamp).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
        {/* Comment Input */}
        <TextInput
          value={comment}
          onChangeText={handleCommentChange}
          placeholder="Add a comment..."
          style={styles.commentInput}
        />
        <Button title="Comment" onPress={handleCommentSubmit} />
      </View>
    </View>
  );
};

export default ProductDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  productImage: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
  },
  line: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginVertical: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  originalImage: {
    width: '90%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 30,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 10,
  },
  closeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  commentSection: {
    marginTop: 20,
  },
  commentsList: {
    marginBottom: 10,
  },
  comment: {
    marginBottom: 10,
  },
  commentInfo: {
    fontSize: 12,
    color: '#666',
  },
  commentInput: {
    height: 100,
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
});
