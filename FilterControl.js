import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const FilterControl = ({navigation}) => {
  const [selectedCamera, setSelectedCamera] = useState(null);

  // Camera modes based on the photos
  const cameraModes = [
    // First row

    {id: 'DCR', name: 'Original V', icon: '📱', fallback: '📱'},
    {id: 'VHS', name: 'V Classic', icon: '📹', fallback: '📹'},
    {id: '8mm', name: 'V Classic', icon: '📹', fallback: '📹'},
    {id: 'originalV', name: 'Glow', icon: '✨', fallback: '✨'},
    {id: 'vClassic', name: 'Inst SS', icon: '📷', fallback: '📷'},
    {id: 'Glow', name: 'V FunS', icon: '🎥', fallback: '🎥'},
    {id: 'instSS', name: 'Original V', icon: '📱', fallback: '📱'},
    {id: 'vFunS', name: 'V Classic', icon: '📹', fallback: '📹'},
    {id: 'Kino', name: 'Glow', icon: '✨', fallback: '✨'},
    {id: 'Slide P', name: 'Inst SS', icon: '📷', fallback: '📷'},
    {id: '16mm', name: 'V FunS', icon: '🎥', fallback: '🎥'},
    // Second row
    {id: 'NT16', name: 'KV88', icon: '📷', fallback: '📷'},
    {id: 'IR', name: 'FXN R', icon: '📷', fallback: '📷'},
    {id: 'D Half', name: 'FQS R', icon: '📷', fallback: '📷'},
    {id: 'Inst SQC', name: 'PAF R', icon: '📷', fallback: '📷'},
    {id: 'D Slide', name: 'Inst C', icon: '📷', fallback: '📷'},
    {id: 'CT2F', name: 'KV88', icon: '📷', fallback: '📷'},
    {id: '135NE', name: 'FXN R', icon: '📷', fallback: '📷'},
    {id: 'S 67', name: 'FQS R', icon: '📷', fallback: '📷'},
    {id: 'D3D', name: 'PAF R', icon: '📷', fallback: '📷'},
    {id: 'D FunS', name: 'Inst C', icon: '📷', fallback: '📷'},
    {id: 'Classic U', name: 'KV88', icon: '📷', fallback: '📷'},
    {id: 'DQS', name: 'FXN R', icon: '📷', fallback: '📷'},
    {id: 'Collage', name: 'FQS R', icon: '📷', fallback: '📷'},
    {id: 'CCD R', name: 'PAF R', icon: '📷', fallback: '📷'},
    {id: 'HOGA', name: 'Inst C', icon: '📷', fallback: '📷'},
    {id: 'Golf', name: 'KV88', icon: '📷', fallback: '📷'},
    {id: 'GR F', name: 'FXN R', icon: '📷', fallback: '📷'},
    {id: 'GRD R', name: 'FQS R', icon: '📷', fallback: '📷'},
    {id: '135 SR', name: 'PAF R', icon: '📷', fallback: '📷'},
    {id: 'CPM35', name: 'Inst C', icon: '📷', fallback: '📷'},
    {id: 'KV88', name: 'KV88', icon: '📷', fallback: '📷'},
    {id: 'FXNR', name: 'FXN R', icon: '📷', fallback: '📷'},
    {id: 'FQS R', name: 'FQS R', icon: '📷', fallback: '📷'},
    {id: 'PAFR', name: 'PAF R', icon: '📷', fallback: '📷'},
    {id: 'Inst C', name: 'Inst C', icon: '📷', fallback: '📷'},
    {id: 'D Classic', name: 'FQS R', icon: '📷', fallback: '📷'},
    {id: 'Original', name: 'PAF R', icon: '📷', fallback: '📷'},
    {id: 'S Classic', name: 'Inst C', icon: '📷', fallback: '📷'},
  ];

  const renderCameraItem = (item, isSelected, onPress) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.cameraItem, isSelected && styles.selectedCameraItem]}
      onPress={onPress}>
      <View
        style={[styles.cameraIcon, isSelected && styles.selectedCameraIcon]}>
        {/* Try to use image, fallback to emoji */}
        {typeof item.icon === 'string' ? (
          <Text style={styles.cameraIconText}>{item.icon}</Text>
        ) : (
          <Image source={item.icon} style={styles.cameraIconImage} />
        )}
      </View>
      <Text
        style={[styles.cameraName, isSelected && styles.selectedCameraName]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner */}
      <TouchableOpacity style={styles.banner}>
        <LinearGradient
          colors={['#007AFF', '#FF3B30']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={styles.gradientBanner}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <Image
                source={require('./src/assets/icons/logo-main.png')}
                style={styles.bannerLogo}
              />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle}>Dazz Pro</Text>
                <Text style={styles.bannerSubtitle}>
                  Unlock all Cameras & Accessories.
                </Text>
              </View>
            </View>
            <View style={styles.bannerArrow}>
              <Text style={styles.arrowText}>›</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sample and Menu Icons */}
      <View style={styles.topIcons}>
        <TouchableOpacity style={styles.sampleContainer}>
          <Text style={styles.sampleIcon}>🔥</Text>
          <Text style={styles.sampleText}>SAMPLE</Text>
        </TouchableOpacity>
        <View style={styles.menuIcons}>
          <TouchableOpacity style={styles.menuIcon}>
            <Text style={styles.menuIconText}>☰</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.heartIcon}>
            <Image
              source={require('./src/assets/icons/Liit.png')}
              style={styles.liitIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Camera Modes Grid */}
      <View style={styles.cameraGrid}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cameraRowScrollContainer}>
          <View
            style={[
              styles.cameraRow,
              {
                borderBottomWidth: 1.5,
                borderBottomColor: 'rgb(35, 35, 35)',
                paddingBottom: 24,
              },
            ]}>
            {cameraModes
              .slice(0, 11)
              .map(camera =>
                renderCameraItem(camera, selectedCamera === camera.id, () =>
                  setSelectedCamera(camera.id),
                ),
              )}
          </View>
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cameraRowScrollContainer}>
          <View
            style={[
              styles.cameraRow,
              {
                marginTop: -13,
                marginBottom: -15,
                borderBottomWidth: 1.5,
                borderBottomColor: 'rgb(35, 35, 35)',
                paddingBottom: 24,
              },
            ]}>
            {cameraModes
              .slice(11, 28)
              .map(camera =>
                renderCameraItem(camera, selectedCamera === camera.id, () =>
                  setSelectedCamera(camera.id),
                ),
              )}
          </View>
        </ScrollView>
      </View>

      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomScrollContainer}>
          <View style={styles.circularButtons}>
            <TouchableOpacity
              style={[styles.circleButton, styles.circleButton1]}>
              <View style={styles.circleInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleButton, styles.circleButton2]}>
              <View style={styles.circleInner} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.circleButton, styles.circleButton4]}>
              <View style={styles.circleInner} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.circleDotDivider}></TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleButton, styles.circleButton3]}>
              <Image
                source={require('./src/assets/icons/tripleC.png')}
                style={styles.tripleCIcon}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.fpsContainer, {marginLeft: -20}]}>
            <Text style={styles.fpsText}>FPS</Text>
            <Text style={styles.fpsNumber}>24</Text>
          </TouchableOpacity>

          <View style={[styles.fpsContainer, {marginRight: 20, width: 39}]}>
            <TouchableOpacity style={styles.overlappingSquares}>
              <View style={styles.square1} />
              <View style={styles.square2} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Chevron Down */}
      <TouchableOpacity
        style={styles.chevronContainer}
        onPress={() => {
          navigation.goBack();
        }}>
        <Text style={styles.chevronText}>⌄</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 60,
  },
  gradientBanner: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerLogo: {
    width: 30,
    height: 30,
    marginRight: 10,
    resizeMode: 'contain',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  bannerText: {
    flexDirection: 'column',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  bannerArrow: {
    width: 30,
    height: 30,
    marginRight: -10,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  arrowText: {
    color: 'rgba(111, 111, 111, 0.8)',
    fontSize: 26,
    fontWeight: 'bold',
  },
  topIcons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 25,
    marginTop: 120,
  },
  sampleContainer: {
    flexDirection: 'row',
    marginLeft: 180,
    alignItems: 'center',
  },
  sampleIcon: {
    fontSize: 16,
    marginRight: 5,
  },
  sampleText: {
    color: '#fff',
    fontSize: 10.5,
    fontWeight: '600',
  },
  menuIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    borderWidth: 1,
    borderColor: 'rgb(53, 53, 53)',
    marginRight: 15,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    paddingTop: 2,
  },
  menuIconText: {
    color: '#fff',
    fontSize: 18,
  },
  heartIcon: {
    marginRight: 5,
  },
  liitIcon: {
    width: 26,
    height: 26,
    borderRadius: 10,
    resizeMode: 'contain',
    borderWidth: 1,
    borderColor: 'rgb(53, 53, 53)',
  },
  cameraGrid: {
    minHeight: 220,
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  cameraRow: {
    height: 90,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  cameraRowScrollContainer: {
    paddingHorizontal: 20,
    paddingLeft: -40,
    paddingRight: -40,
  },
  cameraItem: {
    alignItems: 'center',
    width: 80,
    marginHorizontal: 5,
    paddingBottom: -20,
  },
  selectedCameraItem: {
    opacity: 0.8,
  },
  cameraIcon: {
    width: 50,
    height: 50,
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  selectedCameraIcon: {
    backgroundColor: '#007AFF',
  },
  circleDotDivider: {
    width: 3,
    height: 3,
    backgroundColor: 'rgb(53, 53, 53)',
    borderRadius: 30,
    margin: 16,
    marginLeft: 0,
  },
  cameraIconImage: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  cameraIconText: {
    fontSize: 40,
  },
  cameraName: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedCameraName: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  bottomControls: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    marginBottom: 25,
    marginLeft: -12,
  },
  bottomScrollContainer: {
    alignItems: 'center',
    paddingRight: 0,
    width: '100%',
  },
  circularButtons: {
    marginTop: 0,
    marginLeft: 35,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    zIndex: 1000,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButton1: {
    backgroundColor: '#333',
  },
  circleButton2: {
    backgroundColor: '#FF3B30',
  },
  circleButton3: {
    backgroundColor: 'transparent',
  },
  circleButton4: {
    backgroundColor: '#333',
  },
  circleInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tripleCIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  fpsContainer: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    marginRight: 10,
    borderRadius: 50,
    borderWidth: 1.25,
    borderColor: 'rgb(72, 72, 72)',
    alignItems: 'center',
  },
  fpsText: {
    color: '#fff',
    fontSize: 7,
    fontWeight: '700',
  },
  fpsNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  overlappingSquares: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 25,
    height: 25,
  },
  square1: {
    borderWidth: 2,
    borderColor: 'white',
    position: 'absolute',
    width: 21,
    height: 21,
    borderRadius: 2,
    top: 2,
    left: 2,
  },
  square2: {
    position: 'absolute',
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 2,
    top: 5,
    left: 5,
  },
  chevronContainer: {
    backgroundColor: 'rgb(29, 29, 29)',
    width: 50,
    height: 50,
    marginLeft: 312,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 17,
    marginBottom: 60,
    marginTop: -22,
    borderRadius: 50,
  },
  chevronText: {
    color: 'white',
    fontSize: 36,
    fontWeight: '700',
    marginTop: -5,
  },
});

export default FilterControl;
