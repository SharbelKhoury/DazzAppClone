import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Share,
} from 'react-native';
import RNFS from 'react-native-fs';
import {launchImageLibrary} from 'react-native-image-picker';
import {cameraIcons, cameraCategories} from '../utils/cameraData';
import {useFocusEffect} from '@react-navigation/native';

const {width, height} = Dimensions.get('window');

const AppGallery = ({navigation}) => {
  const [appPhotos, setAppPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All Photos');
  const [filterStats, setFilterStats] = useState({});

  // Create a map of all filter IDs to their display names and icons
  const getFilterMap = () => {
    const filterMap = {};

    // Add all cameras from all categories
    cameraCategories.forEach(category => {
      if (category.cameras) {
        category.cameras.forEach(camera => {
          filterMap[camera.id] = {
            name: camera.name,
            icon: camera.icon,
          };
        });
      }
      if (category.accessories) {
        category.accessories.forEach(accessory => {
          filterMap[accessory.id] = {
            name: accessory.name,
            icon: accessory.icon,
          };
        });
      }
    });

    return filterMap;
  };

  // Create a comprehensive mapping for all possible filter names
  const createComprehensiveFilterMap = () => {
    const comprehensiveMap = {};

    // Add all cameras from all categories with multiple possible keys
    cameraCategories.forEach(category => {
      if (category.cameras) {
        category.cameras.forEach(camera => {
          // Map by ID
          comprehensiveMap[camera.id] = {
            name: camera.name,
            icon: camera.icon,
          };
          // Map by lowercase ID
          comprehensiveMap[camera.id.toLowerCase()] = {
            name: camera.name,
            icon: camera.icon,
          };
          // Map by name
          comprehensiveMap[camera.name] = {
            name: camera.name,
            icon: camera.icon,
          };
          // Map by lowercase name
          comprehensiveMap[camera.name.toLowerCase()] = {
            name: camera.name,
            icon: camera.icon,
          };
        });
      }
      if (category.accessories) {
        category.accessories.forEach(accessory => {
          // Map by ID
          comprehensiveMap[accessory.id] = {
            name: accessory.name,
            icon: accessory.icon,
          };
          // Map by lowercase ID
          comprehensiveMap[accessory.id.toLowerCase()] = {
            name: accessory.name,
            icon: accessory.icon,
          };
          // Map by name
          comprehensiveMap[accessory.name] = {
            name: accessory.name,
            icon: accessory.icon,
          };
          // Map by lowercase name
          comprehensiveMap[accessory.name.toLowerCase()] = {
            name: accessory.name,
            icon: accessory.icon,
          };
        });
      }
    });

    return comprehensiveMap;
  };

  // Static mapping of all camera icons - React Native requires static require() calls
  const cameraIconMap = {
    // DIGITAL
    original: require('../src/assets/cameras/original.png'),
    grdr: require('../src/assets/cameras/grdr.png'),
    ccdr: require('../src/assets/cameras/ccdr.png'),
    collage: require('../src/assets/cameras/collage.png'),
    puli: require('../src/assets/cameras/puli.png'),
    fxnr: require('../src/assets/cameras/fxnr.png'),

    // VIDEO
    vclassic: require('../src/assets/cameras/vclassic.png'),
    originalv: require('../src/assets/cameras/originalv.png'),
    dam: require('../src/assets/cameras/dam.png'),
    '16mm': require('../src/assets/cameras/16mm.png'),
    '8mm': require('../src/assets/cameras/8mm.png'),
    vhs: require('../src/assets/cameras/vhs.png'),
    kino: require('../src/assets/cameras/kino.png'),
    instss: require('../src/assets/cameras/instss.png'),
    vfuns: require('../src/assets/cameras/vfuns.png'),
    dcr: require('../src/assets/cameras/dcr.png'),
    glow: require('../src/assets/cameras/glow.png'),
    slidep: require('../src/assets/cameras/slidep.png'),

    // VINTAGE 120
    sclassic: require('../src/assets/cameras/sclassic.png'),
    hoga: require('../src/assets/cameras/hoga.png'),
    s67: require('../src/assets/cameras/s67.png'),
    kv88: require('../src/assets/cameras/kv88.png'),

    // INST COLLECTION
    instc: require('../src/assets/cameras/instc.png'),
    instsq: require('../src/assets/cameras/instsq.png'),
    instsqc: require('../src/assets/cameras/instsqc.png'),
    pafr: require('../src/assets/cameras/pafr.png'),

    // VINTAGE 135
    dclassic: require('../src/assets/cameras/dclassic.png'),
    grf: require('../src/assets/cameras/grf.png'),
    ct2f: require('../src/assets/cameras/ct2f.png'),
    dexp: require('../src/assets/cameras/dexp.png'),
    nt16: require('../src/assets/cameras/nt16.png'),
    d3d: require('../src/assets/cameras/d3d.png'),
    '135ne': require('../src/assets/cameras/135ne.png'),
    dfuns: require('../src/assets/cameras/dfuns.png'),
    ir: require('../src/assets/cameras/ir.png'),
    classicu: require('../src/assets/cameras/classicu.png'),
    dqs: require('../src/assets/cameras/dqs.png'),
    fqsr: require('../src/assets/cameras/fqsr.png'),
    golf: require('../src/assets/cameras/golf.png'),
    cmp35: require('../src/assets/cameras/cmp35.png'),
    '135sr': require('../src/assets/cameras/135sr.png'),
    dhalf: require('../src/assets/cameras/dhalf.png'),
    dslide: require('../src/assets/cameras/dslide.png'),
  };

  // Function to load camera icons using the static map
  const loadCameraIcon = filterName => {
    if (
      !filterName ||
      filterName === 'All Photos' ||
      filterName === 'Unknown'
    ) {
      return require('../src/assets/icons/camera.png');
    }

    // Try to find the icon in the static map
    const normalizedFilterName = filterName.toLowerCase();

    // Direct match
    if (cameraIconMap[normalizedFilterName]) {
      return cameraIconMap[normalizedFilterName];
    }

    // Try to find a partial match
    for (const [iconKey, iconValue] of Object.entries(cameraIconMap)) {
      if (
        iconKey.includes(normalizedFilterName) ||
        normalizedFilterName.includes(iconKey)
      ) {
        return iconValue;
      }
    }

    // If no match found, return default icon
    return require('../src/assets/icons/camera.png');
  };

  const filterMap = getFilterMap();

  // Fetch photos taken by the app
  const fetchAppPhotos = async () => {
    try {
      setLoading(true);

      // Get all files from the app's temporary directory
      const tempDir = RNFS.TemporaryDirectoryPath;
      const files = await RNFS.readDir(tempDir);

      // Filter for photos taken by the app (skia_filtered_ and filtered_ prefixes)
      const photoFiles = files.filter(
        file =>
          (file.name.startsWith('skia_filtered_') ||
            file.name.startsWith('filtered_')) &&
          file.name.endsWith('.jpg'),
      );

      // Sort by creation time (newest first)
      const sortedPhotos = photoFiles
        .map(file => ({
          id: file.name,
          uri: `file://${file.path}`,
          name: file.name,
          size: file.size,
          timestamp: file.mtime || new Date(),
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAppPhotos(sortedPhotos);

      // Calculate filter statistics
      const stats = {};
      sortedPhotos.forEach(photo => {
        // Extract filter name from filename (e.g., skia_filtered_grf_1234567890.jpg or filtered_grf_1234567890.jpg)
        let filterMatch = photo.name.match(/skia_filtered_([^_]+)_/);
        if (!filterMatch) {
          filterMatch = photo.name.match(/filtered_([^_]+)_/);
        }
        const filterName = filterMatch ? filterMatch[1] : 'Unknown';

        if (!stats[filterName]) {
          stats[filterName] = 0;
        }
        stats[filterName]++;
      });

      // Add "All Photos" count
      stats['All Photos'] = sortedPhotos.length;

      setFilterStats(stats);
    } catch (error) {
      console.error('Error fetching app photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppPhotos();
  }, []);

  // Refresh photos when screen comes into focus (e.g., returning from GalleryItemPreview)
  useFocusEffect(
    React.useCallback(() => {
      fetchAppPhotos();
    }, []),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppPhotos();
  };

  const openPhoto = photo => {
    if (isSelectionMode) {
      togglePhotoSelection(photo);
    } else {
      // Extract filter ID from filename
      let filterId = null;
      let filterMatch = photo.name.match(/skia_filtered_([^_]+)_/);
      if (!filterMatch) {
        filterMatch = photo.name.match(/filtered_([^_]+)_/);
      }
      if (filterMatch) {
        filterId = filterMatch[1];
      }

      // Navigate to GalleryItemPreview with the selected photo
      navigation.navigate('GalleryItemPreview', {
        item: {
          uri: photo.uri,
          fileName: photo.name,
          fileSize: photo.size,
          timestamp:
            photo.timestamp instanceof Date
              ? photo.timestamp.toISOString()
              : photo.timestamp,
          filterId: filterId, // Pass the filter ID
        },
      });
    }
  };

  const togglePhotoSelection = photo => {
    setSelectedPhotos(prev => {
      const isSelected = prev.find(p => p.id === photo.id);
      if (isSelected) {
        return prev.filter(p => p.id !== photo.id);
      } else {
        return [...prev, photo];
      }
    });
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedPhotos([]);
    }
  };

  const deleteSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;

    Alert.alert(
      'Delete Photos',
      `Are you sure you want to delete ${selectedPhotos.length} photo${
        selectedPhotos.length > 1 ? 's' : ''
      }?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const photo of selectedPhotos) {
                await RNFS.unlink(photo.uri.replace('file://', ''));
              }
              setSelectedPhotos([]);
              setIsSelectionMode(false);
              fetchAppPhotos(); // Refresh the list
            } catch (error) {
              console.error('Error deleting photos:', error);
              Alert.alert('Error', 'Failed to delete photos');
            }
          },
        },
      ],
    );
  };

  const shareSelectedPhotos = async () => {
    if (selectedPhotos.length === 0) return;

    try {
      if (selectedPhotos.length === 1) {
        // Share single photo
        await Share.share({
          url: selectedPhotos[0].uri,
          message: 'Check out this photo from Dazz App!',
        });
      } else {
        // Share multiple photos
        const urls = selectedPhotos.map(photo => photo.uri);
        await Share.share({
          urls: urls,
          message: `Check out these ${selectedPhotos.length} photos from Dazz App!`,
        });
      }
    } catch (error) {
      console.error('Error sharing photos:', error);
      Alert.alert('Error', 'Failed to share the photos');
    }
  };

  const deletePhoto = async photo => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await RNFS.unlink(photo.uri.replace('file://', ''));
            fetchAppPhotos(); // Refresh the list
          } catch (error) {
            console.error('Error deleting photo:', error);
            Alert.alert('Error', 'Failed to delete photo');
          }
        },
      },
    ]);
  };

  const importFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
      selectionLimit: 1,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to import photo');
      } else if (response.assets && response.assets[0]) {
        const item = response.assets[0];
        navigation.navigate('GalleryItemPreview', {
          item,
        });
      }
    });
  };

  const getFilteredPhotos = () => {
    if (selectedFilter === 'All Photos') {
      return appPhotos;
    }

    return appPhotos.filter(photo => {
      let filterMatch = photo.name.match(/skia_filtered_([^_]+)_/);
      if (!filterMatch) {
        filterMatch = photo.name.match(/filtered_([^_]+)_/);
      }
      const filterName = filterMatch ? filterMatch[1] : 'Unknown';
      return filterName === selectedFilter;
    });
  };

  const getFilterDisplayName = filterName => {
    if (filterName === 'All Photos') return 'All Photos';

    // Use the comprehensive filter map for better matching
    const comprehensiveMap = createComprehensiveFilterMap();
    const filterInfo =
      comprehensiveMap[filterName] ||
      comprehensiveMap[filterName.toLowerCase()];
    return filterInfo ? filterInfo.name : filterName;
  };

  const getFilterIcon = filterName => {
    if (filterName === 'All Photos') {
      return require('../src/assets/icons/gallery-plus.png');
    }

    // Use the comprehensive filter map for better matching
    const comprehensiveMap = createComprehensiveFilterMap();

    // Try to find the filter in the comprehensive map
    const filterInfo =
      comprehensiveMap[filterName] ||
      comprehensiveMap[filterName.toLowerCase()];
    if (filterInfo && filterInfo.icon) {
      return filterInfo.icon;
    }

    // If not found in the map, use the dynamic icon loader
    return loadCameraIcon(filterName);
  };

  const renderPhotoItem = ({item, index}) => {
    const isSelected = selectedPhotos.find(p => p.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.photoItem, isSelected && styles.selectedPhotoItem]}
        onPress={() => openPhoto(item)}
        onLongPress={() => {
          if (!isSelectionMode) {
            setIsSelectionMode(true);
            setSelectedPhotos([item]);
          }
        }}>
        <Image source={{uri: item.uri}} style={styles.photoImage} />

        {isSelected && (
          <View style={styles.selectionOverlay}>
            <View style={styles.selectionCheckbox}>
              <Text style={styles.selectionCheckmark}>✓</Text>
            </View>
          </View>
        )}

        <View style={styles.photoOverlay}>
          <Text style={styles.photoDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Image
        source={require('../src/assets/icons/gallery-plus.png')}
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Take some photos with your camera to see them here
      </Text>
      <TouchableOpacity style={styles.importButton} onPress={importFromGallery}>
        <Text style={styles.importButtonText}>Import from Gallery</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFilterDropdown = () => (
    <Modal
      visible={showFilterDropdown}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowFilterDropdown(false)}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowFilterDropdown(false)}>
        <ScrollView style={styles.dropdownContainer}>
          {Object.entries(filterStats).map(
            ([filterName, count], index, array) => {
              const filterIcon = getFilterIcon(filterName);
              const displayName = getFilterDisplayName(filterName);
              const isLastItem = index === array.length - 1;

              return (
                <TouchableOpacity
                  key={filterName}
                  style={[
                    styles.filterOption,
                    isLastItem && {marginBottom: 15},
                  ]}
                  onPress={() => {
                    setSelectedFilter(filterName);
                    setShowFilterDropdown(false);
                  }}>
                  <View style={styles.filterOptionLeft}>
                    {filterIcon && (
                      <Image
                        source={filterIcon}
                        style={[
                          styles.filterOptionIcon,
                          (filterName === 'All Photos' ||
                            filterName === 'Unknown') && {
                            tintColor: '#fff',
                          },
                        ]}
                      />
                    )}
                    <Text style={styles.filterOptionText}>{displayName}</Text>
                  </View>
                  <Text style={styles.filterOptionCount}>{count}</Text>
                </TouchableOpacity>
              );
            },
          )}
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => navigation.navigate('Settings')}>
          <Image
            source={require('../src/assets/icons/settings.png')}
            style={styles.settingsIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={() => setShowFilterDropdown(true)}>
          <Text style={styles.filterDropdownText}>{selectedFilter}</Text>
          <Image
            source={require('../src/assets/icons/arrow-down.png')}
            style={styles.arrowDownIcon}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.selectButton}
          onPress={toggleSelectionMode}>
          <Image
            source={
              isSelectionMode
                ? require('../src/assets/icons/close.png')
                : require('../src/assets/icons/check-box.png')
            }
            style={[
              styles.selectButtonIcon,
              isSelectionMode && styles.selectButtonIconSmall,
            ]}
          />
        </TouchableOpacity>
      </View>

      {/* Photo Count */}
      <View style={styles.photoCountContainer}>
        <Text style={styles.photoCount}>
          {getFilteredPhotos().length}{' '}
          {getFilteredPhotos().length === 1 ? 'Photo' : 'Photos'}
        </Text>
      </View>

      {/* Photos Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading photos...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredPhotos()}
          renderItem={renderPhotoItem}
          keyExtractor={item => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.photoGrid,
            {paddingBottom: isSelectionMode ? 100 : 20},
          ]}
          ListEmptyComponent={renderEmptyState}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}

      {/* Filter Dropdown Modal */}
      {renderFilterDropdown()}

      {/* Bottom Bar - Selection Mode */}
      {isSelectionMode && (
        <View style={styles.bottomBar}>
          <Text style={styles.selectedCount}>
            {selectedPhotos.length} Selected
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={shareSelectedPhotos}>
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={deleteSelectedPhotos}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Camera Button - Floating above everything */}
      {
        /* isSelectionMode && */ <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.goBack()}>
          <Image
            source={require('../src/assets/icons/camera.png')}
            style={styles.cameraIcon}
          />
        </TouchableOpacity>
      }
    </View>
  );
};

export default AppGallery;

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
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#000',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    width: 20,
    height: 20,
    tintColor: '#fff',
  },
  filterDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterDropdownText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  arrowDownIcon: {
    width: 16,
    height: 16,
    tintColor: '#fff',
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    //backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButtonIcon: {
    width: 25,
    height: 25,
    tintColor: '#fff',
  },
  selectButtonIconSmall: {
    width: 14,
    height: 14,
  },
  photoCountContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  photoCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
  },
  photoGrid: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  photoItem: {
    flex: 1,
    margin: 5,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
  },
  selectedPhotoItem: {
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCheckmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  photoDate: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    opacity: 0.5,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
  },
  emptySubtitle: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: 30,
    lineHeight: 24,
  },
  importButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 100,
  },
  dropdownContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    minWidth: 250,
    maxHeight: 400,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterOptionIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  filterOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  filterOptionCount: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.7,
    marginLeft: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333',
    zIndex: 1000,
  },
  selectedCount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cameraButton: {
    position: 'absolute',
    bottom: '8%',
    left: '15%',
    marginLeft: -30, // Center the button horizontally
    width: 75,
    height: 75,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9000,
    elevation: 10, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cameraIcon: {
    width: 30,
    height: 30,
    tintColor: '#000',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shareButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
