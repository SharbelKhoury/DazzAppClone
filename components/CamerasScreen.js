import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import {filterConfigs} from '../utils/filterConfig';
import {cameraCategories, cameraIcons} from '../utils/cameraData';

const CamerasScreen = ({navigation}) => {
  // Initial selection state based on requirements
  const getInitialSelectionState = () => {
    const initialSelected = new Set();

    // DIGITAL: all selected
    const digitalCameras = [
      'original',
      'grdr',
      'ccdr',
      'collage',
      'puli',
      'fxnr',
    ];
    digitalCameras.forEach(id => initialSelected.add(id));

    // VIDEO: all but Glow V FunS and Slide P selected
    const videoCameras = [
      'vclassic',
      'originalv',
      'dam',
      '16mm',
      '8mm',
      'vhs',
      'kino',
      'instss',
      'dcr',
    ];
    videoCameras.forEach(id => initialSelected.add(id));

    // VINTAGE 135: all but last 2 and DQS and FQS R selected
    const vintage135Cameras = [
      'dclassic',
      'grf',
      'ct2f',
      'dexp',
      'nt16',
      'd3d',
      '135ne',
      'dfuns',
      'ir',
      'classicu',
      'golf',
      'cpm35',
      '135sr',
      'dhalf',
      'dslide',
    ];
    vintage135Cameras.forEach(id => initialSelected.add(id));

    // VINTAGE 120: all selected
    const vintage120Cameras = ['sclassic', 'hoga', 's67', 'kv88'];
    vintage120Cameras.forEach(id => initialSelected.add(id));

    // INST COLLECTION: all but Inst SQ selected
    const instCollectionCameras = ['instc', 'instsqc', 'pafr'];
    instCollectionCameras.forEach(id => initialSelected.add(id));

    // Select all accessories by default (they will be available in FilterControl)
    const accessories = [
      'ndfilter',
      'fisheyef',
      'fisheyew',
      'prism',
      'flashc',
      'star',
    ];
    accessories.forEach(id => initialSelected.add(id));

    return initialSelected;
  };

  // Get saved selection state or initial state
  const getSavedOrInitialState = () => {
    // Check if user has already made changes (saved in global state)
    if (global.userCameraSelections) {
      return new Set(global.userCameraSelections);
    }

    // If no saved state, use initial state and mark as first time
    const initialState = getInitialSelectionState();
    global.userCameraSelections = Array.from(initialState);
    global.isFirstTimeUser = true;

    return initialState;
  };

  const [selectedCameras, setSelectedCameras] = useState(
    getSavedOrInitialState,
  );
  const [openModalId, setOpenModalId] = useState(null);

  // Update global functions and save state whenever selectedCameras changes
  useEffect(() => {
    global.getCameraDataForFilterControl = getCameraDataForFilterControl;
    global.updateCameraSelection = cameraId => {
      toggleCameraSelection(cameraId);
    };

    // Save current selection state globally
    global.userCameraSelections = Array.from(selectedCameras);

    // Note: global.activeFilters is managed by FilterControl, not CamerasScreen
    // CamerasScreen only manages which accessories are selected/available
  }, [selectedCameras]);

  // Listen for filter changes and force re-render
  useEffect(() => {
    const checkFilters = () => {
      // Force re-render when filters change
      if (global.activeFilters) {
        // This will trigger a re-render
        setSelectedCameras(new Set(selectedCameras));
      }
    };

    const interval = setInterval(checkFilters, 100);
    return () => clearInterval(interval);
  }, [selectedCameras]);
  const openCameraInfoModal = cameraId => {
    setOpenModalId(cameraId);
  };

  const toggleCameraSelection = cameraId => {
    const newSelected = new Set(selectedCameras);
    if (newSelected.has(cameraId)) {
      newSelected.delete(cameraId);
    } else {
      newSelected.add(cameraId);
    }

    // Save the new selection state globally
    global.userCameraSelections = Array.from(newSelected);
    global.isFirstTimeUser = false; // Mark that user has made changes

    setSelectedCameras(newSelected);
  };

  // Export camera data and selection state for FilterControl
  const getCameraDataForFilterControl = () => {
    return {
      cameraCategories,
      selectedCameras: Array.from(selectedCameras),
      cameraIcons,
    };
  };

  // Make the function available globally for FilterControl to access
  if (global.getCameraDataForFilterControl === undefined) {
    global.getCameraDataForFilterControl = getCameraDataForFilterControl;
  }

  // Make the update function available globally for FilterControl to access
  if (global.updateCameraSelection === undefined) {
    global.updateCameraSelection = cameraId => {
      toggleCameraSelection(cameraId);
    };
  }

  // Function to reset to initial state (for debugging or reset functionality)
  const resetToInitialState = () => {
    const initialState = getInitialSelectionState();
    setSelectedCameras(initialState);
    global.userCameraSelections = Array.from(initialState);
    global.isFirstTimeUser = true;
  };

  // Make reset function available globally
  if (global.resetCameraSelections === undefined) {
    global.resetCameraSelections = resetToInitialState;
  }

  const renderCameraItem = ({item, category}) => {
    const isSelected = selectedCameras.has(item.id);

    return (
      <View style={styles.cameraItem}>
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={[
              styles.radioButton,
              isSelected && styles.radioButtonSelected,
            ]}
            onPress={() => toggleCameraSelection(item.id)}
          />
          <Text style={styles.cameraName}>{item.name}</Text>
        </View>

        <View style={styles.cameraIconContainer}>
          <View style={styles.cameraIcon}>
            <Text style={styles.cameraIconText}>{item.icon}</Text>
          </View>

          <View style={styles.featureIcons}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureIconText}>📷</Text>
            </View>
            {item.hasVideo && (
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🎥</Text>
              </View>
            )}
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  const renderAccessoryItem = ({item}) => {
    const isSelected = selectedCameras.has(item.id);

    return (
      <View style={styles.accessoryItem}>
        <View style={styles.accessoryIcon}>
          <Text style={styles.accessoryIconText}>{item.icon}</Text>
        </View>
        <Text style={styles.accessoryName}>{item.name}</Text>
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
    );
  };

  const renderCategory = ({item}) => {
    const activeFilters = global.activeFilters || [];

    return (
      <View style={styles.categoryContainer}>
        <Text style={styles.categoryTitle}>{item.title}</Text>

        {/* Show active filters indicator for ACCESSORY section */}
        {/* {item.title === 'ACCESSORY' && activeFilters.length > 0 && (
          <View style={styles.activeFiltersIndicator}>
            <Text style={styles.activeFiltersText}>
              Active Filters:{' '}
              {activeFilters.map(id => filterConfigs[id]?.name).join(', ')}
            </Text>
          </View>
        )} */}

        <View
          style={[
            styles.cameraGrid,
            item.title === 'ACCESSORY' && styles.lastSectionGrid,
          ]}>
          {item.title === 'ACCESSORY'
            ? item.accessories.map(accessory => (
                <TouchableOpacity
                  key={accessory.id}
                  style={styles.cameraGridItem}
                  onPress={() => toggleCameraSelection(accessory.id)}>
                  <View style={styles.cameraGridIcon}>
                    {typeof accessory.icon === 'string' ? (
                      <Text style={styles.cameraGridIconText}>
                        {accessory.icon}
                      </Text>
                    ) : (
                      <Image
                        source={accessory.icon}
                        style={styles.cameraGridIconImage}
                      />
                    )}
                  </View>
                  <Text style={styles.cameraGridName}>{accessory.name}</Text>
                  {selectedCameras.has(accessory.id) && (
                    <View style={styles.selectionIndicator}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            : item.cameras.map(camera => (
                <TouchableOpacity
                  key={camera.id}
                  style={styles.cameraGridItem}
                  onPress={() => toggleCameraSelection(camera.id)}>
                  <View style={styles.cameraGridIcon}>
                    {typeof camera.icon === 'string' ? (
                      <Text style={styles.cameraGridIconText}>
                        {camera.icon}
                      </Text>
                    ) : (
                      <Image
                        source={camera.icon}
                        style={styles.cameraGridIconImage}
                      />
                    )}
                  </View>
                  <Text style={styles.cameraGridName}>
                    {camera.name.includes(' R') ? (
                      <>
                        {camera.name.split(' R')[0]}
                        <Text style={styles.specialR}> R</Text>
                      </>
                    ) : (
                      camera.name
                    )}
                  </Text>
                  {camera.infoIcons && (
                    <TouchableOpacity
                      onPress={() => openCameraInfoModal(camera.id)}
                      style={styles.infoIconsContainer}>
                      {camera.infoIcons.map((infoIcon, index) => {
                        const isCircularIcon =
                          infoIcon === cameraIcons.photo ||
                          infoIcon === cameraIcons.video ||
                          infoIcon === cameraIcons.videoPhotoLivephoto;
                        return (
                          <Image
                            key={index}
                            source={infoIcon}
                            style={[
                              styles.infoIcon,
                              isCircularIcon && styles.circularInfoIcon,
                            ]}
                          />
                        );
                      })}
                    </TouchableOpacity>
                  )}
                  {selectedCameras.has(camera.id) && (
                    <View style={styles.selectionIndicator}>
                      <Text style={styles.checkmark}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <TouchableOpacity
        style={styles.backButtonContainer}
        onPress={() => navigation.goBack()}>
        <Image
          style={styles.backButton}
          source={require('../src/assets/icons/back-arrow.png')}
        />
      </TouchableOpacity>
      <View style={styles.headerSpacer} />

      {/* Camera categories list */}
      <FlatList
        data={cameraCategories}
        renderItem={renderCategory}
        keyExtractor={item => item.title}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      <Modal
        animationType="slide"
        transparent={true}
        visible={openModalId !== null}
        onRequestClose={() => setOpenModalId(null)}>
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
          activeOpacity={1}
          onPress={() => setOpenModalId(null)}>
          <View
            style={{
              backgroundColor: 'rgb(34, 34, 34)',
              width: 270,
              height: 220,
              borderRadius: 15,
              padding: 20,
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'flex-start',
                gap: 10,
                marginLeft: 15,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.photo}
                  style={{width: 13, height: 13, borderRadius: 10}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Photo
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.video}
                  style={{width: 13, height: 13, borderRadius: 10}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Video
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.videoPhotoLivephoto}
                  style={{width: 13, height: 13, borderRadius: 10}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Video,Photo,LivePhoto
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.filmNegatives}
                  style={{width: 13, height: 13}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Import Photos
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 10,
                }}>
                <Image
                  source={cameraIcons.importPhotos}
                  style={{width: 13, height: 13}}
                />
                <Text style={{color: 'rgb(151, 151, 151)', fontSize: 11.5}}>
                  Film Negatives
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    marginTop: 16,
    marginLeft: 17,
    width: 18,
    height: 18,
    zIndex: 1000,
    borderRadius: 50,
    tintColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonContainer: {
    backgroundColor: 'rgb(33, 33, 33)',
    width: 50,
    height: 50,
    borderRadius: 50,
    position: 'absolute',
    right: 40,
    bottom: 70,
    zIndex: 1000,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  headerSpacer: {
    height: 40,
  },
  listContainer: {
    paddingBottom: 20,
  },
  categoryContainer: {
    marginBottom: 30,
  },
  categoryTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  activeFiltersIndicator: {
    backgroundColor: 'rgba(0, 122, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  activeFiltersText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    gap: 10,
  },
  lastSectionGrid: {
    marginBottom: 100,
  },
  cameraGridItem: {
    width: '30%',
    height: 164,
    alignItems: 'center',
    marginBottom: 15,
    marginHorizontal: 2,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingTop: 40,
  },
  cameraGridIcon: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cameraGridIconText: {
    fontSize: 24,
  },
  cameraGridIconImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
    resizeMode: 'contain',
  },
  cameraGridName: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    fontWeight: 'bold',
  },
  infoIconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 12,
    gap: 5,
  },
  infoIcon: {
    width: 13,
    height: 13,
    paddingHorizontal: 9,
    resizeMode: 'contain',
  },
  circularInfoIcon: {
    borderRadius: 20,
  },
  specialR: {
    color: 'rgb(64, 62, 206)',
    fontWeight: '900',
    fontSize: 13,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00BFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CamerasScreen;
