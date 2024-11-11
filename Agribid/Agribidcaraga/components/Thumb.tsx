// Thumb.js
import React from 'react';
import { View, StyleSheet } from 'react-native';

const Thumb = () => {
  return <View style={styles.root} />;
};

const styles = StyleSheet.create({
  root: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'gray',
    backgroundColor: 'white',
  },
});

export default Thumb;
