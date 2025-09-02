import React, {useState} from 'react';
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

const {width: screenWidth} = Dimensions.get('window');

const Subscription = () => {
  const navigation = useNavigation();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      image: require('../src/assets/subscription/slider1.jpg'),
    },
    {
      id: 2,
      image: require('../src/assets/subscription/slider2.jpg'),
    },
  ];

  const handleSlideChange = index => {
    setCurrentSlide(index);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>📷</Text>
          </View>
          <Text style={styles.title}>Dazz Pro</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Horizontal Image Slider */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={event => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / (screenWidth - 40),
          );
          handleSlideChange(index);
        }}
        style={styles.sliderContainer}>
        <View style={styles.slide}>
          <Image
            source={require('../src/assets/subscription/slider1.jpg')}
            style={styles.fullWidthImage}
          />
        </View>
        <View style={styles.slide}>
          <Image
            source={require('../src/assets/subscription/slider2.jpg')}
            style={styles.fullWidthImage}
          />
        </View>
      </ScrollView>

      {/* Slider Controls Below Images */}
      <View style={styles.sliderControlsContainer}>
        <View style={styles.indicatorsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentSlide && styles.activeIndicator,
              ]}
            />
          ))}
        </View>
      </View>

      {/* Unlock Text */}
      <Text style={styles.unlockText}>
        Unlock all cameras and lenses, We'll be{'\n'}adding new ones often.
      </Text>

      {/* Pricing Buttons */}
      <View style={styles.pricingContainer}>
        <TouchableOpacity style={styles.pricingButton}>
          <Text style={styles.pricingAmount}>AED 22.99 / Year</Text>
          <View style={styles.familySharingContainer}>
            <Text style={styles.familySharingText}>Support Family Sharing</Text>
            <Text style={styles.familyIcon}>👥</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pricingButton}>
          <Text style={styles.pricingAmount}>
            AED 59.99 / One-Time Purchase
          </Text>
        </TouchableOpacity>
      </View>

      {/* Terms Text */}
      <Text style={styles.termsText}>
        Payment will be charged to your iTunes account at confirmation of
        purchase. Subscriptions will automatically renew unless auto-renew is
        turned off at least 24 hours before the end of the current period. Your
        account will be charged for renewal, in accordance with your plan,
        within 24 hours prior to the end of the current period. You can manage
        or turn off auto-renew in your Apple ID account settings any time after
        purchase.
      </Text>

      {/* Bottom Links */}
      <View style={styles.bottomLinks}>
        <TouchableOpacity>
          <Text style={styles.linkText}>Terms of Use</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity>
          <Text style={styles.linkText}>Privacy</Text>
        </TouchableOpacity>
        <Text style={styles.separator}>|</Text>
        <TouchableOpacity>
          <Text style={styles.linkText}>Restore Purchases</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Subscription;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
  },
  closeButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cameraIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIconText: {
    fontSize: 20,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 30,
  },
  sliderContainer: {
    height: 200,
    marginBottom: 20,
  },
  slide: {
    width: screenWidth - 40,
    height: 200,
  },
  fullWidthImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  sliderControlsContainer: {
    marginBottom: 30,
  },
  indicatorsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#fff',
  },
  unlockText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  pricingContainer: {
    marginBottom: 30,
  },
  pricingButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  pricingAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  familySharingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familySharingText: {
    color: '#ccc',
    fontSize: 14,
    marginRight: 8,
  },
  familyIcon: {
    fontSize: 16,
  },
  termsText: {
    color: '#ccc',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  bottomLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  linkText: {
    color: '#fff',
    fontSize: 14,
  },
  separator: {
    color: '#666',
    marginHorizontal: 15,
  },
});
