import {StyleSheet, Text, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

import CameraComponent from './components/CameraComponent';
import FilterControl from './components/FilterControl';
import CamerasScreen from './components/CamerasScreen';
import GalleryItemPreview from './components/GalleryItemPreview';
import Settings from './components/Settings';
import AppGallery from './components/AppGallery';
import Subscription from './components/Subscription';
import Sample from './components/Sample';
import {initializeLUTCache} from './FilterManagement/lutLoader';

const Stack = createStackNavigator();

const App = () => {
  // Initialize LUT cache at app startup for better performance
  useEffect(() => {
    const initializeCache = async () => {
      try {
        await initializeLUTCache();
      } catch (error) {
        console.error('❌ Failed to initialize LUT cache:', error);
      }
    };

    initializeCache();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Camera"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen name="Camera" component={CameraComponent} />
          <Stack.Screen name="FilterControl" component={FilterControl} />
          <Stack.Screen name="CamerasScreen" component={CamerasScreen} />
          <Stack.Screen name="Settings" component={Settings} />
          <Stack.Screen name="AppGallery" component={AppGallery} />
          <Stack.Screen name="Subscription" component={Subscription} />
          <Stack.Screen name="Sample" component={Sample} />
          <Stack.Screen
            name="GalleryItemPreview"
            component={GalleryItemPreview}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
