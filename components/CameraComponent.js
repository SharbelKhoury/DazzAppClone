import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  StatusBar,
  AppState,
} from 'react-native';

import {
  Camera,
  useCameraDevice,
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
  const [isPhotoEnabled, setIsPhotoEnabled] = useState(false);
  const [isAppInBackground, setIsAppInBackground] = useState(false);
  // Camera position state - using the simpler approach like your friend
  const [cameraPosition, setCameraPosition] = useState('front');
  const [flashMode, setFlashMode] = useState('off');
  const [showGrid, setShowGrid] = useState(false);
  const [timerMode, setTimerMode] = useState('off');
  const [latestMedia, setLatestMedia] = useState(null);
  const cameraRef = useRef(null);

  const devices = useCameraDevices();

  // Manual device selection function that was working for front camera
  const getDevice = () => {
    if (!devices) return null;

    const deviceArray = Object.values(devices);
    // console.log(
    //   'Available devices:',
    //   deviceArray.map(d => `${d.name} (${d.position})`),
    // );

    if (cameraPosition === 'front') {
      // For front camera, prefer "Front Camera" over "Front TrueDepth Camera"
      const frontCamera = deviceArray.find(
        d => d.position === 'front' && d.name === 'Front Camera',
      );
      if (frontCamera) {
        // console.log('Using Front Camera');
        return frontCamera;
      }
      // Fallback to any front camera
      const anyFrontCamera = deviceArray.find(d => d.position === 'front');
      if (anyFrontCamera) {
        // console.log('Using fallback front camera:', anyFrontCamera.name);
        return anyFrontCamera;
      }
    } else {
      // For back camera, try different camera types to avoid AVFoundation errors
      const ultraWideCamera = deviceArray.find(
        d => d.position === 'back' && d.name === 'Back Ultra Wide Camera',
      );
      if (ultraWideCamera) {
        // console.log('Using Back Ultra Wide Camera');
        return ultraWideCamera;
      }

      const dualWideCamera = deviceArray.find(
        d => d.position === 'back' && d.name === 'Back Dual Wide Camera',
      );
      if (dualWideCamera) {
        // console.log('Using Back Dual Wide Camera');
        return dualWideCamera;
      }

      // Last resort: any back camera
      const anyBackCamera = deviceArray.find(d => d.position === 'back');
      if (anyBackCamera) {
        // console.log('Using fallback back camera:', anyBackCamera.name);
        return anyBackCamera;
      }
    }

    return null;
  };

  const device = getDevice();

  // Effect to log camera position changes
  useEffect(() => {
    //console.log('Camera position changed to:', cameraPosition);
    //console.log('Current device:', device);
  }, [cameraPosition, device]);

  // Cleanup effect for camera switching
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts or camera position changes
      if (cameraRef.current) {
        // Ensure camera is properly cleaned up
        setIsCameraReady(false);
      }
    };
  }, [cameraPosition]);

  // Cleanup effect for app state changes
  useEffect(() => {
    return () => {
      // Ensure camera is disabled when component unmounts
      setIsAppInBackground(true);
    };
  }, []);

  // Add camera initialization safety
  useEffect(() => {
    // Only initialize camera after permission is granted
    if (hasPermission === true && device) {
      // Add a longer delay to ensure proper AVFoundation initialization
      const timer = setTimeout(() => {
        try {
          setIsCameraReady(true);
        } catch (error) {
          console.error('Camera initialization error:', error);
          setIsCameraReady(false);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasPermission, device]);

  useEffect(() => {
    /* console.log('=== CAMERA DEBUG ===');
    console.log('Camera permission status:', hasPermission);
    console.log('Available devices:', devices);
    console.log('Front camera:', devices?.front);
    console.log('Back camera:', devices?.back);
    console.log('Current device:', device);
    console.log('Camera position:', cameraPosition); */

    // Detailed device analysis
    if (devices) {
      // console.log('=== DETAILED DEVICE ANALYSIS ===');
      // console.log('All device keys:', Object.keys(devices));
      // console.log('Device values:', Object.values(devices));

      Object.entries(devices).forEach(([key, device]) => {
        /* console.log(`Device ${key}:`, {
          id: device?.id,
          name: device?.name,
          position: device?.position,
          hasFlash: device?.hasFlash,
          hardwareLevel: device?.hardwareLevel,
          isMultiCam: device?.isMultiCam,
          physicalDevices: device?.physicalDevices,
        }); */
      });
      //console.log('=== END DEVICE ANALYSIS ===');
    }
    //console.log('===================');

    if (!hasPermission) {
      //console.log('Requesting camera permission...');
      requestPermission();
    }
  }, [hasPermission, requestPermission, devices, device, cameraPosition]);

  // Load active filters and camera selection from global state
  useEffect(() => {
    console.log(
      'Loading active filters from global state:',
      global.activeFilters,
    );
    if (global.activeFilters) {
      setActiveFilters(global.activeFilters);
    }

    // Initialize camera selection if not already set
    if (!global.selectedCameraId) {
      // For first app run, select the first camera from 2nd row (DIGITAL section)
      const defaultCamera = 'original'; // First camera from DIGITAL section
      console.log('Setting default camera for first run:', defaultCamera);
      global.selectedCameraId = defaultCamera;
      global.activeFilters = [defaultCamera];
      setActiveFilters([defaultCamera]);
    } else {
      console.log('Using saved camera selection:', global.selectedCameraId);
      // Ensure the saved camera is also set as active filter
      if (!global.activeFilters || global.activeFilters.length === 0) {
        global.activeFilters = [global.selectedCameraId];
        setActiveFilters([global.selectedCameraId]);
      }
    }
  }, []);

  // AppState listener to handle background/foreground transitions
  useEffect(() => {
    const handleAppStateChange = nextAppState => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App is going to background or becoming inactive
        setIsAppInBackground(true);
        console.log('App going to background - disabling camera');
      } else if (nextAppState === 'active') {
        // App is coming back to foreground - add small delay for smooth transition
        setTimeout(() => {
          setIsAppInBackground(false);
          console.log('App coming to foreground - re-enabling camera');
        }, 300);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );

    return () => {
      subscription?.remove();
    };
  }, []);

  // Listen for filter and camera selection changes
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

    const checkCameraSelection = () => {
      // Also check if selectedCameraId has changed
      if (
        global.selectedCameraId &&
        (!activeFilters.length || activeFilters[0] !== global.selectedCameraId)
      ) {
        console.log('Camera selection updated:', global.selectedCameraId);
        setActiveFilters([global.selectedCameraId]);
      }
    };

    const interval = setInterval(() => {
      checkFilters();
      checkCameraSelection();
    }, 500);
    return () => clearInterval(interval);
  }, [activeFilters]);

  // Fetch latest media for gallery preview
  const fetchLatestMedia = async () => {
    try {
      const result = await CameraRoll.getPhotos({
        first: 1,
        assetType: 'All',
        sortBy: ['creationTime'],
      });

      if (result.edges && result.edges.length > 0) {
        const latestItem = result.edges[0].node;
        setLatestMedia({
          uri: latestItem.image.uri,
          type: latestItem.type,
          filename: latestItem.image.filename,
        });
      }
    } catch (error) {
      console.error('Error fetching latest media:', error);
    }
  };

  // Load latest media on component mount
  useEffect(() => {
    fetchLatestMedia();
  }, []);

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
        const {brightness, contrast, saturation, hue, gamma} =
          skiaConfig.effects;

        if (brightness !== undefined) {
          allEffects.push({name: 'Brightness', value: brightness});
        }
        if (contrast !== undefined) {
          allEffects.push({name: 'Contrast', value: contrast});
        }
        if (saturation !== undefined) {
          allEffects.push({name: 'Saturation', value: saturation});
        }
        if (hue !== undefined) {
          allEffects.push({name: 'Hue', value: hue});
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

      // Enable photo capture just before taking the photo
      setIsPhotoEnabled(true);

      // Delay to ensure photo capture is enabled
      await new Promise(resolve => setTimeout(resolve, 200));

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });

      console.log('Photo captured:', photo.path);

      // Apply filters to captured photo and save to gallery
      const result = await applyFiltersToPhoto(photo.path);

      // Show the processed photo
      setSelectedImage(result.uri);

      // Show success message
      if (result.saved) {
        // Refresh latest media after saving
        fetchLatestMedia();

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
      // Disable photo capture after taking the photo
      setIsPhotoEnabled(false);
    }
  };

  const openGallery = () => {
    const options = {
      mediaType: 'mixed', // Allow both photos and videos
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
        const item = response.assets[0];
        // Navigate to GalleryItemPreview with the selected item
        navigation.navigate('GalleryItemPreview', {item});
      }
    });
  };

  const openFilterControl = () => {
    navigation.navigate('FilterControl');
  };
  // Flip camera using the official react-native-vision-camera approach
  const flipCamera = () => {
    // Prevent rapid camera switching
    if (!isCameraReady) {
      return; // Don't allow switching if camera is not ready
    }
    // console.log('Flipping camera from:', cameraPosition);
    // Force camera to be inactive during switch
    setIsCameraReady(false);

    setTimeout(() => {
      setCameraPosition(prevPosition => {
        const newPosition = prevPosition === 'back' ? 'front' : 'back';
        // console.log('Flipping camera to:', newPosition);
        return newPosition;
      });
    }, 100);
    setIsCameraReady(true);
  };

  const toggleFlash = () => {
    const flashModes = ['off', 'on', 'auto'];
    const currentIndex = flashModes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    setFlashMode(flashModes[nextIndex]);
  };

  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  const toggleTimer = () => {
    const timerModes = ['off', '3s', '10s'];
    const currentIndex = timerModes.indexOf(timerMode);
    const nextIndex = (currentIndex + 1) % timerModes.length;
    setTimerMode(timerModes[nextIndex]);
  };

  // Function to get the selected camera icon
  const getSelectedCameraIcon = () => {
    // If no camera selected globally, use the first active filter
    const cameraId =
      global.selectedCameraId ||
      (activeFilters.length > 0 ? activeFilters[0] : null);
    if (!cameraId) return null;

    // Import all camera icons
    const cameraIcons = {
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
      cpm35: require('../src/assets/cameras/cmp35.png'),
      '135sr': require('../src/assets/cameras/135sr.png'),
      dhalf: require('../src/assets/cameras/dhalf.png'),
      dslide: require('../src/assets/cameras/dslide.png'),

      // ACCESSORY
      ndfilter: require('../src/assets/accessory/ndfilter.png'),
      fisheyef: require('../src/assets/accessory/fisheyef.png'),
      fisheyew: require('../src/assets/accessory/fisheyew.png'),
      prism: require('../src/assets/accessory/prism.png'),
      flashc: require('../src/assets/accessory/flashc.png'),
      star: require('../src/assets/accessory/star.png'),
    };

    return cameraIcons[cameraId] || null;
  };

  // Show permission request screen if permission is denied
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
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
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            Requesting camera permission...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {!isAppInBackground && <View style={styles.cameraFrameInside} />}
      {/* Camera View with Frame */}
      <View style={styles.cameraFrame}>
        {device && !isAppInBackground ? (
          <Camera
            key={`${device.id}-${cameraPosition}-${Date.now()}`}
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={isCameraReady && !!device && !isAppInBackground}
            photo={isPhotoEnabled}
            onInitialized={() => {
              // console.log('Camera initialized successfully');
              // Don't set ready immediately, let the useEffect handle it
            }}
            onError={error => {
              // console.error('Camera error:', error);
              // console.error('Error details:', {
              //   message: error.message,
              //   code: error.code,
              //   domain: error.domain,
              //   userInfo: error.userInfo,
              // });
              setIsCameraReady(false);

              // If it's an AVFoundation error, try switching to a different device
              if (
                error.code === -11800 ||
                error.domain === 'AVFoundationErrorDomain'
              ) {
                // console.log(
                //   'AVFoundation error detected, this device might be problematic',
                // );
              }

              // Log the error but don't prevent future attempts
              // console.log('Camera error occurred, but allowing retry');
            }}
          />
        ) : (
          <View
            style={[
              styles.camera,
              {
                backgroundColor: '#000',
                justifyContent: 'center',
                alignItems: 'center',
              },
            ]}>
            <Image
              source={require('../src/assets/icons/logo.png')}
              style={{
                width: 100,
                height: 100,
                marginTop: -70,
                borderRadius: 50,
                resizeMode: 'contain',
              }}
            />
          </View>
        )}
      </View>

      {/* Live Filter Overlay */}
      {activeFilters.length > 0 && (
        <View style={[styles.filterOverlay, getFilterOverlayStyle()]} />
      )}

      {/* Grid Overlay - Inside Camera Frame */}
      {showGrid && (
        <View style={styles.gridOverlay}>
          {/* Vertical lines */}
          <View style={styles.gridVerticalLine1} />
          <View style={styles.gridVerticalLine2} />
          {/* Horizontal lines */}
          <View style={styles.gridHorizontalLine1} />
          <View style={styles.gridHorizontalLine2} />
        </View>
      )}

      {/* Top Section */}
      <View style={styles.topSection}>
        {/* More Options Button */}
        <TouchableOpacity style={styles.moreOptionsButton}>
          <View style={styles.moreOptionsDots}>
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Focal Length Indicator */}
      {/* <View style={styles.focalLengthContainer}>
        <Text style={styles.focalLengthText}>35mm</Text>
      </View> */}

      {/* Middle Control Bar */}
      <View style={styles.middleControlBar}>
        <TouchableOpacity
          style={[
            styles.controlItem,
            {
              backgroundColor: 'rgb(255, 255, 255)',
              width: 37,
              height: 37,
              alignContent: 'center',
              justifyContent: 'center',
              borderRadius: 50,
            },
          ]}>
          {/* <Text style={styles.tempIcon}>🌡️</Text> */}
          <Image
            source={require('../src/assets/icons/temp.png')}
            style={styles.tempIcon}
          />
          {/*  <Text style={styles.controlValue}>35</Text> */}
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlItem}>
          {/* <Text style={styles.brightnessIcon}>☀️</Text> */}
          <Text style={styles.controlValue}>26</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Control Bar */}
      <View style={styles.bottomControlBar}>
        {/* Left Side - Gallery Preview */}
        <TouchableOpacity style={styles.galleryPreview} onPress={openGallery}>
          {latestMedia ? (
            <Image
              source={{uri: latestMedia.uri}}
              style={styles.galleryImage}
            />
          ) : (
            <View style={styles.galleryPlaceholder}>
              <Text style={styles.galleryIcon}>📷</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Center Controls */}
        <View style={styles.centerControls}>
          {/* Top Row Controls */}
          <View style={styles.topControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={openGallery}>
              <View style={styles.galleryButtonIcon}>
                {/* <View style={styles.cameraOutline} /> */}
                <Image
                  source={require('../src/assets/icons/gallery-plus.png')}
                  style={styles.galleryPlus}
                />
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={toggleGrid}>
              <View style={styles.gridIcon}>
                <View style={styles.gridSquare1} />
                <View style={styles.gridSquare2} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleTimer}>
              <Image
                source={require('../src/assets/icons/clock.png')}
                style={styles.clock}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleFlash}>
              <Text style={styles.flashIcon}>
                {flashMode === 'off' ? (
                  <Image
                    source={require('../src/assets/icons/flash-off.png')}
                    style={styles.flashIcon2}
                  />
                ) : flashMode === 'on' ? (
                  <Image
                    source={require('../src/assets/icons/flash-off.png')}
                    style={styles.flashIcon3}
                  />
                ) : (
                  <Image
                    source={require('../src/assets/icons/flash-off.png')}
                    style={styles.flashIcon4}
                  />
                )}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
              <Image
                style={styles.cameraSwitchArrow}
                source={require('../src/assets/icons/flip-camera.png')}
              />
            </TouchableOpacity>
          </View>

          {/* Shutter Button */}
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
        </View>

        {/* Right Side - Selected Camera Icon */}
        <TouchableOpacity
          style={styles.selectedCameraContainer}
          onPress={openFilterControl}>
          {getSelectedCameraIcon() ? (
            <Image
              source={getSelectedCameraIcon()}
              style={styles.selectedCameraIcon}
            />
          ) : (
            <View style={styles.defaultCameraIcon}>
              <View style={styles.cameraOutline} />
              <View style={styles.infoBadge}>
                <Text style={styles.infoText}>i</Text>
              </View>
            </View>
          )}
          <View
            style={{
              marginTop: 15,
              width: 40,
              borderRadius: 30,
              height: 15,
              zIndex: 10,
              borderWidth: 1.5,
              borderColor: 'gray',
            }}>
            <View style={styles.selectedIndicator} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Selected Image Preview */}
      {/* {selectedImage && (
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
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  galleryPlus: {
    tintColor: '#fff',
    width: 30,
    height: 30,
  },
  cameraFrame: {
    flex: 1,
    margin: 30,
    marginVertical: 230,
    marginTop: 160,
    borderRadius: 8,
    overflow: 'hidden',
    //borderWidth: 2,
    //borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cameraFrameInside: {
    position: 'absolute',
    top: 250,
    left: 100,
    right: 100,
    bottom: 300,
    borderWidth: 2,
    zIndex: 10,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  camera: {
    flex: 1,
    transform: [{rotateY: '0deg'}], // Add rotate(Y) functionality
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 1,
  },
  gridOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    pointerEvents: 'none',
    zIndex: 2,
  },
  gridVerticalLine1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33.33%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridVerticalLine2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '66.66%',
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridHorizontalLine1: {
    position: 'absolute',
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridHorizontalLine2: {
    position: 'absolute',
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  topSection: {
    position: 'absolute',
    top: 170,
    right: 50,
    zIndex: 10,
  },
  moreOptionsButton: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreOptionsDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 13,
  },
  dot: {
    width: 2.5,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  focalLengthContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  focalLengthText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  middleControlBar: {
    position: 'absolute',
    top: '67%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: 'rgb(0, 0, 0)',
    width: 37,
    height: 37,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  controlIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  /*  tempIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#FF3B30',
  }, */
  tempIcon: {
    width: 20,
    height: 20,
    //marginRight: 8,
    tintColor: 'black',
  },
  brightnessIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#FF9500',
  },
  controlValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomControlBar: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  galleryPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  galleryPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    fontSize: 24,
    color: '#fff',
  },
  centerControls: {
    alignItems: 'center',
  },
  topControls: {
    flexDirection: 'row',
    marginBottom: 20,
    marginLeft: -50,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    //backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 11,
  },
  controlButtonIcon: {
    fontSize: 18,
    color: '#fff',
  },
  cameraOutline: {
    width: 20,
    height: 16,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 2,
    position: 'relative',
  },
  timerIcon: {
    fontSize: 18,
    color: '#FF3B30',
  },
  flashIcon: {
    fontSize: 18,
    color: '#FF9500',
  },
  flashIcon2: {
    width: 30,
    marginTop: -6,
    height: 30,
    tintColor: '#fff',
  },
  flashIcon3: {
    width: 30,
    marginTop: -6,
    height: 30,
    tintColor: 'orange',
  },
  flashIcon4: {
    width: 30,
    marginTop: -6,
    height: 30,
    tintColor: 'yellow',
  },
  cameraSwitchArrow: {
    width: 30,
    height: 30,
    tintColor: '#fff',
    fontSize: 18,
    color: '#fff',
  },
  galleryButtonIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIcon: {
    position: 'absolute',
    top: -2,
    right: -2,
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  cameraSwitchIcon: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchArrows: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 8,
    color: '#fff',
    fontWeight: 'bold',
  },
  gridIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  gridSquare1: {
    position: 'absolute',
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 2,
    top: -3,
    left: 0,
  },
  gridSquare2: {
    position: 'absolute',
    width: 17,
    height: 17,
    borderWidth: 1.5,
    borderColor: '#fff',
    borderRadius: 2,
    top: 4,
    left: 6,
  },
  clock: {
    width: 26,
    height: 26,
    tintColor: '#fff',
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
    marginLeft: -50,
    marginBottom: -15,
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
  selectedCameraContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    //backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginLeft: -50,
    marginBottom: -17,
    //shadowColor: '#8A2BE2',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedCameraIcon: {
    width: 60,
    height: 60,
    borderRadius: 6,
    resizeMode: 'contain',
  },
  defaultCameraIcon: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultCameraText: {
    fontSize: 20,
    color: '#fff',
  },
  infoBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 8,
    color: '#000',
    fontWeight: 'bold',
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    zIndex: 10,
    marginLeft: -7.5,
    width: 16,
    height: 2,
    backgroundColor: '#fff',
    borderRadius: 1,
  },
  imagePreviewContainer: {
    position: 'absolute',
    top: 100,
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
