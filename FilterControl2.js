import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import React from 'react';

const FilterControl2 = () => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.title}>FilterControl2</TouchableOpacity>
    </View>
  );
};

export default FilterControl2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'black',
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
});
