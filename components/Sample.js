import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const {width: screenWidth} = Dimensions.get('window');

const Sample = () => {
  const navigation = useNavigation();

  // Sample images from src/assets/sample directory
  const sampleImages = [
    {id: 1, source: require('../src/assets/sample/20250902_142119.jpg')},
    {id: 2, source: require('../src/assets/sample/20250902_142127.jpg')},
    {id: 3, source: require('../src/assets/sample/20250902_142131.jpg')},
    {id: 4, source: require('../src/assets/sample/20250902_142136.jpg')},
    {id: 5, source: require('../src/assets/sample/20250902_142139.jpg')},
    {id: 6, source: require('../src/assets/sample/20250902_142143.jpg')},
    {id: 7, source: require('../src/assets/sample/20250902_142146.jpg')},
    {id: 8, source: require('../src/assets/sample/20250902_142150.jpg')},
    {id: 9, source: require('../src/assets/sample/20250902_142153.jpg')},
    {id: 10, source: require('../src/assets/sample/20250902_142157.jpg')},
    {id: 11, source: require('../src/assets/sample/20250902_142201.jpg')},
  ];

  return (
    <View style={styles.container}>
      {/* Scrollable Images */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {sampleImages.map((image, index) => (
          <View key={image.id} style={styles.imageContainer}>
            <Image source={image.source} style={styles.image} />
          </View>
        ))}
      </ScrollView>

      {/* Fixed Buttons Above Dazz Pro Container */}
      <View style={styles.fixedButtonsContainer}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity
          style={styles.tryButton}
          onPress={() => navigation.navigate('Camera')}>
          <Text style={styles.tryButtonText}>Try</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Fixed Footer */}
      <View style={styles.fixedFooter}>
        <TouchableOpacity
          style={styles.banner}
          onPress={() => navigation.navigate('Subscription')}>
          <LinearGradient
            colors={['#007AFF', '#FF3B30']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.gradientBanner}>
            <View style={styles.bannerContent}>
              <View style={styles.bannerLeft}>
                <Image
                  source={require('../src/assets/icons/logo-main.png')}
                  style={styles.bannerLogo}
                />
                <TouchableOpacity
                  style={styles.bannerText}
                  onPress={() => navigation.navigate('Subscription')}>
                  <Text style={styles.bannerTitle}>Dazz Pro</Text>
                  <Text style={styles.bannerSubtitle}>
                    Unlock all Cameras & Accessories.
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.bannerArrow}>
                <Text style={styles.arrowText}>›</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Sample;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  fixedButtonsContainer: {
    position: 'absolute',
    bottom: 120, // Position above the Dazz Pro container
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  headerSpacer: {
    width: 60, // Same width as close button for center alignment
  },
  tryButton: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 20,
    marginBottom: 20,
  },
  tryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#333',
    borderRadius: 20,
    width: 30,
    height: 30,
    paddingTop: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
    marginBottom: 20,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingTop: 60,
    marginBottom: 60,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 100, // Space for fixed footer
    width: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
  },
  image: {
    width: screenWidth * 1.25, // 95% of screen width
    height: undefined,
    aspectRatio: 1, // Auto height based on aspect ratio
    resizeMode: 'contain',
    borderRadius: 8,
  },
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  banner: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientBanner: {
    padding: 20,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bannerLogo: {
    width: 40,
    height: 40,
    marginRight: 15,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  bannerArrow: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
  },
});
