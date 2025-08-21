import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import CameraComponent from './CameraComponent'
import FilterControl from './FilterControl'

const Stack = createStackNavigator();

 const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Camera"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Camera" component={CameraComponent} />
        <Stack.Screen name="FilterControl" component={FilterControl} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
})