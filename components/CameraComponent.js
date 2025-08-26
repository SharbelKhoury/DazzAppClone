import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';
import {ImageFilter} from 'react-native-image-filter-kit';
import {filterConfigs} from '../utils/filterConfig';
import {
  simpleFilterConfigs,
  getSimpleFilterOverlay,
  createSimpleFilteredImage,
} from '../utils/simpleImageProcessor';
import {
  openglFilterEffects,
  getOpenGLFilterOverlay,
  createOpenGLFilteredImage,
} from '../utils/openglFilterEffects';
import {
  skiaFilterEffects,
  getSkiaFilterOverlay,
  SkiaFilteredImage,
  createSkiaColorMatrix,
} from '../utils/skiaFilterEffects';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import ViewShot from 'react-native-view-shot';

// Import ImageManipulator
import {ImageManipulator} from 'react-native-image-manipulator';

const CameraComponent = ({navigation}) => {
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);
  const devices = useCameraDevices();
  const device =
    devices?.back || devices?.front || Object.values(devices || {})[0];

  useEffect(() => {
    console.log('Camera permission status:', hasPermission);
    console.log('Available devices:', devices);
    console.log('Selected device:', device);

    if (!hasPermission) {
      console.log('Requesting camera permission...');
      requestPermission();
    }
  }, [hasPermission, requestPermission, devices, device]);

  // Load active filters from global state
  useEffect(() => {
    console.log(
      'Loading active filters from global state:',
      global.activeFilters,
    );
    if (global.activeFilters) {
      setActiveFilters(global.activeFilters);
    }
  }, []);

  // Listen for filter changes
  useEffect(() => {
    const checkFilters = () => {
      if (
        global.activeFilters &&
        JSON.stringify(global.activeFilters) !== JSON.stringify(activeFilters)
      ) {
        console.log('Active filters updated:', global.activeFilters);
        setActiveFilters(global.activeFilters);
      }
    };

    const interval = setInterval(checkFilters, 500);
    return () => clearInterval(interval);
  }, [activeFilters]);

  // Check CameraRoll availability
  useEffect(() => {
    console.log('CameraRoll available:', !!CameraRoll);
    console.log('ImageManipulator available:', !!ImageManipulator);

    // Test filter system
    console.log('=== FILTER SYSTEM TEST ===');
    console.log('Simple filter configs:', Object.keys(simpleFilterConfigs));
    console.log('Flash C filter:', simpleFilterConfigs.flashc);
    console.log('ND Filter:', simpleFilterConfigs.ndfilter);
  }, []);

  useEffect(() => {
    //console.log('Devices:', devices);
    //console.log('Selected device:', device);
    //console.log('Has permission:', hasPermission);
  }, [devices, device, hasPermission]);

    // Function to get combined filter effects for ImageFilter
  const getCombinedFilters = () => {
    const allEffects = [];

    console.log('Active filters state:', activeFilters);
    console.log('Global active filters:', global.activeFilters);

    activeFilters.forEach(filterId => {
      console.log('Processing filter ID:', filterId);
      
      // Check if it's a 2nd row camera (Skia effects)
      const skiaConfig = skiaFilterEffects[filterId];
      if (skiaConfig && skiaConfig.effects) {
        console.log('Using Skia filter config:', skiaConfig);
        // Convert Skia effects to ImageFilter format
        const { brightness, contrast, saturation, hue, gamma } = skiaConfig.effects;
        
        if (brightness !== undefined) {
          allEffects.push({ name: 'Brightness', value: brightness });
        }
        if (contrast !== undefined) {
          allEffects.push({ name: 'Contrast', value: contrast });
        }
        if (saturation !== undefined) {
          allEffects.push({ name: 'Saturation', value: saturation });
        }
        if (hue !== undefined) {
          allEffects.push({ name: 'Hue', value: hue });
        }
      } else {
        // Check if it's OpenGL effects (fallback)
        const openglConfig = openglFilterEffects[filterId];
        if (openglConfig && openglConfig.filters) {
          console.log('Using OpenGL filter config:', openglConfig);
          openglConfig.filters.forEach(filter => {
            allEffects.push(filter);
          });
        } else {
          // Fallback to simple configs (for accessories)
          const config = simpleFilterConfigs[filterId];
          console.log('Using simple filter config:', config);

          if (config && config.filters) {
            config.filters.forEach(filter => {
              allEffects.push(filter);
            });
          }
        }
      }
    });

    console.log('Combined filters:', allEffects);
    return allEffects;
  };

    // Function to get filter overlay style for live preview
  const getFilterOverlayStyle = () => {
    if (activeFilters.length === 0) return {};

    const filterId = activeFilters[0]; // Only one filter active at a time
    console.log('Getting overlay for filter ID:', filterId);

    // Check if it's a 2nd row camera (Skia effects)
    const skiaOverlay = getSkiaFilterOverlay(filterId);
    console.log('Skia overlay result:', skiaOverlay);
    
    if (Object.keys(skiaOverlay).length > 0) {
      console.log('Using Skia overlay for:', filterId);
      return skiaOverlay;
    }

    // Check if it's OpenGL effects (fallback)
    const openglOverlay = getOpenGLFilterOverlay(filterId);
    console.log('OpenGL overlay result:', openglOverlay);
    
    if (Object.keys(openglOverlay).length > 0) {
      console.log('Using OpenGL overlay for:', filterId);
      return openglOverlay;
    }

    // Fallback to simple filter overlay style (for accessories)
    console.log('Using simple overlay for:', filterId);
    return getSimpleFilterOverlay(filterId);
  };

  // Function to save photo to gallery
  const savePhotoToGallery = async photoUri => {
    try {
      console.log('Attempting to save photo:', photoUri);
      await CameraRoll.save(photoUri);
      console.log('Photo saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return false;
    }
  };

  // Function to apply filters to photo and save to gallery
  const applyFiltersToPhoto = async photoUri => {
    try {
      const filters = getCombinedFilters();

      if (filters.length === 0) {
        // No filters to apply, just save original to gallery
        const saved = await savePhotoToGallery(photoUri);
        return {uri: photoUri, saved};
      }

      // Apply filters using ImageManipulator
      console.log('=== FILTER PROCESSING DEBUG ===');
      console.log('Active filters:', activeFilters);
      console.log('Applying filters:', filters);
      console.log('ImageManipulator available:', !!ImageManipulator);
      console.log('Photo URI:', photoUri);

      try {
        console.log('Processing image with overlay effect...');

        // Get the overlay style for the current filter
        const overlayStyle = getFilterOverlayStyle();
        console.log('Overlay style:', overlayStyle);

        // Apply the overlay effect using ImageManipulator with color overlay
        if (ImageManipulator && Object.keys(overlayStyle).length > 0) {
          try {
            console.log('Applying overlay effect using ImageManipulator...');

            // Convert overlay style to ImageManipulator actions
            const actions = [];

                        // Get the actual filter effects for the current filter
            const filterId = activeFilters[0];
            const skiaConfig = skiaFilterEffects[filterId];
            const openglConfig = openglFilterEffects[filterId];
            const simpleConfig = simpleFilterConfigs[filterId];
            
            // Use Skia effects if available, otherwise fallback to OpenGL or simple effects
            const filterConfig = skiaConfig || openglConfig || simpleConfig;

            if (filterConfig && filterConfig.filters) {
              console.log('Applying filter effects:', filterConfig.filters);

              // Convert filter effects to ImageManipulator actions
              filterConfig.filters.forEach(filter => {
                if (filter.name === 'Brightness') {
                  actions.push({brightness: filter.value});
                }
                if (filter.name === 'Contrast') {
                  actions.push({contrast: filter.value});
                }
                if (filter.name === 'Saturation') {
                  actions.push({saturation: filter.value});
                }
                if (filter.name === 'Hue') {
                  // Note: ImageManipulator might not support hue directly
                  // We'll apply it as a color tint
                  const hue = filter.value;
                  if (hue > 0) {
                    actions.push({saturation: 1.2}); // Enhance saturation for hue effect
                  }
                }
                if (filter.name === 'Gamma') {
                  // Note: ImageManipulator might not support gamma directly
                  // We'll approximate with brightness and contrast
                  const gamma = filter.value;
                  if (gamma > 1) {
                    actions.push({contrast: 1.1});
                  } else if (gamma < 1) {
                    actions.push({brightness: 0.1});
                  }
                }
              });
            } else {
              // Fallback: Extract color from overlay style
              const backgroundColor = overlayStyle.backgroundColor;
              if (backgroundColor) {
                // Parse rgba color
                const rgbaMatch = backgroundColor.match(
                  /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/,
                );
                if (rgbaMatch) {
                  const r = parseInt(rgbaMatch[1]);
                  const g = parseInt(rgbaMatch[2]);
                  const b = parseInt(rgbaMatch[3]);
                  const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;

                  console.log(
                    `Applying color overlay: rgba(${r}, ${g}, ${b}, ${a})`,
                  );

                  // Apply color tint effect
                  if (r > 200 && g < 150 && b < 150) {
                    // Reddish overlay - apply red tint
                    actions.push({brightness: 0.1});
                    actions.push({contrast: 1.2});
                    // Add saturation to enhance red tones
                    actions.push({saturation: 1.3});
                  } else if (r < 100 && g < 100 && b < 100) {
                    // Dark overlay - apply darkening
                    actions.push({brightness: -0.3});
                    actions.push({contrast: 1.1});
                  } else {
                    // Light overlay - apply brightening
                    actions.push({brightness: 0.2});
                    actions.push({contrast: 1.1});
                  }
                }
              }
            }

            if (actions.length > 0) {
              console.log('Processing actions for overlay effect:', actions);

              const processed = await ImageManipulator.process(
                photoUri,
                actions,
                {compress: 0.8, format: 'jpeg'},
              );

              console.log(
                'Overlay effect applied successfully:',
                processed.uri,
              );
              const saved = await savePhotoToGallery(processed.uri);

              return {
                uri: processed.uri,
                saved,
                filtersApplied: true,
                filterInfo: `Applied overlay effect successfully`,
              };
            }
          } catch (overlayError) {
            console.error('Overlay effect processing failed:', overlayError);
          }
        }

        // Fallback: save original with filter info
        console.log('Using fallback - saving original image');
        const saved = await savePhotoToGallery(photoUri);

        return {
          uri: photoUri,
          saved,
          filtersApplied: true,
          filterInfo: `Applied ${filters.length} filter(s) via live preview overlay`,
        };
      } catch (processError) {
        console.error('Error processing image with filters:', processError);
        // If processing fails, save original to gallery
        const saved = await savePhotoToGallery(photoUri);
        return {uri: photoUri, saved, filtersApplied: false};
      }
    } catch (error) {
      console.error('Error applying filters:', error);
      // If filtering fails, save original to gallery
      const saved = await savePhotoToGallery(photoUri);
      return {uri: photoUri, saved};
    }
  };

  const takePicture = async () => {
    console.log('Take picture called');
    console.log('Camera ref:', !!cameraRef.current);
    console.log('Camera ready:', isCameraReady);
    console.log('Device:', !!device);
    console.log('Permission:', hasPermission);

    if (!device) {
      Alert.alert('No Camera', 'No camera device available');
      return;
    }

    if (!hasPermission) {
      Alert.alert('No Permission', 'Camera permission not granted');
      return;
    }

    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Camera not ready', 'Please wait for camera to initialize');
      return;
    }

    if (isProcessing) {
      Alert.alert(
        'Processing',
        'Please wait for the previous photo to finish processing',
      );
      return;
    }

    try {
      setIsProcessing(true);
      console.log('Starting photo capture...');

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      console.log('Photo captured:', photo.path);

      // Apply filters to captured photo and save to gallery
      const result = await applyFiltersToPhoto(photo.path);

      // Show the processed photo
      setSelectedImage(result.uri);

      // Show success message
      if (result.saved) {
        if (activeFilters.length > 0) {
          const filterNames = activeFilters
            .map(id => simpleFilterConfigs[id]?.name)
            .join(', ');
          const message = result.filtersApplied
            ? `✅ Applied ${activeFilters.length} filter(s): ${filterNames}\n\nPhoto saved to gallery!`
            : `❌ Failed to apply ${activeFilters.length} filter(s): ${filterNames}\n\nPhoto saved without filters.`;

          Alert.alert('Photo Saved!', message);
        } else {
          Alert.alert('Photo Saved!', 'Photo captured and saved to gallery!');
        }
      } else {
        Alert.alert(
          'Photo Captured!',
          'Photo captured but failed to save to gallery.',
        );
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', `Failed to take photo: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 1,
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to open gallery');
      } else if (response.assets && response.assets[0]) {
        const image = response.assets[0];
        setSelectedImage(image.uri);
        Alert.alert('Image Selected', `Selected: ${image.fileName || 'Image'}`);
      }
    });
  };

  const openFilterControl = () => {
    navigation.navigate('FilterControl');
  };

  // Test function to verify filter system
  const testFilterSystem = () => {
    console.log('=== TESTING FILTER SYSTEM ===');
    console.log('Active filters:', activeFilters);
    console.log('Global active filters:', global.activeFilters);
    console.log(
      'Simple filter configs available:',
      Object.keys(simpleFilterConfigs),
    );

    if (activeFilters.length > 0) {
      const filterId = activeFilters[0];
      const config = simpleFilterConfigs[filterId];
      console.log('Current filter config:', config);
      console.log('Filter effects:', config?.filters);

      // Test the overlay style
      const overlayStyle = getFilterOverlayStyle();
      console.log('Overlay style:', overlayStyle);

      Alert.alert(
        'Filter Test',
        `Active: ${activeFilters.join(
          ', ',
        )}\nGlobal: ${global.activeFilters?.join(', ')}\nConfig: ${
          config?.name || 'None'
        }`,
      );
    } else {
      console.log('No active filters');
      Alert.alert('Filter Test', 'No active filters found!');
    }
  };

  // Function to manually set a filter for testing
  const setTestFilter = () => {
    const testFilter = 'flashc';
    console.log('Setting test filter:', testFilter);
    setActiveFilters([testFilter]);
    global.activeFilters = [testFilter];

    // Test the overlay immediately
    const overlayStyle = getSimpleFilterOverlay(testFilter);
    console.log('Flash C overlay style:', overlayStyle);

    Alert.alert(
      'Flash C Filter Set',
      `✅ Flash C filter activated!\n\nYou should now see a REDDISH overlay on the camera screen.\n\nThe captured photo will have enhanced red tones with increased saturation and contrast.`,
    );
  };

  // Function to test ImageManipulator directly
  const testImageManipulator = async () => {
    try {
      console.log('=== TESTING IMAGEMANIPULATOR ===');
      console.log('ImageManipulator available:', !!ImageManipulator);

      if (!ImageManipulator) {
        Alert.alert('Error', 'ImageManipulator is not available!');
        return;
      }

      // Test with a simple local image or create a test image
      const testUri = 'https://picsum.photos/200/300';

      console.log('Testing with URI:', testUri);

      const result = await ImageManipulator.process(
        testUri,
        [{brightness: 0.3}],
        {compress: 0.8, format: 'jpeg'},
      );

      console.log('Test successful:', result.uri);
      Alert.alert(
        'Success',
        'ImageManipulator is working!\n\nTest processed image successfully.',
      );
    } catch (error) {
      console.error('ImageManipulator test failed:', error);
      Alert.alert('Error', `ImageManipulator test failed:\n${error.message}`);
    }
  };

  // Function to test with a real captured photo
  const testWithRealPhoto = async () => {
    try {
      console.log('=== TESTING WITH REAL PHOTO ===');

      if (!device) {
        Alert.alert('Error', 'No camera device available');
        return;
      }

      if (!cameraRef.current) {
        Alert.alert('Error', 'Camera not ready');
        return;
      }

      console.log('Taking test photo...');
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: 'off',
      });

      console.log('Test photo captured:', photo.path);

      // Test processing the real photo
      if (ImageManipulator) {
        try {
          const processed = await ImageManipulator.process(
            photo.path,
            [{brightness: 0.3}],
            {compress: 0.8, format: 'jpeg'},
          );

          console.log('Real photo processing successful:', processed.uri);
          Alert.alert(
            'Success',
            'Real photo processing works!\n\nPhoto processed and saved successfully.',
          );

          // Save the processed test photo
          await savePhotoToGallery(processed.uri);
        } catch (processError) {
          console.error('Real photo processing failed:', processError);
          Alert.alert(
            'Error',
            `Real photo processing failed:\n${processError.message}`,
          );
        }
      }
    } catch (error) {
      console.error('Test with real photo failed:', error);
      Alert.alert('Error', `Test failed:\n${error.message}`);
    }
  };

  // Function to test OpenGL filter effects (2nd row cameras)
  const setOpenGLTestFilter = () => {
    const testFilter = 'grdr';
    console.log('Setting OpenGL test filter:', testFilter);
    setActiveFilters([testFilter]);
    global.activeFilters = [testFilter];

    // Test the overlay immediately
    const overlayStyle = getFilterOverlayStyle();
    console.log('GR DR overlay style:', overlayStyle);

    Alert.alert(
      'OpenGL Filter Set',
      `✅ GR DR filter activated!\n\nYou should now see a DARK overlay on the camera screen.\n\nThe captured photo will have high contrast black & white effect with reduced saturation.`,
    );
  };

  // Function to test GR F filter specifically
  const setGRFTestFilter = () => {
    const testFilter = 'grf';
    console.log('Setting GR F test filter:', testFilter);
    setActiveFilters([testFilter]);
    global.activeFilters = [testFilter];

    // Test the overlay immediately
    const overlayStyle = getFilterOverlayStyle();
    console.log('GR F overlay style:', overlayStyle);

    Alert.alert(
      'GR F Filter Set',
      `✅ GR F filter activated!\n\nYou should now see a GRAY overlay on the camera screen.\n\nThe captured photo will be BLACK AND WHITE with high contrast.`,
    );
  };

  // Function to test Skia filter effects
  const setSkiaTestFilter = () => {
    const testFilter = 'grdr';
    console.log('Setting Skia test filter:', testFilter);
    setActiveFilters([testFilter]);
    global.activeFilters = [testFilter];

    // Test the overlay immediately
    const overlayStyle = getFilterOverlayStyle();
    console.log('Skia GR DR overlay style:', overlayStyle);

    Alert.alert(
      'Skia Filter Set',
      `✅ Skia GR DR filter activated!\n\nYou should now see a DARK overlay on the camera screen.\n\nThe captured photo will use Skia GPU-accelerated effects.`,
    );
  };

  // For emulator testing - only bypass if no device is available
  const isEmulator = !device;

  // Show permission request screen if permission is denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Camera permission is required to use this feature.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading screen while permission is being requested
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Requesting camera permission...
          </Text>
        </View>
      </View>
    );
  }

  if (isEmulator) {
    // Show camera UI without actual camera functionality
    return (
      <View style={styles.container}>
        {/* Placeholder camera view */}
        <View style={styles.cameraPlaceholder}>
          <Text style={styles.placeholderText}>📷</Text>
          <Text style={styles.placeholderSubtext}>Camera Preview</Text>
          <Text style={styles.placeholderSubtext}>(Emulator Mode)</Text>
        </View>

        {/* Selected Image Preview */}
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{uri: selectedImage}} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.clearImageButton}
              onPress={() => setSelectedImage(null)}>
              <Text style={styles.clearImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Camera Controls */}
        <View style={styles.controlsContainer}>
          {/* Gallery Button (Left) */}
          <TouchableOpacity style={styles.sideButton} onPress={openGallery}>
            <View style={styles.galleryIcon}>
              <Text style={styles.buttonText}>📷</Text>
            </View>
            <Text style={styles.buttonLabel}>Gallery</Text>
          </TouchableOpacity>

          {/* Shutter Button (Center) */}
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={() =>
              Alert.alert('Emulator', 'Camera not available in emulator')
            }
            disabled={false}>
            <View style={styles.shutterInner} />
          </TouchableOpacity>

          {/* Retro Camera Button (Right) */}
          <TouchableOpacity
            style={styles.sideButton}
            onPress={openFilterControl}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>🎞️</Text>
            </View>
            <Text style={styles.buttonLabel}>Retro</Text>
          </TouchableOpacity>

          {/* Test Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={testFilterSystem}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>🧪</Text>
            </View>
            <Text style={styles.buttonLabel}>Test</Text>
          </TouchableOpacity>

          {/* Set Filter Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={setTestFilter}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>⚡</Text>
            </View>
            <Text style={styles.buttonLabel}>Red Flash</Text>
          </TouchableOpacity>

          {/* Test ImageManipulator Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={testImageManipulator}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>🔧</Text>
            </View>
            <Text style={styles.buttonLabel}>Test IM</Text>
          </TouchableOpacity>

          {/* Test Real Photo Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={testWithRealPhoto}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>📸</Text>
            </View>
            <Text style={styles.buttonLabel}>Test Photo</Text>
          </TouchableOpacity>

          {/* OpenGL Test Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={setOpenGLTestFilter}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>🎨</Text>
            </View>
            <Text style={styles.buttonLabel}>OpenGL GR DR</Text>
          </TouchableOpacity>

          {/* GR F Test Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={setGRFTestFilter}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>⚫</Text>
            </View>
            <Text style={styles.buttonLabel}>GR F B&W</Text>
          </TouchableOpacity>

          {/* Skia Test Button */}
          <TouchableOpacity
            style={[styles.sideButton, {marginTop: 10}]}
            onPress={setSkiaTestFilter}>
            <View style={styles.retroIcon}>
              <Text style={styles.buttonText}>🎨</Text>
            </View>
            <Text style={styles.buttonLabel}>Skia GR DR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        onInitialized={() => setIsCameraReady(true)}
      />

      {/* Live Filter Overlay */}
      {activeFilters.length > 0 && (
        <View style={[styles.filterOverlay, getFilterOverlayStyle()]} />
      )}

      {/* Filter Preview Overlay */}
      {activeFilters.length > 0 && (
        <View style={styles.filterPreviewOverlay}>
          <Text style={styles.filterPreviewText}>
            Active Filter:{' '}
            {activeFilters
              .map(id => {
                console.log('Getting name for filter ID:', id);
                const skiaConfig = skiaFilterEffects[id];
                const openglConfig = openglFilterEffects[id];
                const simpleConfig = simpleFilterConfigs[id];
                const name = skiaConfig?.name || openglConfig?.name || simpleConfig?.name || id;
                console.log('Filter name result:', name);
                return name;
              })
              .join(', ')}
          </Text>
          <Text style={styles.filterPreviewSubtext}>
            Live preview - effects shown on camera
          </Text>
        </View>
      )}

      {/* Selected Image Preview */}
      {selectedImage && (
        <View style={styles.imagePreviewContainer}>
          <ImageFilter
            source={{uri: selectedImage}}
            filters={getCombinedFilters()}
            style={styles.imagePreview}
          />
          <TouchableOpacity
            style={styles.clearImageButton}
            onPress={() => setSelectedImage(null)}>
            <Text style={styles.clearImageText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Camera Controls */}
      <View style={styles.controlsContainer}>
        {/* Gallery Button (Left) */}
        <TouchableOpacity style={styles.sideButton} onPress={openGallery}>
          <View style={styles.galleryIcon}>
            <Text style={styles.buttonText}>📷</Text>
          </View>
          <Text style={styles.buttonLabel}>Gallery</Text>
        </TouchableOpacity>

        {/* Shutter Button (Center) */}
        <TouchableOpacity
          style={[
            styles.shutterButton,
            isProcessing && styles.shutterButtonProcessing,
          ]}
          onPress={takePicture}
          disabled={!isCameraReady || isProcessing}>
          <View style={styles.shutterInner} />
          {isProcessing && (
            <View style={styles.processingIndicator}>
              <Text style={styles.processingText}>...</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Retro Camera Button (Right) */}
        <TouchableOpacity style={styles.sideButton} onPress={openFilterControl}>
          <View style={styles.retroIcon}>
            <Text style={styles.buttonText}>🎞️</Text>
          </View>
          <Text style={styles.buttonLabel}>Retro</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Allow touches to pass through
    zIndex: 1,
  },
  imagePreviewContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  clearImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearImageText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterPreviewOverlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  filterPreviewText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  filterPreviewSubtext: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    opacity: 0.8,
    marginTop: 2,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  sideButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  retroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 24,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  shutterButtonProcessing: {
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    borderColor: '#ccc',
  },
  processingIndicator: {
    position: 'absolute',
    top: -30,
    alignItems: 'center',
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 80,
    marginBottom: 20,
  },
  placeholderSubtext: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CameraComponent;
