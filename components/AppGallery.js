import {StyleSheet, Text, View} from 'react-native';
import React from 'react';

const AppGallery = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>AppGallery</Text>
    </View>
  );
};

export default AppGallery;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
