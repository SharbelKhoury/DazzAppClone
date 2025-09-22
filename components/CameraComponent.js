import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Grayscale,
  Sepia,
  Tint,
  ColorMatrix,
  ColorMatrixFilter,
  concatColorMatrices,
  invert,
  contrast,
  saturate,
  sepia,
  tint,
} from 'react-native-color-matrix-image-filters';
import Reanimated, {
  useSharedValue,
  useDerivedValue,
  interpolate,
} from 'react-native-reanimated';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Image,
  StatusBar,
  AppState,
  PanResponder,
  ScrollView,
  Animated,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';
import {
  openglFilterEffects,
  getOpenGLFilterOverlay,
  createOpenGLFilteredImage,
} from '../utils/openglFilterEffects';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import RNFS from 'react-native-fs';
import {captureRef} from 'react-native-view-shot';
import {
  getFilterMatrix,
  setMatrixSystem,
  getMatrixSystem,
  MATRIX_SYSTEMS,
} from '../utils/filterMatrixUtils';
import '../utils/matrixSystemController'; // Load matrix system controller for console access
import {getSelectedCameraIcon} from '../utils/cameraIconUtils';
import {
  applySkiaFilterToPhoto,
  createLUTFilterElement,
  getFilterComponent,
  combineWithTemperature,
} from '../FilterManagement/filterManagement';
import ViewShot from 'react-native-view-shot';
import {hueRotate} from 'react-native-image-filter-kit';

// ImageManipulator removed - using OpenGL effects only

// ImageCropPicker removed - using OpenGL effects only

// ImageFilterKit removed - using OpenGL effects only

/**
 * OpenGL Filter Overlay Component for Live Preview
 * Renders real-time filter overlays on camera preview
 * Applies visual effects without affecting actual photo capture
 *
 * @param {Array} activeFilters - Array of active filter IDs
 * @param {string} cameraPosition - Current camera position (front/back)
 * @returns {JSX.Element|null} - Filter overlay view or null if no filters
 */
const OpenGLFilterOverlay = ({activeFilters, cameraPosition}) => {
  if (activeFilters.length === 0) {
    return null;
  }

  const filterId = activeFilters[0];
  const overlayStyle = getOpenGLFilterOverlay(filterId);

  return <View style={overlayStyle} pointerEvents="none" />;
};

const CameraComponent = ({navigation}) => {
  const focalLengthArray = [13, 26, 35, 50];
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [focalLength, setFocalLength] = useState(focalLengthArray[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPhotoEnabled, setIsPhotoEnabled] = useState(false);
  const [isAppInBackground, setIsAppInBackground] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [tempActive, setTempActive] = useState(false);
  const [viewControlActive, setViewControlActive] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [temperatureValue, setTemperatureValue] = useState(50); // Temperature control value (0-100)
  const modalFilterRef = useRef(null); // Ref for capturing the filtered modal image

  // Dual photo capture states for dhalf filter
  const [dhalfPhotoCount, setDhalfPhotoCount] = useState(0); // 0: ready, 1: first photo taken, 2: both photos taken
  const [dhalfCapturedPhotos, setDhalfCapturedPhotos] = useState([]); // Array to store the two photos
  const [dhalfInstructionText, setDhalfInstructionText] = useState(''); // Instruction text for user

  // Triple photo capture states for 135ne filter
  const [ne135PhotoCount, setNe135PhotoCount] = useState(0); // 0: ready, 1: first photo, 2: second photo, 3: all photos taken
  const [ne135CapturedPhotos, setNe135CapturedPhotos] = useState([]); // Array to store the three photos
  const [ne135InstructionText, setNe135InstructionText] = useState(''); // Instruction text for user

  // Function to navigate to subscription
  const openSubscription = () => {
    navigation.navigate('Subscription');
  };

  // Function to handle triple photo capture for 135ne filter
  const handleNe135TriplePhoto = async () => {
    try {
      setIsProcessing(true);
      setIsPhotoEnabled(true);

      await new Promise(resolve => setTimeout(resolve, 20));

      if (cameraPosition === 'front') {
        await cameraRef.current?.setCameraPosition('front');
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const photo = await cameraRef.current?.takePhoto({
        qualityPrioritization: 'speed',
        flash: 'off',
        enableAutoStabilization: true,
        enableAutoRedEyeReduction: true,
        enableShutterSound: false,
      });

      if (!photo) {
        throw new Error('Failed to capture photo');
      }

      console.log('🎯 135ne photo captured:', photo.path);

      // Add photo to captured photos array
      const newPhotos = [
        ...ne135CapturedPhotos,
        {
          uri: photo.path.startsWith('file://')
            ? photo.path
            : `file://${photo.path}`,
          path: photo.path,
        },
      ];

      // Ensure we only keep the latest 3 photos
      const trimmedPhotos = newPhotos.slice(-3);

      console.log('🎯 135ne photos array updated:', trimmedPhotos);
      console.log(
        '🎯 Photo URIs:',
        trimmedPhotos.map(p => p.uri),
      );

      setNe135CapturedPhotos(trimmedPhotos);
      setNe135PhotoCount(trimmedPhotos.length);

      // Update instruction text
      if (trimmedPhotos.length === 1) {
        setNe135InstructionText('Please take or import a photo (1/3)');
      } else if (trimmedPhotos.length === 2) {
        setNe135InstructionText('Please take or import a photo (2/3)');
      } else if (trimmedPhotos.length === 3) {
        setNe135InstructionText('All photos captured! Processing...');
        // All photos captured, now merge them
        await mergeNe135Photos(trimmedPhotos);
      }
    } catch (error) {
      console.error('❌ handleNe135TriplePhoto failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsProcessing(false);
      setIsPhotoEnabled(false);
    }
  };

  // Function to handle dual photo capture for dhalf filter
  const handleDhalfDualPhoto = async () => {
    try {
      setIsProcessing(true);
      setIsPhotoEnabled(true);

      await new Promise(resolve => setTimeout(resolve, 20));

      if (cameraPosition === 'front') {
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });

      console.log('🎯 Dhalf photo captured:', photo.path);

      // Add photo to captured photos array
      const newPhotos = [
        ...dhalfCapturedPhotos,
        {
          uri: photo.path.startsWith('file://')
            ? photo.path
            : `file://${photo.path}`,
          path: photo.path,
        },
      ];

      // Ensure we only keep the latest 2 photos
      const trimmedPhotos = newPhotos.slice(-2);

      console.log('🎯 Dhalf photos array updated:', trimmedPhotos);
      console.log(
        '🎯 Photo URIs:',
        trimmedPhotos.map(p => p.uri),
      );

      setDhalfCapturedPhotos(trimmedPhotos);
      setDhalfPhotoCount(trimmedPhotos.length);

      // Update instruction text
      if (trimmedPhotos.length === 1) {
        setDhalfInstructionText('Please take or import a photo (1/2)');
      } else if (trimmedPhotos.length === 2) {
        setDhalfInstructionText('Both photos captured! Processing...');
        // Both photos captured, now merge them
        await mergeDhalfPhotos(trimmedPhotos);
      }
    } catch (error) {
      console.error('❌ handleDhalfDualPhoto failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsProcessing(false);
      setIsPhotoEnabled(false);
    }
  };

  // Function to merge three 135ne photos with horizontal black separators
  const mergeNe135Photos = async photos => {
    try {
      console.log('🎯 Merging 135ne photos:', photos);

      if (photos.length !== 3) {
        console.error(
          '❌ Expected 3 photos for 135ne merge, got:',
          photos.length,
        );
        return;
      }

      // Create a merged image with horizontal black separators
      const mergedImageUri = await createNe135MergedImage(photos);

      if (mergedImageUri) {
        // Set the merged image and show modal
        setSelectedImage(mergedImageUri);
        setModalActive(true);

        // Reset 135ne states (but keep photos for modal display)
        setNe135PhotoCount(0);
        setNe135InstructionText('');
      }
    } catch (error) {
      console.error('❌ mergeNe135Photos failed:', error);
      Alert.alert('Error', 'Failed to merge photos');
    }
  };

  // Function to create merged image with horizontal black separators
  const createNe135MergedImage = async photos => {
    try {
      console.log('🎯 Creating 135ne merged image with photos:', photos);

      // Create a temporary merged image path
      const mergedImagePath = `${
        RNFS.TemporaryDirectoryPath
      }/135ne_merged_${Date.now()}.jpg`;

      // For now, we'll create a simple merged image by copying the first photo
      // TODO: Implement actual vertical merging with horizontal separators
      await RNFS.copyFile(photos[0].path, mergedImagePath);

      return `file://${mergedImagePath}`;
    } catch (error) {
      console.error('❌ createNe135MergedImage failed:', error);
      return null;
    }
  };

  // Function to merge two dhalf photos with black separator
  const mergeDhalfPhotos = async photos => {
    try {
      console.log('🎯 Merging dhalf photos:', photos);

      if (photos.length !== 2) {
        console.error(
          '❌ Expected 2 photos for dhalf merge, got:',
          photos.length,
        );
        return;
      }

      // Create a merged image with black separator
      const mergedImageUri = await createDhalfMergedImage(photos);

      if (mergedImageUri) {
        // Set the merged image and show modal
        setSelectedImage(mergedImageUri);
        setModalActive(true);

        // Reset dhalf states (but keep photos for modal display)
        setDhalfPhotoCount(0);
        setDhalfInstructionText('');
      }
    } catch (error) {
      console.error('❌ mergeDhalfPhotos failed:', error);
      Alert.alert('Error', 'Failed to merge photos');
    }
  };

  // Function to create merged image with black separator
  const createDhalfMergedImage = async photos => {
    try {
      console.log('🎯 Creating dhalf merged image with photos:', photos);

      // Create a temporary merged image path
      const mergedImagePath = `${
        RNFS.TemporaryDirectoryPath
      }/dhalf_merged_${Date.now()}.jpg`;

      // For now, we'll create a simple merged image by copying the first photo
      // The actual dual photo display will be handled in the modal
      // We'll use a special URI to identify this as a dual photo case
      await RNFS.copyFile(photos[0].path, mergedImagePath);

      console.log('🎯 Dhalf merged image created at:', mergedImagePath);
      return `file://${mergedImagePath}`;
    } catch (error) {
      console.error('❌ createDhalfMergedImage failed:', error);
      return null;
    }
  };

  // Function to handle close with save
  const handleCloseWithSave = async () => {
    try {
      // Save the filtered image first
      await handleSaveFilteredImage();
      // Then close the modal
      setModalActive(false);
      setSelectedImage(null);

      // Reset photos after modal closes
      if (activeFilters[0] === 'dhalf') {
        setDhalfCapturedPhotos([]);
      }
      if (activeFilters[0] === '135ne') {
        setNe135CapturedPhotos([]);
      }
    } catch (error) {
      console.error('❌ Error saving image before close:', error);
      // Close modal even if save fails
      setModalActive(false);
      setSelectedImage(null);

      // Reset photos after modal closes
      if (activeFilters[0] === 'dhalf') {
        setDhalfCapturedPhotos([]);
      }
      if (activeFilters[0] === '135ne') {
        setNe135CapturedPhotos([]);
      }
    }
  };

  // Function to capture and save the filtered image from modal
  const handleSaveFilteredImage = async () => {
    try {
      if (modalFilterRef.current && selectedImage) {
        console.log('🎨 Capturing filtered image from modal...');

        // Wait for the component to render
        await new Promise(resolve => setTimeout(resolve, 500));

        // Get the current active filter to determine naming
        const currentFilter = activeFilters[0] || 'unknown';

        // For dhalf and 135ne filters, capture the entire modal to include black backgrounds
        let uri;
        if (currentFilter === 'dhalf' || currentFilter === '135ne') {
          // Find the main modal container (the one with black background)
          const mainModalContainer = modalFilterRef.current.parent?.parent;
          if (mainModalContainer) {
            uri = await captureRef(mainModalContainer, {
              format: 'jpg',
              quality: 1,
              result: 'tmpfile',
            });
          } else {
            // Fallback: capture the modal container with black background
            const modalContainer = modalFilterRef.current.parent;
            if (modalContainer) {
              uri = await captureRef(modalContainer, {
                format: 'jpg',
                quality: 1,
                result: 'tmpfile',
              });
            } else {
              // Final fallback to original method
              uri = await captureRef(modalFilterRef.current, {
                format: 'jpg',
                quality: 1,
                result: 'tmpfile',
              });
            }
          }
        } else {
          // For other filters, use the original capture method
          uri = await captureRef(modalFilterRef.current, {
            format: 'jpg',
            quality: 1,
            result: 'tmpfile',
          });
        }

        if (uri) {
          const tempPath = `${
            RNFS.TemporaryDirectoryPath
          }/skia_filtered_${currentFilter}_${Date.now()}.jpg`;

          // Copy the captured filtered image to the temp path
          await RNFS.copyFile(uri, tempPath);

          console.log('🎨 Saved filtered image to:', tempPath);

          // Save the photo to gallery
          const saved = await savePhotoToGallery(tempPath);

          if (saved) {
            console.log('✅ Filtered image saved to gallery');
            fetchLatestMedia();

            if (currentFilter === 'dhalf') {
              /* Alert.alert(
                'Photo Saved!',
                '✅ Dual photo merged and saved to gallery!',
              ); */
            } else {
              //Alert.alert('Photo Saved!', 'Filtered photo saved to gallery!');
            }

            // Close the modal
            setModalActive(false);
            setSelectedImage(null);
          } else {
            console.log('❌ Failed to save filtered image');
            Alert.alert('Error', 'Failed to save photo to gallery');
          }
        } else {
          throw new Error('Failed to capture filtered image');
        }
      }
    } catch (error) {
      console.error('❌ Error saving filtered image:', error);
      Alert.alert('Error', 'Failed to save filtered photo');
    }
  };

  // PanResponder for temperature control
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        console.log('Temperature control started');
      },
      onPanResponderMove: (evt, gestureState) => {
        const {locationX} = evt.nativeEvent;
        const containerWidth = 120; // Width of the temperature bar
        const percentage = Math.max(
          0,
          Math.min(100, (locationX / containerWidth) * 100),
        );
        setTemperatureValue(percentage);
      },
      onPanResponderRelease: () => {
        console.log(
          'Temperature set to:',
          Math.round(3000 + (temperatureValue / 100) * 4000),
          'K',
        );
      },
    }),
  ).current;

  /**
   * Calculate zoom value based on focal length
   * Maps focal lengths to zoom multipliers for camera display
   * Provides standardized zoom values across different camera hardware
   *
   * @param {number} focalLength - Focal length in millimeters
   * @returns {number} - Zoom multiplier value
   */
  const calculateZoomFromFocalLength = focalLength => {
    // Map focal lengths to zoom values for ultra-wide camera:
    // 13mm = 0.5x (ultra-wide - camera hardware limit)
    // 18mm = 0.7x (very wide)
    // 24mm = 1.0x (wide)
    // 26mm = 1.1x (slightly wide)
    // 35mm = 1.5x (standard)
    // 50mm = 2.1x (medium telephoto)
    // 85mm = 3.6x (telephoto)
    // 135mm = 5.7x (long telephoto)

    switch (focalLength) {
      case 13:
        return 0.3; // Ultra-wide - even wider than 0.5x
      case 18:
        return 0.7; // Very wide
      case 24:
        return 1.0; // Wide
      case 26:
        return 1.1; // Slightly wide
      case 35:
        return 1.5; // Standard
      case 50:
        return 2.1; // Medium telephoto
      case 85:
        return 3.6; // Telephoto
      case 135:
        return 5.7; // Long telephoto
      default:
        return 1.0; // Default to wide
    }
  };

  /**
   * Calculate temperature color overlay based on Kelvin value (INVERTED POLARITIES)
   * Creates color temperature overlays with inverted warm/cold effects
   * Maps Kelvin values to RGBA color overlays for creative photography
   *
   * @param {number} tempValue - Temperature value (0-100)
   * @returns {string} - RGBA color string for temperature overlay
   */
  const getTemperatureColor = tempValue => {
    // Convert temperatureValue (0-100) to Kelvin (3000-7000)
    const kelvin = 3000 + (tempValue / 100) * 4000;

    // Map Kelvin to color temperature overlay (INVERTED: warm becomes cold, cold becomes warm)
    if (kelvin <= 3200) {
      // Very warm (tungsten) - now gives strong BLUE tint (cold)
      return 'rgba(77, 130, 255, 0.15)'; // Blue with 15% opacity
    } else if (kelvin <= 4000) {
      // Warm (sunrise/sunset) - now gives golden BLUE tint (cool)
      return 'rgba(100, 150, 255, 0.12)'; // Light blue with 12% opacity
    } else if (kelvin <= 5000) {
      // Neutral (midday) - now gives slight COOL tint
      return 'rgba(150, 180, 255, 0.08)'; // Light cool with 8% opacity
    } else if (kelvin <= 6000) {
      // Cool (overcast) - now gives slight WARM tint
      return 'rgba(255, 200, 100, 0.08)'; // Light warm with 8% opacity
    } else {
      // Very cool (shade) - now gives stronger WARM tint
      return 'rgba(255, 147, 41, 0.12)'; // Orange with 12% opacity
    }
  };

  // const [openGLWorking, setOpenGLWorking] = useState(true); // Commented for future use

  // Camera position state - using the simpler approach like your friend
  const aspectRatioArray = [
    'threeTwo',
    'fourThree',
    'nineSixteen',
    'sixteenNine',
  ];
  const [cameraPosition, setCameraPosition] = useState('back');
  const [aspectRatio, setAspectRatio] = useState(aspectRatioArray[1]);

  // Animation state for camera flip rotation
  const rotation = useRef(new Animated.Value(0)).current;
  const [isRotated, setIsRotated] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Focus UI state (reticle + exposure slider)
  const [focusUIVisible, setFocusUIVisible] = useState(false);
  const [focusPoint, setFocusPoint] = useState({x: 0, y: 0});
  const [exposureValue, setExposureValue] = useState(0); // -1 .. +1 visual range
  const [isDraggingExposure, setIsDraggingExposure] = useState(false);
  const [cameraExposure, setCameraExposure] = useState(0); // Actual exposure value for camera
  const [exposureControlActive, setExposureControlActive] = useState(false);
  const [autoExposure, setAutoExposure] = useState(false);

  // Effect to handle autoExposure state changes
  useEffect(() => {
    if (!autoExposure) {
      // Apply these 4 functions when autoExposure becomes false
      setExposureValue(0);
      setCameraExposure(0);
      syncSlidersWithExposureValue(0); // Synchronize both sliders
    }
  }, [autoExposure, syncSlidersWithExposureValue]);

  // Function to synchronize both sliders when exposure value changes
  const syncSlidersWithExposureValue = useCallback(
    exposureVal => {
      // Update horizontal slider position based on exposure value (-9 to +9)
      const normalizedPosition = exposureVal / 9; // -1 to 1
      const horizontalPosition = 122.5 + normalizedPosition * 122.5; // 0 to 245
      setHorizontalSliderPosition(
        Math.max(0, Math.min(245, horizontalPosition)),
      );

      // Update vertical sun-reticle position based on exposure value
      const verticalPosition =
        sliderDefaultOffset - normalizedPosition * sliderHalfTravel;
      exposurePan.setValue(
        Math.max(
          sliderDefaultOffset - sliderHalfTravel,
          Math.min(sliderDefaultOffset + sliderHalfTravel, verticalPosition),
        ),
      );
    },
    [exposurePan, sliderDefaultOffset, sliderHalfTravel],
  );

  // Centralized function to handle control state transitions
  const handleControlToggle = useCallback(controlType => {
    // First, close all other controls
    if (controlType !== 'temp') {
      setTempActive(false);
    }
    if (controlType !== 'view') {
      setViewControlActive(false);
    }
    if (controlType !== 'exposure') {
      setExposureControlActive(false);
    }

    // Then toggle the selected control and update hideControls
    switch (controlType) {
      case 'temp':
        setTempActive(prev => {
          const newValue = !prev;
          setHideControls(newValue);
          return newValue;
        });
        break;
      case 'view':
        setViewControlActive(prev => {
          const newValue = !prev;
          setHideControls(newValue);
          return newValue;
        });
        break;
      case 'exposure':
        setExposureControlActive(prev => {
          const newValue = !prev;
          setHideControls(newValue);
          return newValue;
        });
        break;
    }
  }, []);

  // Horizontal exposure slider state
  const [horizontalSliderPosition, setHorizontalSliderPosition] =
    useState(122.5); // Center of 245px width
  const [isDraggingHorizontalSlider, setIsDraggingHorizontalSlider] =
    useState(false);

  // Reanimated shared value for exposure slider (from -1..0..1)
  const exposureSlider = useSharedValue(0);

  // Map slider to device exposure range [minExposure, 0, maxExposure]
  const animatedExposureValue = useDerivedValue(() => {
    if (device == null) return 0;

    return interpolate(
      exposureSlider.value,
      [-1, 0, 1],
      [device.minExposure, 0, device.maxExposure],
    );
  }, [exposureSlider, device]);

  const [focusUIColor, setFocusUIColor] = useState('#ffffff');
  const [showExposureLine, setShowExposureLine] = useState(false);
  const [lastOrientation, setLastOrientation] = useState(
    Dimensions.get('window'),
  );
  const [lastFocusTime, setLastFocusTime] = useState(0);
  const [exposureSliderSide, setExposureSliderSide] = useState('right'); // 'left' or 'right'
  const focusScale = useRef(new Animated.Value(1)).current;
  const focusOpacity = useRef(new Animated.Value(0)).current;
  const exposurePan = useRef(new Animated.Value(0)).current; // visual offset for slider handle
  const focusUIHideTimerRef = useRef(null);
  const focusUIColorTimerRef = useRef(null);
  // Slider geometry
  const sliderBarHeight = 140;
  const sliderHandleSize = 28;
  const sliderHalfTravel = (sliderBarHeight - sliderHandleSize) / 2; // keep handle within line
  const sliderDefaultOffset = 55; // pixels down from top of line
  const exposureDragSpeed = 0.15; // slow down handle movement to half speed

  // Exposure slider gesture handlers (JS thread)
  const handleExposurePan = useCallback(
    translationY => {
      // Mark as dragging to keep UI visible
      setIsDraggingExposure(true);
      // Show the exposure line when user starts dragging
      setShowExposureLine(true);
      // Clear any pending hide timer
      if (focusUIHideTimerRef.current) {
        clearTimeout(focusUIHideTimerRef.current);
        focusUIHideTimerRef.current = null;
      }
      // Cancel pending color-dim timer while interacting
      if (focusUIColorTimerRef.current) {
        clearTimeout(focusUIColorTimerRef.current);
        focusUIColorTimerRef.current = null;
      }

      // Scale finger movement to slow down translation speed
      const scaledDy = translationY * exposureDragSpeed;
      // Clamp visual movement to slider travel pixels
      const clampedPx = Math.max(
        -sliderHalfTravel,
        Math.min(sliderHalfTravel, scaledDy),
      );
      exposurePan.setValue(clampedPx + sliderDefaultOffset);
      // Map to EV range [-9, 9], upward = increase EV
      const ev = (-clampedPx / sliderHalfTravel) * 9;
      setExposureValue(ev);
      console.log('Exposure slider moved (EV):', ev.toFixed(1));

      // Synchronize horizontal slider position
      const normalizedPosition = ev / 9; // -1 to 1
      const horizontalPosition = 122.5 + normalizedPosition * 122.5; // 0 to 245
      setHorizontalSliderPosition(
        Math.max(0, Math.min(245, horizontalPosition)),
      );

      // Update Reanimated shared value (maps to [-1, 1] range for interpolation)
      const normalizedSliderValue = ev / 9; // Convert [-9, 9] to [-1, 1]
      exposureSlider.value = normalizedSliderValue;

      // Update camera exposure directly
      if (device) {
        const newExposure = interpolate(
          normalizedSliderValue,
          [-1, 0, 1],
          [device.minExposure, 0, device.maxExposure],
        );
        setCameraExposure(newExposure);
        console.log('Camera exposure set to:', newExposure);
      }
    },
    [
      exposurePan,
      sliderHalfTravel,
      sliderDefaultOffset,
      exposureSlider,
      device,
    ],
  );

  const handleExposureEnd = useCallback(() => {
    console.log('Exposure commit:', exposureValue.toFixed(2));
    setIsDraggingExposure(false);
    // After release, dim UI to gray after 2s to indicate locked focus/exposure
    if (focusUIColorTimerRef.current) {
      clearTimeout(focusUIColorTimerRef.current);
    }
    focusUIColorTimerRef.current = setTimeout(() => {
      setFocusUIColor('rgba(206, 206, 206, 0.7)');
      focusUIColorTimerRef.current = null;
    }, 1200);
  }, [exposureValue]);

  const exposureGesture = Gesture.Pan()
    .enabled(isCameraReady && !isFlipping)
    .onUpdate(e => {
      // Only vertical movement matters
      const dy = e.translationY;
      // Update on JS thread
      runOnJS(handleExposurePan)(dy);
    })
    .onEnd(() => {
      runOnJS(handleExposureEnd)();
    });

  // Horizontal exposure slider gesture handlers
  const handleHorizontalSliderPan = useCallback(
    translationX => {
      setIsDraggingHorizontalSlider(true);

      // Calculate new position with natural 1:1 finger movement (center is 122.5, slider width is 245)
      const newPosition = Math.max(0, Math.min(245, 122.5 + translationX));
      setHorizontalSliderPosition(newPosition);

      // Map position to exposure value (-9.0 to +9.0 range)
      const normalizedPosition = (newPosition - 122.5) / 122.5; // -1 to 1
      const exposureVal = normalizedPosition * 9; // -9.0 to 9.0
      setExposureValue(exposureVal);
      setCameraExposure(exposureVal);

      // Synchronize vertical sun-reticle position
      const verticalPosition =
        sliderDefaultOffset - normalizedPosition * sliderHalfTravel;
      exposurePan.setValue(
        Math.max(
          sliderDefaultOffset - sliderHalfTravel,
          Math.min(sliderDefaultOffset + sliderHalfTravel, verticalPosition),
        ),
      );
    },
    [exposurePan, sliderDefaultOffset, sliderHalfTravel],
  );

  const handleHorizontalSliderEnd = useCallback(() => {
    setIsDraggingHorizontalSlider(false);
    console.log('Horizontal exposure slider commit:', exposureValue.toFixed(2));
  }, [exposureValue]);

  const horizontalSliderGesture = Gesture.Pan()
    .minDistance(0)
    .activeOffsetX([-10, 10])
    .onUpdate(e => {
      const dx = e.translationX;
      runOnJS(handleHorizontalSliderPan)(dx);
    })
    .onEnd(() => {
      runOnJS(handleHorizontalSliderEnd)();
    });

  // Animation state for modal sliding
  const modalSlideAnimation = useRef(new Animated.Value(0)).current;
  const modalPanGesture = useRef(new Animated.Value(0)).current;

  // Map animation value 0 → 1, 1 → 0 (horizontal rotation)
  const flipInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'], // rotate horizontally like a 3D flip
  });

  // Map modal animation value 0 → 1 (slide up from bottom)
  const modalSlideInterpolate = modalSlideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0], // slide up 300px from bottom
  });

  // Combine slide animation with pan gesture
  const modalTransform = Animated.add(modalSlideInterpolate, modalPanGesture);
  const [aspectRatioType, setAspectRatioType] = useState('Selected');
  const timestampArray = ['none', '1', '2', '3'];
  const [timestampDate, setTimestampDate] = useState('Generated');

  // Combined images state
  const [capturedPhotos, setCapturedPhotos] = useState([]);
  const [isCapturingCombined, setIsCapturingCombined] = useState(false);
  const [combinedCaptureStep, setCombinedCaptureStep] = useState(0); // 0: ready, 1: first photo, 2: second photo
  const combinationModeStatus =
    combinedCaptureStep === 1 ? '1/2' : combinedCaptureStep === 2 ? '2/2' : '';
  const [isCombinationMode, setIsCombinationMode] = useState(false); // Track if we're in combination mode
  const [tempCombinationView, setTempCombinationView] = useState(null); // Temporary view for combination
  const [timestamp, setTimestamp] = useState(timestampArray[0]);
  const colorProfileArray = ['400TX', 'VEL X5', '100ACR'];
  const [colorProfile, setColorProfile] = useState(colorProfileArray[2]);
  const [flashMode, setFlashMode] = useState('off');
  const [showGrid, setShowGrid] = useState(false);
  const [level, setLevel] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [locationMode, setLocationMode] = useState(false);
  const [timerMode, setTimerMode] = useState('off');
  const [timerCountdown, setTimerCountdown] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [latestMedia, setLatestMedia] = useState(null);
  const cameraRef = useRef(null); // Ref for Camera component
  const cameraContainerRef = useRef(null); // Ref for camera container (for ViewShot)
  const tempCombinationViewRef = useRef(null); // Ref for temporary combination view
  const [bottomControlModal, setBottomControlModal] = useState(false);
  const devices = useCameraDevices();

  /*  const focus = useCallback(point => {
    const c = cameraRef.current;
    if (c == null) return;
    c.focus(point);
  }, []); */

  const focus = useCallback(
    async point => {
      const c = cameraRef.current;
      if (!c || !device) return;
      if (!device.supportsFocus) {
        console.log('Focus not supported on device:', device.name);
        return;
      }
      try {
        await c.focus(point);
      } catch (e) {
        console.warn('Focus failed:', e?.message ?? e);
      }
    },
    [device],
  );

  const logTap = useCallback(
    (x, y) => {
      console.log(
        'Tap detected at',
        x,
        y,
        'device:',
        device?.name,
        'supportsFocus:',
        device?.supportsFocus,
      );
    },
    [device],
  );

  const handleTap = useCallback(
    (x, y) => {
      logTap(x, y);
      focus({x, y});
      triggerFocusUI(x, y);
      setLastFocusTime(Date.now());
    },
    [logTap, focus, triggerFocusUI],
  );

  const gesture = Gesture.Tap()
    .enabled(isCameraReady && !isFlipping)
    .onEnd(({x, y}) => {
      runOnJS(handleTap)(x, y);
    });

  const triggerFocusUI = useCallback(
    (x, y) => {
      // Stop any in-flight animations and pending hides
      focusScale.stopAnimation();
      focusOpacity.stopAnimation();
      if (focusUIHideTimerRef.current) {
        clearTimeout(focusUIHideTimerRef.current);
        focusUIHideTimerRef.current = null;
      }

      setFocusPoint({x, y});
      setFocusUIVisible(true);
      setFocusUIColor('#ffffff'); // reset to white while interacting
      setShowExposureLine(false); // hide line initially

      // Determine which side to show the exposure slider based on focus point
      const screenWidth = Dimensions.get('window').width;
      const isRightSide = x > screenWidth * 0.6; // If focus is in right 40% of screen
      setExposureSliderSide(isRightSide ? 'left' : 'right');
      // Cancel any pending color-dim timer when starting a new focus
      if (focusUIColorTimerRef.current) {
        clearTimeout(focusUIColorTimerRef.current);
        focusUIColorTimerRef.current = null;
      }

      // Reset focus UI values (but preserve exposure settings)
      focusScale.setValue(1.4);
      focusOpacity.setValue(0);

      // Sync sun-reticle position with current exposure value
      const normalizedPosition = exposureValue / 9; // -1 to 1
      const verticalPosition =
        sliderDefaultOffset - normalizedPosition * sliderHalfTravel;
      exposurePan.setValue(
        Math.max(
          sliderDefaultOffset - sliderHalfTravel,
          Math.min(sliderDefaultOffset + sliderHalfTravel, verticalPosition),
        ),
      );

      // Keep current exposure values when tapping new focus point
      // setExposureValue(0); // Don't reset exposure value
      // exposureSlider.value = 0; // Don't reset Reanimated shared value
      // setCameraExposure(0); // Don't reset camera exposure

      // Animate in (scale down, fade in), keep visible until we schedule hide
      Animated.parallel([
        Animated.timing(focusScale, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(focusOpacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();

      // Debounced hide after delay (only if not dragging exposure)
      focusUIHideTimerRef.current = setTimeout(() => {
        if (!isDraggingExposure) {
          Animated.timing(focusOpacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }).start(() => setFocusUIVisible(false));
        }
        focusUIHideTimerRef.current = null;
      }, 1400);
    },
    [focusOpacity, focusScale, isDraggingExposure],
  );

  // Hide focus UI when device orientation changes or camera moves significantly
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      const {width: newWidth, height: newHeight} = window;
      const {width: oldWidth, height: oldHeight} = lastOrientation;

      // Check if orientation changed significantly (landscape <-> portrait)
      const orientationChanged =
        (newWidth > newHeight && oldWidth < oldHeight) ||
        (newWidth < newHeight && oldWidth > oldHeight);

      if (orientationChanged && focusUIVisible) {
        console.log('Device orientation changed, hiding focus UI');
        setFocusUIVisible(false);
        setShowExposureLine(false);
        // Clear any pending timers
        if (focusUIHideTimerRef.current) {
          clearTimeout(focusUIHideTimerRef.current);
          focusUIHideTimerRef.current = null;
        }
        if (focusUIColorTimerRef.current) {
          clearTimeout(focusUIColorTimerRef.current);
          focusUIColorTimerRef.current = null;
        }
      }

      setLastOrientation(window);
    });

    return () => subscription?.remove();
  }, [lastOrientation, focusUIVisible]);

  // Hide focus UI when camera moves significantly (background changes)
  useEffect(() => {
    if (!focusUIVisible) return;

    const hideFocusUI = () => {
      console.log('Camera motion detected, hiding focus UI');
      setFocusUIVisible(false);
      setShowExposureLine(false);
      // Clear any pending timers
      if (focusUIHideTimerRef.current) {
        clearTimeout(focusUIHideTimerRef.current);
        focusUIHideTimerRef.current = null;
      }
      if (focusUIColorTimerRef.current) {
        clearTimeout(focusUIColorTimerRef.current);
        focusUIColorTimerRef.current = null;
      }
    };

    // Listen for camera motion/background changes
    // This will trigger when the camera view changes significantly
    const motionTimer = setInterval(() => {
      if (focusUIVisible && Date.now() - lastFocusTime > 2000) {
        // If focus UI has been visible for more than 2 seconds without new focus
        // and camera is likely moving, hide it
        const shouldHide = Math.random() > 0.8; // Simulate motion detection
        if (shouldHide) {
          hideFocusUI();
        }
      }
    }, 1000);

    return () => clearInterval(motionTimer);
  }, [focusUIVisible, lastFocusTime]);

  useEffect(() => {
    return () => {
      if (focusUIHideTimerRef.current) {
        clearTimeout(focusUIHideTimerRef.current);
        focusUIHideTimerRef.current = null;
      }
      if (focusUIColorTimerRef.current) {
        clearTimeout(focusUIColorTimerRef.current);
        focusUIColorTimerRef.current = null;
      }
    };
  }, []);
  /**
   * Test if OpenGL is working - Commented for future use
   * Tests availability of OpenGL filter effects and overlay functions
   * Sets openGLWorking state based on component availability
   *
   * @returns {boolean} - True if all OpenGL components are available
   */
  /*
  const testOpenGL = () => {
    try {
      console.log('🧪 Testing OpenGL components...');
      console.log(
        'OpenGL filter effects available:',
        openglFilterEffects ? 'YES' : 'NO',
      );
      console.log(
        'OpenGL overlay function available:',
        getOpenGLFilterOverlay ? 'YES' : 'NO',
      );

      // Test if essential components are available
      const effectsAvailable = openglFilterEffects;
      const overlayAvailable = getOpenGLFilterOverlay;

      if (effectsAvailable && overlayAvailable) {
        console.log('✅ All essential OpenGL components available');
        setOpenGLWorking(true);
        return true;
      } else {
        console.log('❌ Some OpenGL components missing');
        console.log('Effects available:', effectsAvailable);
        console.log('Overlay available:', overlayAvailable);
        setOpenGLWorking(false);
        return false;
      }
    } catch (error) {
      console.log('❌ OpenGL test failed:', error);
      setOpenGLWorking(false);
      return false;
    }
  };
  */

  /**
   * Manual device selection function for camera selection
   * Intelligently selects the best available camera based on position
   * Prioritizes specific camera types to avoid AVFoundation errors
   * Handles fallbacks for both front and back camera positions
   *
   * @returns {Object|null} - Selected camera device or null if none available
   */
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
      // Prefer wide-angle with focus support for best FOV + autofocus
      const backWideWithFocus = deviceArray.find(
        d =>
          d.position === 'back' &&
          d?.supportsFocus === true &&
          (d.name === 'Back Wide Angle Camera' || /Wide/i.test(d.name)) &&
          !/Telephoto/i.test(d.name),
      );
      if (backWideWithFocus) {
        return backWideWithFocus;
      }

      // Next: any back camera with focus, avoiding Telephoto if possible
      const backWithFocusNonTele = deviceArray.find(
        d =>
          d.position === 'back' &&
          d?.supportsFocus === true &&
          !/Telephoto/i.test(d.name),
      );
      if (backWithFocusNonTele) {
        return backWithFocusNonTele;
      }

      // Then: any back camera with focus
      const backWithFocus = deviceArray.find(
        d => d.position === 'back' && d?.supportsFocus === true,
      );
      if (backWithFocus) {
        return backWithFocus;
      }

      // Fallbacks
      const dualWideCamera = deviceArray.find(
        d => d.position === 'back' && d.name === 'Back Dual Wide Camera',
      );
      if (dualWideCamera) {
        return dualWideCamera;
      }

      const ultraWideCamera = deviceArray.find(
        d => d.position === 'back' && d.name === 'Back Ultra Wide Camera',
      );
      if (ultraWideCamera) {
        return ultraWideCamera;
      }

      // Last resort: any back camera
      const anyBackCamera = deviceArray.find(d => d.position === 'back');
      if (anyBackCamera) {
        return anyBackCamera;
      }
    }

    return null;
  };

  const device = getDevice();

  // Effect to log camera position changes and focus capability
  useEffect(() => {
    //console.log('Camera position changed to:', cameraPosition);
    //console.log('Current device:', device);
    console.log(
      'Device:',
      device?.name,
      'supportsFocus:',
      device?.supportsFocus,
    );
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

  // Cleanup effect for animation values
  useEffect(() => {
    return () => {
      // Stop all animations and reset values to prevent warnings
      rotation.stopAnimation();
      modalSlideAnimation.stopAnimation();
      modalPanGesture.stopAnimation();
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

  // Monitor focal length changes and log zoom level
  useEffect(() => {
    const zoomLevel = calculateZoomFromFocalLength(focalLength);
    console.log(
      `📷 Focal length changed to ${focalLength}mm (${zoomLevel}x zoom)`,
    );
  }, [focalLength]);

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
        // App is going to background (user switched apps or pulled down status bar)
        // OR app is becoming inactive (status bar pull-down, control center, etc.)
        setIsAppInBackground(true);
        console.log('App going to background/inactive - disabling camera');
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
      try {
        if (
          global.activeFilters &&
          JSON.stringify(global.activeFilters) !== JSON.stringify(activeFilters)
        ) {
          console.log('Active filters updated:', global.activeFilters);
          setActiveFilters(global.activeFilters);
        }
      } catch (error) {
        console.log('Error checking filters:', error);
      }
    };

    const checkCameraSelection = () => {
      try {
        // Also check if selectedCameraId has changed
        if (
          global.selectedCameraId &&
          (!activeFilters.length ||
            activeFilters[0] !== global.selectedCameraId)
        ) {
          console.log('Camera selection updated:', global.selectedCameraId);
          setActiveFilters([global.selectedCameraId]);
        }
      } catch (error) {
        console.log('Error checking camera selection:', error);
      }
    };

    const interval = setInterval(() => {
      checkFilters();
      checkCameraSelection();
    }, 500);
    return () => clearInterval(interval);
  }, [activeFilters]);

  /**
   * Fetch latest media for gallery preview (from app's photos)
   * Scans temporary directory for photos taken by the app
   * Filters for skia_filtered_ and filtered_ prefixed images
   * Sorts by creation time and sets the most recent photo
   *
   * @returns {Promise<void>} - Updates latestMedia state with most recent photo
   */
  const fetchLatestMedia = async () => {
    try {
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

      // Sort by creation time (newest first) and get the latest
      const sortedPhotos = photoFiles
        .map(file => ({
          uri: `file://${file.path}`,
          name: file.name,
          timestamp: file.mtime || new Date(),
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (sortedPhotos.length > 0) {
        setLatestMedia({
          uri: sortedPhotos[0].uri,
          type: 'photo',
          filename: sortedPhotos[0].name,
          timestamp:
            sortedPhotos[0].timestamp instanceof Date
              ? sortedPhotos[0].timestamp.toISOString()
              : sortedPhotos[0].timestamp,
        });
      } else {
        setLatestMedia(null);
      }
    } catch (error) {
      console.error('Error fetching latest media:', error);
      setLatestMedia(null);
    }
  };

  // Load latest media on component mount
  useEffect(() => {
    fetchLatestMedia();
    // Test OpenGL on mount - Commented for future use
    /*
    setTimeout(() => {
      testOpenGL();
    }, 1000);
    */
  }, []);

  /**
   * Function to save photo to gallery
   * Saves processed photos to device's camera roll
   * Refreshes gallery preview after successful save
   *
   * @param {string} photoUri - URI of the photo to save
   * @returns {Promise<boolean>} - True if save successful, false otherwise
   */
  const savePhotoToGallery = async photoUri => {
    try {
      console.log('🎯 savePhotoToGallery: Attempting to save photo:', photoUri);
      console.log('🎯 savePhotoToGallery: Photo URI type:', typeof photoUri);
      console.log('🎯 savePhotoToGallery: Photo URI exists:', !!photoUri);

      await CameraRoll.saveAsset(photoUri);
      console.log('✅ savePhotoToGallery: Photo saved successfully');

      // Refresh gallery preview to show the new photo
      fetchLatestMedia();
      return true;
    } catch (error) {
      console.error('❌ savePhotoToGallery: Error saving to gallery:', error);
      console.error(
        '❌ savePhotoToGallery: Error details:',
        JSON.stringify(error, null, 2),
      );
      return false;
    }
  };

  /**
   * Function to apply Skia filter to photo using actual Skia Canvas
   * Processes photos with Skia image processing library
   * Creates color matrices for various filter effects
   * Saves filtered images to temporary directory
   *
   * @param {string} photoUri - URI of the photo to process
   * @param {string} filterId - ID of the filter to apply
   * @returns {Promise<string>} - URI of the processed photo or original if failed
   */

  /**
   * Helper function to combine two color matrices that is used especially here for
   * combining the temperature matrix with the filter matrix.
   * Performs matrix multiplication for 5x4 color matrices
   * Used to combine multiple filter effects into a single matrix
   *
   * @param {Array} matrix1 - First 5x4 color matrix
   * @param {Array} matrix2 - Second 5x4 color matrix
   * @returns {Array} - Combined 5x4 color matrix
   */
  const combineColorMatrices = (matrix1, matrix2) => {
    // Matrix multiplication for 5x4 matrices
    const result = [];

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += matrix1[i * 5 + k] * matrix2[k * 5 + j];
        }
        result.push(sum);
      }
    }

    return result;
  };

  /**
   * Apply ColorMatrixFilter directly to a photo without modal (for batch processing)
   * Creates a filtered image using the same logic as getFilterComponent but saves it directly
   *
   * @param {string} photoUri - URI of the photo to process
   * @param {string} filterId - ID of the filter to apply
   * @returns {Promise<Object>} - Result with processed photo URI and save status
   */
  /**
   * Render ColorMatrixFilter component and capture it as an image
   * This creates the exact same visual result as the modal system
   */
  const renderFilterComponentToImage = async (photoUri, filterId) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(`🎨 Rendering ColorMatrixFilter component for ${filterId}`);

        // Create a ViewShot ref
        const viewShotRef = React.useRef();

        // Create the filter component
        const FilterComponent = getFilterComponent(
          filterId,
          photoUri,
          temperatureValue,
          tempActive,
          timestamp,
        );

        // Render the component in a ViewShot
        const RenderContainer = () => (
          <ViewShot
            ref={viewShotRef}
            options={{
              fileName: `filtered_${filterId}_${Date.now()}`,
              format: 'jpg',
              quality: 0.9,
            }}
            style={{
              width: 400,
              height: 400,
              backgroundColor: 'white',
            }}>
            {FilterComponent}
          </ViewShot>
        );

        // This approach has limitations in React Native
        // We need to use a different strategy for headless rendering
        console.log(
          `⚠️ Component rendering not fully implemented - using Skia fallback`,
        );
        resolve(null);
      } catch (error) {
        console.error(`❌ Component rendering failed:`, error);
        reject(error);
      }
    });
  };

  const applyColorMatrixFilterDirectly = async (photoUri, filterId) => {
    try {
      console.log(
        `🎨 Applying REAL ColorMatrixFilter directly for ${filterId}`,
      );

      // Define filters that have complex visual effects (cadre, frames, overlays)
      const complexVisualFilters = [
        'instc',
        'dslide',
        'dhalf',
        '135ne',
        '135sr',
        'sclassic',
        'hoga',
        's67',
        'kv88',
      ];

      if (complexVisualFilters.includes(filterId)) {
        console.log(`🎨 ${filterId} has complex visual effects`);
        console.log(
          `⚠️ Note: Currently using Skia fallback - visual effects like cadre/frames are not included`,
        );
        console.log(
          `💡 For full visual effects, use the modal system instead of batch processing`,
        );

        // For now, use Skia as fallback for complex filters
        const filteredPhotoUri = await applySkiaFilterToPhoto(
          photoUri,
          filterId,
          temperatureValue,
        );

        const saved = await savePhotoToGallery(filteredPhotoUri);

        return {
          uri: filteredPhotoUri,
          saved,
          filtersApplied: true,
          filterInfo: `Applied ${filterId} filter via Skia (visual effects not included - use modal for full effects)`,
        };
      } else {
        // For simple color matrix filters, use Skia directly
        const filteredPhotoUri = await applySkiaFilterToPhoto(
          photoUri,
          filterId,
          temperatureValue,
        );

        const saved = await savePhotoToGallery(filteredPhotoUri);

        return {
          uri: filteredPhotoUri,
          saved,
          filtersApplied: true,
          filterInfo: `Applied ${filterId} filter via Skia`,
        };
      }
    } catch (error) {
      console.error(
        `❌ applyColorMatrixFilterDirectly failed for ${filterId}:`,
        error,
      );
      // Fallback: save original photo
      try {
        const saved = await savePhotoToGallery(photoUri);
        return {uri: photoUri, saved, filtersApplied: false};
      } catch (saveError) {
        console.error('❌ Even savePhotoToGallery failed:', saveError);
        return {uri: photoUri, saved: false, filtersApplied: false};
      }
    }
  };

  const applyFiltersToPhoto = async photoUri => {
    try {
      if (activeFilters.length === 0) {
        console.log(
          '🎯 applyFiltersToPhoto: No filters active - saving original photo with correct naming',
        );
        // No filters to apply, but we need to save with correct naming for AppGallery
        const tempPath = `${
          RNFS.TemporaryDirectoryPath
        }/skia_filtered_original_${Date.now()}.jpg`;
        await RNFS.copyFile(photoUri, tempPath);
        const saved = await savePhotoToGallery(tempPath);
        console.log(
          '🎯 applyFiltersToPhoto: Save result for original photo:',
          saved,
        );
        return {uri: tempPath, saved, filtersApplied: false};
      }

      const filterId = activeFilters[0];
      console.log('🎯 Processing filter:', filterId);

      // Handle original filter - no processing needed but save with correct naming
      if (filterId === 'original') {
        console.log(
          '🎯 Original filter - saving original photo with correct naming',
        );
        const tempPath = `${
          RNFS.TemporaryDirectoryPath
        }/skia_filtered_original_${Date.now()}.jpg`;
        await RNFS.copyFile(photoUri, tempPath);
        const saved = await savePhotoToGallery(tempPath);
        return {uri: tempPath, saved, filtersApplied: false};
      }

      // Handle filters that use react-native-color-matrix-image-filters
      const colorMatrixFilters = [
        'grf',
        'sepia',
        'invert',
        'contrast',
        'saturate',
        'classicu',
        'cpm35',
        'grdr',
        'nt16',
        'dclassic',
        'ccdr',
        'puli',
        'fqsr',
        'collage',
        'fxn',
        'fxnr',
        'dqs',
        'ct2f',
        'd3d',
        'instc',
        'golf',
        'infrared',
        'vintage',
        'monochrome',
        '135ne',
        '135sr',
        // 'dhalf' - handled separately for dual photo capture
        'dslide',
        'sclassic',
        'hoga',
        's67',
        'kv88',
        'instsqc',
        'pafr',
      ];

      if (colorMatrixFilters.includes(filterId)) {
        console.log(
          `🎯 Processing ${filterId} filter - modal will handle the filtering`,
        );

        // For color matrix filters, we don't process here since the modal will capture and save the filtered image
        // Just return the original photo URI - the modal will handle the rest
        return {uri: photoUri, saved: false, filtersApplied: false};
      } else {
        // Apply Skia filter to the photo for all other filters
        const filteredPhotoUri = await applySkiaFilterToPhoto(
          photoUri,
          filterId,
          temperatureValue,
        );

        // Save the filtered photo to gallery
        const saved = await savePhotoToGallery(filteredPhotoUri);

        if (saved) {
          console.log('✅ Filtered photo saved to gallery:', filteredPhotoUri);
        } else {
          console.log('❌ Failed to save filtered photo to gallery');
        }

        return {
          uri: filteredPhotoUri,
          saved,
          filtersApplied: true,
          filterInfo: `Applied ${filterId} filter via Skia and saved to gallery`,
        };
      }
    } catch (error) {
      console.error('❌ applyFiltersToPhoto failed:', error);
      // Fallback: save original photo
      try {
        const saved = await savePhotoToGallery(photoUri);
        return {uri: photoUri, saved, filtersApplied: false};
      } catch (saveError) {
        console.error('❌ Even savePhotoToGallery failed:', saveError);
        return {uri: photoUri, saved: false, filtersApplied: false};
      }
    }
  };

  /**
   * MODIFIED: takePicture function
   * Captures photos using the camera with proper timing and validation
   * Applies active filters to captured photos using Skia processing
   * Saves photos to gallery and updates media preview
   * Handles front/back camera timing differences
   *
   * @returns {Promise<void>} - Captures and processes photo
   */
  const takePicture = async () => {
    console.log('Take picture called');

    if (
      !device ||
      !hasPermission ||
      !cameraRef.current ||
      !isCameraReady ||
      isProcessing
    ) {
      Alert.alert('Camera not ready');
      return;
    }

    // Check if we're in combination mode
    if (isCombinationMode) {
      await handleCombinationPhoto();
      return;
    }

    // Check if dhalf filter is active and handle dual photo capture
    if (activeFilters.includes('dhalf')) {
      // Initialize instruction text for first photo
      if (dhalfPhotoCount === 0) {
        setDhalfInstructionText('Please take or import a photo (1/2)');
      }
      await handleDhalfDualPhoto();
      return;
    }

    if (activeFilters.includes('135ne')) {
      // Initialize instruction text for first photo
      if (ne135PhotoCount === 0) {
        setNe135InstructionText('Please take or import a photo (1/3)');
      }
      await handleNe135TriplePhoto();
      return;
    }

    try {
      setIsProcessing(true);
      setIsPhotoEnabled(true);

      await new Promise(resolve => setTimeout(resolve, 20));

      if (cameraPosition === 'front') {
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });

      // INSERT_YOUR_CODE
      // Check if we should show the modal for color matrix filters
      const colorMatrixFilters = [
        'grf',
        'sepia',
        'invert',
        'contrast',
        'saturate',
        'classicu',
        'cpm35',
        'grdr',
        'nt16',
        'dclassic',
        'ccdr',
        'puli',
        'fqsr',
        'collage',
        'fxn',
        'fxnr',
        'dqs',
        'ct2f',
        'd3d',
        'instc',
        'golf',
        'infrared',
        'vintage',
        'monochrome',
        '135ne',
        '135sr',
        // 'dhalf' - handled separately for dual photo capture
        'dslide',
        'sclassic',
        'hoga',
        's67',
        'kv88',
        'instsqc',
        'pafr',
      ];
      const shouldShowModal = activeFilters.some(filter =>
        colorMatrixFilters.includes(filter),
      );

      if (shouldShowModal) {
        setSelectedImage(
          photo.path.startsWith('file://')
            ? photo.path
            : `file://${photo.path}`,
        );
        setModalActive(true);

        // Don't return early - continue with the normal photo processing
        // The modal will show the filtered image, and we'll save it to gallery
      }

      console.log('🎯 Photo captured successfully:', photo.path);
      console.log('🎯 Camera position during capture:', cameraPosition);
      console.log('🎯 Photo object:', JSON.stringify(photo, null, 2));
      console.log('🎯 Photo path type:', typeof photo.path);
      console.log(
        '🎯 Photo path starts with file://:',
        photo.path.startsWith('file://'),
      );

      // Apply filters to captured photo and save to gallery
      console.log(
        '🎯 takePicture: About to apply filters to photo path:',
        photo.path,
      );
      console.log('🎯 takePicture: Active filters:', activeFilters);
      console.log(
        '🎯 takePicture: Active filters length:',
        activeFilters.length,
      );
      console.log('🎯 takePicture: Should show modal:', shouldShowModal);

      const result = await applyFiltersToPhoto(photo.path);
      console.log(
        '🎯 Filter application result:',
        JSON.stringify(result, null, 2),
      );

      // Show success message
      if (result.saved) {
        fetchLatestMedia();

        if (activeFilters.length > 0) {
          const filterNames = activeFilters
            .map(id => openglFilterEffects[id]?.name || id)
            .join(', ');

          // Don't show error message for "original" filter since it's expected to not apply any filter
          if (activeFilters[0] === 'original') {
            //Alert.alert('Photo Saved!', `✅ Original photo saved to gallery!`);
          } else {
            const message = result.filtersApplied
              ? `✅ Applied ${activeFilters.length} filter(s): ${filterNames}\n\nPhoto saved to gallery!`
              : `❌ Failed to apply ${activeFilters.length} filter(s): ${filterNames}\n\nPhoto saved without filters.`;

            Alert.alert('Photo Saved!', message);
          }
        } else {
          Alert.alert('Photo Saved!', 'Photo captured and saved to gallery!');
        }
      } else {
        //Alert.alert(
        //  'Photo Captured!',
        //  'Photo captured but failed to save to gallery.',
        //);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', `Failed to take photo: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setIsPhotoEnabled(false);
    }
  };

  /**
   * Opens the app gallery screen
   * Navigates to AppGallery component to display captured photos
   *
   * @returns {void} - Navigates to gallery screen
   */
  const openGallery = () => {
    navigation.navigate('AppGallery');
  };

  /**
   * Function to process multiple media items with filters
   * Applies the currently active filter to all selected photos
   * Saves processed photos to gallery with progress feedback
   *
   * @param {Array} mediaItems - Array of selected media items
   * @returns {Promise<Object>} - Processing results summary
   */
  const processMultipleMediaWithFilters = async mediaItems => {
    const results = {
      total: mediaItems.length,
      processed: 0,
      saved: 0,
      failed: 0,
      errors: [],
    };

    console.log(
      `🎯 Starting batch processing of ${mediaItems.length} media items`,
    );

    // Get the current active filter
    const filterId = activeFilters.length > 0 ? activeFilters[0] : 'original';
    console.log(`🎯 Using filter for batch processing: ${filterId}`);

    // Define ColorMatrixFilter-based filters that need direct processing
    const colorMatrixFilters = [
      'grf',
      'sepia',
      'invert',
      'contrast',
      'saturate',
      'classicu',
      'cpm35',
      'grdr',
      'nt16',
      'dclassic',
      'ccdr',
      'puli',
      'fqsr',
      'collage',
      'fxn',
      'fxnr',
      'dqs',
      'ct2f',
      'd3d',
      'instc',
      'golf',
      'infrared',
      'vintage',
      'monochrome',
      '135ne',
      '135sr',
      'dslide',
      'sclassic',
      'hoga',
      's67',
      'kv88',
      'instsqc',
      'pafr',
    ];

    for (let i = 0; i < mediaItems.length; i++) {
      const mediaItem = mediaItems[i];
      console.log(
        `🎯 Processing item ${i + 1}/${mediaItems.length}: ${
          mediaItem.fileName
        }`,
      );

      try {
        // Only process photos (not videos for now)
        if (
          mediaItem.type === 'image/jpeg' ||
          mediaItem.type === 'image/jpg' ||
          mediaItem.type === 'image/png'
        ) {
          let result;

          // Use direct ColorMatrixFilter processing for batch operations
          if (colorMatrixFilters.includes(filterId)) {
            console.log(
              `🎯 Using direct ColorMatrixFilter processing for ${filterId}`,
            );
            result = await applyColorMatrixFilterDirectly(
              mediaItem.uri,
              filterId,
            );
          } else {
            // Use regular filter processing for other filters
            result = await applyFiltersToPhoto(mediaItem.uri);
          }

          results.processed++;

          if (result.saved) {
            results.saved++;
            console.log(
              `✅ Successfully processed and saved: ${mediaItem.fileName}`,
            );
          } else {
            results.failed++;
            results.errors.push(`Failed to save: ${mediaItem.fileName}`);
            console.log(`❌ Failed to save: ${mediaItem.fileName}`);
          }
        } else {
          console.log(
            `⏭️ Skipping non-image file: ${mediaItem.fileName} (${mediaItem.type})`,
          );
          results.errors.push(`Skipped non-image: ${mediaItem.fileName}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Error processing ${mediaItem.fileName}: ${error.message}`,
        );
        console.error(`❌ Error processing ${mediaItem.fileName}:`, error);
      }
    }

    console.log(`🎯 Batch processing complete:`, results);
    return results;
  };

  /**
   * Opens the app gallery screen
   * Navigates to AppGallery component to display captured photos
   * Object of selection of some photos to apply selected filter
   * on them
   * @returns {void} - Navigates to gallery screen
   */
  const selectPhotosFromGalleryToApplyFilters = () => {
    const options = {
      mediaType: 'mixed', // Allow both photos and videos
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 1,
      selectionLimit: 0, // 0 means unlimited selection
      includeExtra: true,
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to open media gallery');
      } else if (response.assets && response.assets.length > 0) {
        const selectedMedia = response.assets;
        console.log('Selected media:', selectedMedia.length, 'items');

        // Show processing alert
        Alert.alert(
          'Processing Media',
          `Processing ${selectedMedia.length} media items with current filter...`,
          [{text: 'OK'}],
        );

        // Process all selected media items
        const results = await processMultipleMediaWithFilters(selectedMedia);

        // Show results
        const successMessage = `Processing complete!\n\n✅ Processed: ${results.processed}\n💾 Saved: ${results.saved}\n❌ Failed: ${results.failed}`;

        if (results.errors.length > 0) {
          Alert.alert(
            'Processing Results',
            `${successMessage}\n\nErrors:\n${results.errors
              .slice(0, 3)
              .join('\n')}${results.errors.length > 3 ? '\n...' : ''}`,
            [{text: 'OK'}],
          );
        } else {
          Alert.alert('Processing Complete', successMessage, [{text: 'OK'}]);
        }
      }
    });
  };

  const takeCombinedImages = () => {
    console.log('🎯 Starting combination mode');

    if (isCombinationMode) {
      // If already in combination mode, cancel it
      setIsCombinationMode(false);
      setCombinedCaptureStep(0);
      setCapturedPhotos([]);
      Alert.alert(
        'Combination Mode Cancelled',
        'Returned to normal photo mode',
      );
      return;
    }

    // Start combination mode
    setIsCombinationMode(true);
    setCombinedCaptureStep(0);
    setCapturedPhotos([]);

    Alert.alert(
      'Combination Mode Started!',
      'Please proceed taking first photo using the main shutter button.',
      [
        {
          text: 'OK',
          onPress: () => console.log('Ready for first photo'),
        },
      ],
    );
  };

  /**
   * Handles photo capture when in combination mode
   */
  const handleCombinationPhoto = async () => {
    try {
      setIsProcessing(true);
      setIsPhotoEnabled(true);

      // Wait for camera to be ready
      await new Promise(resolve => setTimeout(resolve, 200));

      if (cameraPosition === 'front') {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Take the photo
      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });

      console.log('🎯 Photo captured for combination:', photo.path);

      // Apply filters to the captured photo but don't save to gallery yet
      const filteredPhotoUri = await applySkiaFilterToPhoto(
        photo.path,
        activeFilters[0] || 'original',
        temperatureValue,
      );

      if (filteredPhotoUri) {
        // Add to captured photos array (don't save to gallery yet)
        const newPhotos = [
          ...capturedPhotos,
          {
            uri: filteredPhotoUri,
            timestamp: new Date().toISOString(),
            step: combinedCaptureStep + 1,
          },
        ];

        console.log('🎯 Updated photos array:', newPhotos);
        console.log('🎯 Current capture step:', combinedCaptureStep);
        console.log('🎯 Next capture step will be:', combinedCaptureStep + 1);

        setCapturedPhotos(newPhotos);
        setCombinedCaptureStep(combinedCaptureStep + 1);

        if (combinedCaptureStep === 0) {
          // First photo captured
          console.log('🎯 First photo captured, showing alert');
          Alert.alert(
            'First photo captured!',
            'Please proceed taking 2nd photo using the main shutter button.',
            [
              {
                text: 'OK',
                onPress: () => console.log('Ready for second photo'),
              },
            ],
          );
        } else if (combinedCaptureStep === 1) {
          // Second photo captured, now combine them
          console.log('🎯 Second photo captured, starting combination process');
          await combineAndSaveImages(newPhotos);
        }
      } else {
        console.error('❌ Failed to get filtered photo URI');
        Alert.alert('Error', 'Failed to process photo');
      }
    } catch (error) {
      console.error('❌ handleCombinationPhoto failed:', error);
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsProcessing(false);
      setIsPhotoEnabled(false);
    }
  };

  /**
   * Combines two captured images into one and saves the result
   * @param {Array} photos - Array of captured photo objects
   */
  const combineAndSaveImages = async photos => {
    try {
      console.log('🎯 Combining images:', photos);
      console.log('🎯 Photo 1 URI:', photos[0]?.uri);
      console.log('🎯 Photo 2 URI:', photos[1]?.uri);
      console.log('🎯 Photos array length:', photos.length);

      if (photos.length !== 2) {
        console.error('❌ Expected 2 photos, got:', photos.length);
        Alert.alert('Error', 'Need exactly 2 photos to combine');
        return;
      }

      // Check if photo URIs exist and are valid
      if (!photos[0]?.uri || !photos[1]?.uri) {
        console.error('❌ Missing photo URIs:', {
          photo1: photos[0]?.uri,
          photo2: photos[1]?.uri,
        });
        Alert.alert('Error', 'Missing photo URIs');
        return;
      }

      // Create a temporary view to combine the images
      console.log('🎯 About to create combined image...');
      const combinedImageUri = await createCombinedImage(
        photos[0].uri,
        photos[1].uri,
      );
      console.log('🎯 Combined image URI:', combinedImageUri);

      if (combinedImageUri) {
        // Save the combined image to device gallery (like it was working at 12:32 PM)
        console.log('🎯 About to save combined image to device gallery...');
        const saved = await savePhotoToGallery(combinedImageUri);
        console.log('🎯 Save result:', saved);

        if (saved) {
          // Clean up temporary individual photos
          await cleanupTemporaryPhotos(photos);

          // Update the app gallery to show the new combined image
          fetchLatestMedia();

          // Reset the combined capture state and exit combination mode
          setCapturedPhotos([]);
          setCombinedCaptureStep(0);
          setIsCombinationMode(false);

          Alert.alert(
            'Success!',
            'Combined image saved to gallery. Returned to normal photo mode.',
            [
              {
                text: 'OK',
                onPress: () => console.log('Combined image saved successfully'),
              },
            ],
          );
        } else {
          Alert.alert('Error', 'Failed to save combined image');
        }
      } else {
        Alert.alert('Error', 'Failed to combine images');
      }
    } catch (error) {
      console.error('❌ combineAndSaveImages failed:', error);
      Alert.alert('Error', 'Failed to combine images');
    }
  };

  /**
   * Creates a combined image from two photo URIs using react-native-view-shot with 50% opacity overlay
   * @param {string} photo1Uri - First photo URI
   * @param {string} photo2Uri - Second photo URI
   * @returns {Promise<string>} - Combined image URI
   */
  const createCombinedImage = async (photo1Uri, photo2Uri) => {
    try {
      console.log('🎯 Creating combined image from:', photo1Uri, photo2Uri);

      // Create a temporary view for combining images
      const timestamp = new Date().getTime();
      const combinedPath = `${RNFS.TemporaryDirectoryPath}/skia_filtered_combined_${timestamp}.jpg`;

      // Set the temporary view state for rendering with 50% opacity overlay
      setTempCombinationView(
        <View
          style={{
            width: 1080,
            height: 1080,
            position: 'absolute',
            top: 0,
            left: 0,
            backgroundColor: 'transparent',
          }}>
          {/* First image as base */}
          <Image
            source={{uri: photo1Uri}}
            style={{
              width: 1080,
              height: 1080,
              position: 'absolute',
              top: 0,
              left: 0,
            }}
            resizeMode="cover"
          />
          {/* Second image overlaid with 50% opacity */}
          <Image
            source={{uri: photo2Uri}}
            style={{
              width: 1080,
              height: 1080,
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.5,
            }}
            resizeMode="cover"
          />
        </View>,
      );

      // Wait a moment for the view to render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture the view as an image using the tempCombinationViewRef
      const uri = await captureRef(tempCombinationViewRef, {
        format: 'jpg',
        quality: 0.8,
        result: 'tmpfile',
      });

      if (uri) {
        // Copy to our desired location with proper naming
        await RNFS.copyFile(uri, combinedPath);
        console.log(
          '🎯 Combined image created with view-shot overlay:',
          combinedPath,
        );

        // Clear the temporary view
        setTempCombinationView(null);

        return combinedPath;
      } else {
        throw new Error('Failed to capture view');
      }
    } catch (error) {
      console.error('❌ createCombinedImage failed:', error);
      console.error('❌ Error details:', error.message);
      console.error('❌ Error stack:', error.stack);

      // Clear the temporary view on error
      setTempCombinationView(null);

      // Fallback: just copy the first image with proper naming for AppGallery
      try {
        const timestamp = new Date().getTime();
        const fallbackPath = `${RNFS.TemporaryDirectoryPath}/skia_filtered_combined_${timestamp}.jpg`;
        await RNFS.copyFile(photo1Uri, fallbackPath);
        console.log('🎯 Fallback combined image created:', fallbackPath);
        return fallbackPath;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return null;
      }
    }
  };

  /**
   * Cleans up temporary individual photos after combining them
   * @param {Array} photos - Array of photo objects to clean up
   */
  const cleanupTemporaryPhotos = async photos => {
    try {
      console.log('🧹 Cleaning up temporary photos:', photos);

      for (const photo of photos) {
        try {
          // Check if the file exists before trying to delete it
          const exists = await RNFS.exists(photo.uri);
          if (exists) {
            await RNFS.unlink(photo.uri);
            console.log('🗑️ Deleted temporary photo:', photo.uri);
          }
        } catch (error) {
          console.error(
            '❌ Failed to delete temporary photo:',
            photo.uri,
            error,
          );
        }
      }
    } catch (error) {
      console.error('❌ cleanupTemporaryPhotos failed:', error);
    }
  };

  /**
   * Opens the filter control screen
   * Navigates to FilterControl component for filter selection
   *
   * @returns {void} - Navigates to filter control screen
   */
  const openFilterControl = () => {
    navigation.navigate('FilterControl');
  };
  /**
   * Flip camera using the official react-native-vision-camera approach
   * Switches between front and back cameras with proper state management
   * Prevents rapid camera switching and ensures proper initialization
   *
   * @returns {void} - Updates camera position state
   */
  // PanResponder for modal vertical sliding
  const modalPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      // Only respond to vertical movements
      return (
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 10
      );
    },
    onPanResponderGrant: () => {
      // Don't set offset, just reset to 0
      modalPanGesture.setValue(0);
    },
    onPanResponderMove: (evt, gestureState) => {
      // Only allow downward movement when modal is open
      if (bottomControlModal && gestureState.dy > 0) {
        modalPanGesture.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        // Swipe down to close
        toggleModal();
      } else if (gestureState.dy < 5 && gestureState.dx < 5) {
        // Tap to close (small movement = tap)
        toggleModal();
      } else {
        // Snap back to original position
        Animated.spring(modalPanGesture, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  // Function to toggle modal with slide animation
  const toggleModal = () => {
    if (bottomControlModal) {
      // Close modal - slide down
      Animated.timing(modalSlideAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setBottomControlModal(false);
        modalPanGesture.setValue(0);
      });
    } else {
      // Open modal - slide up
      setBottomControlModal(true);
      Animated.timing(modalSlideAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  /**
   * Flips the camera between front and back positions
   * Prevents rapid camera switching and ensures proper initialization
   *
   * @returns {void} - Updates camera position state
   */
  const flipCamera = () => {
    // Prevent rapid camera switching
    if (!isCameraReady) {
      return; // Don't allow switching if camera is not ready
    }
    setIsFlipping(true);
    // console.log('Flipping camera from:', cameraPosition);
    // Determine animation direction based on current camera position
    const isBackToFront = cameraPosition === 'back';
    const startValue = isBackToFront ? 0 : 1;
    const endValue = isBackToFront ? 1 : 0;

    // Reset rotation to start value first, then start flip animation sequence
    rotation.setValue(startValue);

    // Start flip animation based on camera position
    Animated.timing(rotation, {
      toValue: endValue, // flip in the correct direction
      duration: 700, // animation duration
      useNativeDriver: true,
    }).start(({finished}) => {
      // Switch camera position at the midpoint
      setCameraPosition(prevPosition => {
        const newPosition = prevPosition === 'back' ? 'front' : 'back';
        // console.log('Flipping camera to:', newPosition);
        return newPosition;
      });
      // allow the system to settle then end flipping state
      setTimeout(() => setIsFlipping(false), 400);
    });
    setIsRotated(!isRotated);
  };

  /**
   * Toggles flash mode between off, on, and auto
   * Cycles through available flash modes in sequence
   *
   * @returns {void} - Updates flashMode state
   */
  const toggleFlash = () => {
    const flashModes = ['off', 'on', 'auto'];
    const currentIndex = flashModes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    setFlashMode(flashModes[nextIndex]);
  };

  /**
   * Toggles grid overlay visibility
   * Shows/hides the camera grid for composition assistance
   *
   * @returns {void} - Updates showGrid state
   */
  const toggleGrid = () => {
    setShowGrid(!showGrid);
  };

  /**
   * Toggles level overlay visibility
   * Shows/hides the camera level indicator for horizon alignment
   *
   * @returns {void} - Updates level state
   */
  const toggleLevel = () => {
    setLevel(!level);
  };

  /**
   * Location Toggler to be correctly implemented later
   * Toggles location mode for photo metadata
   * Currently logs the state change for debugging
   *
   * @returns {void} - Updates locationMode state
   */
  const toggleLocation = () => {
    setLocationMode(!locationMode);
    console.log('Location mode:', locationMode);
    /* todo integrate location workflow with the app */
    /* ********************************************* */
    /* todo integrate location workflow with the app */
  };

  /**
   * Toggles zoom mode overlay visibility
   * Shows/hides the zoom level indicator for focal length display
   *
   * @returns {void} - Updates zoomMode state
   */
  const toggleZoomMode = () => {
    setZoomMode(!zoomMode);
  };

  /**
   * Toggles timer mode between off, 3s, and 10s
   * Cycles through available timer modes in sequence
   *
   * @returns {void} - Updates timerMode state
   */
  const toggleTimer = () => {
    const timerModes = ['off', '3s', '10s'];
    const currentIndex = timerModes.indexOf(timerMode);
    const nextIndex = (currentIndex + 1) % timerModes.length;
    setTimerMode(timerModes[nextIndex]);
  };

  /**
   * Starts the camera timer countdown
   * Initiates countdown based on selected timer mode (3s or 10s)
   * Automatically takes photo after countdown completes
   * Handles timer state management and error recovery
   *
   * @returns {Promise<void>} - Executes timer countdown and photo capture
   */
  const startTimer = async () => {
    if (timerMode === 'off') {
      // No timer, take photo immediately
      await takePicture();
      return;
    }

    // If timer is already active, don't start another one
    if (isTimerActive) {
      return;
    }

    // Get timer duration in seconds
    const duration = timerMode === '3s' ? 3 : 10;
    setIsTimerActive(true);
    setTimerCountdown(duration);

    try {
      // Start countdown
      for (let i = duration; i > 0; i--) {
        setTimerCountdown(i);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Take photo after countdown
      setTimerCountdown(0);
      setIsTimerActive(false);
      await takePicture();
    } catch (error) {
      // If there's an error, reset timer state
      setTimerCountdown(0);
      setIsTimerActive(false);
      console.error('Timer error:', error);
    }
  };

  /**
   * Cancels the active camera timer
   * Resets timer countdown and deactivates timer state
   * Stops countdown before photo capture
   *
   * @returns {void} - Resets timer state
   */
  const cancelTimer = () => {
    setTimerCountdown(0);
    setIsTimerActive(false);
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

      {/* Dhalf dual photo instruction text */}
      {dhalfInstructionText && activeFilters.includes('dhalf') && (
        <View style={styles.dhalfInstructionContainer}>
          <Text style={styles.dhalfInstructionText}>
            {dhalfInstructionText}
          </Text>
        </View>
      )}

      {/* 135ne triple photo instruction text */}
      {ne135InstructionText && activeFilters.includes('135ne') && (
        <View style={styles.dhalfInstructionContainer}>
          <Text style={styles.dhalfInstructionText}>
            {ne135InstructionText}
          </Text>
        </View>
      )}

      {/* \ // */}
      {/* INSERT_YOUR_CODE */}
      {/* Image Modal */}

      {modalActive && selectedImage && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,1)',
            zIndex: 2000,
            paddingTop: 150,
            paddingBottom: 150,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 131,
              right: 20,
              zIndex: 2100,
              //backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              padding: 8,
            }}
            onPress={handleCloseWithSave}>
            {/* <Text style={{color: '#fff', fontSize: 18}}>Close</Text> */}
            <Image
              source={require('../src/assets/icons/close.png')}
              style={{
                width: 16,
                height: 16,
                tintColor: 'rgba(255, 255, 255, 0.46)',
              }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 50,
              alignSelf: 'center',
              zIndex: 2100,
              width: '80%',
            }}
            onPress={openSubscription}>
            <LinearGradient
              colors={['#007AFF', '#FF3B30']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 15,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-start',
                minWidth: 200,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                }}>
                <Image
                  source={require('../src/assets/icons/logo-main.png')}
                  style={{
                    width: 30,
                    height: 30,
                    borderTopRightRadius: 15,
                    borderBottomRightRadius: 15,
                    marginRight: 8,
                    resizeMode: 'contain',
                  }}
                />
                <View
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    paddingLeft: 10,
                  }}>
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 16,
                      fontWeight: 'bold',
                    }}>
                    Dazz Pro
                  </Text>
                  <Text
                    style={{
                      color: '#fff',
                      fontSize: 10,
                      opacity: 0.9,
                    }}>
                    Join Dazz Pro to save this work.
                  </Text>
                </View>
                <Image
                  source={require('../src/assets/icons/back-arrow.png')}
                  style={{
                    width: 13,
                    height: 13,
                    marginLeft: 70,
                    tintColor: 'rgb(88, 88, 88)',
                  }}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <View
            ref={modalFilterRef}
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: 'transparent',
              position: 'absolute',
              top: 150,
              left: 0,
              bottom: 150,
            }}>
            {activeFilters[0] === '135ne' ? (
              // Special handling for 135ne - show triple photos vertically stacked with horizontal separators
              (() => {
                console.log('🎯 Modal rendering 135ne filter');
                console.log('🎯 ne135CapturedPhotos:', ne135CapturedPhotos);
                console.log(
                  '🎯 ne135CapturedPhotos length:',
                  ne135CapturedPhotos.length,
                );
                console.log('🎯 Photo 1 URI:', ne135CapturedPhotos[0]?.uri);
                console.log('🎯 Photo 2 URI:', ne135CapturedPhotos[1]?.uri);
                console.log('🎯 Photo 3 URI:', ne135CapturedPhotos[2]?.uri);

                return (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {/* First photo with 135ne filter - 60% width, 30% height */}
                    <View
                      style={{
                        width: '60%',
                        height: '30%',
                        alignSelf: 'center',
                      }}>
                      {ne135CapturedPhotos[0]?.uri ? (
                        getFilterComponent(
                          '135ne',
                          ne135CapturedPhotos[0].uri,
                          temperatureValue,
                          tempActive,
                          timestamp,
                        )
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#333',
                          }}
                        />
                      )}
                    </View>
                    {/* First horizontal separator - 60% width, 2% height */}
                    <View
                      style={{
                        width: '60%',
                        height: '2%',
                        backgroundColor: '#000000',
                        alignSelf: 'center',
                      }}
                    />
                    {/* Second photo with 135ne filter - 60% width, 57% height */}
                    <View
                      style={{
                        width: '60%',
                        height: '57%',
                        alignSelf: 'center',
                      }}>
                      {ne135CapturedPhotos[1]?.uri ? (
                        getFilterComponent(
                          '135ne',
                          ne135CapturedPhotos[1].uri,
                          temperatureValue,
                          tempActive,
                          timestamp,
                        )
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#333',
                          }}
                        />
                      )}
                    </View>
                    {/* Second horizontal separator - 60% width, 2% height */}
                    <View
                      style={{
                        width: '60%',
                        height: '2%',
                        backgroundColor: '#000000',
                        alignSelf: 'center',
                      }}
                    />
                    {/* Third photo with 135ne filter - 60% width, 25% height */}
                    <View
                      style={{
                        width: '60%',
                        height: '25%',
                        alignSelf: 'center',
                      }}>
                      {ne135CapturedPhotos[2]?.uri ? (
                        getFilterComponent(
                          '135ne',
                          ne135CapturedPhotos[2].uri,
                          temperatureValue,
                          tempActive,
                          timestamp,
                        )
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#333',
                          }}
                        />
                      )}
                    </View>
                  </View>
                );
              })()
            ) : activeFilters[0] === 'dhalf' ? (
              // Special handling for dhalf - show dual photos side by side with half height each
              (() => {
                console.log('🎯 Modal rendering dhalf filter');
                console.log('🎯 dhalfCapturedPhotos:', dhalfCapturedPhotos);
                console.log(
                  '🎯 dhalfCapturedPhotos length:',
                  dhalfCapturedPhotos.length,
                );
                console.log('🎯 Photo 1 URI:', dhalfCapturedPhotos[0]?.uri);
                console.log('🎯 Photo 2 URI:', dhalfCapturedPhotos[1]?.uri);

                return (
                  <View
                    style={{
                      width: '100%',
                      height: '100%',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    {/* First photo with dhalf filter - 48.5% width, 50% height */}
                    <View
                      style={{
                        width: '48.5%',
                        height: '50%',
                        alignSelf: 'center',
                      }}>
                      {dhalfCapturedPhotos[0]?.uri ? (
                        getFilterComponent(
                          'dhalf',
                          dhalfCapturedPhotos[0].uri,
                          temperatureValue,
                          tempActive,
                          timestamp,
                        )
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#333',
                          }}
                        />
                      )}
                    </View>
                    {/* Black separator - 2% width, 50% height */}
                    <View
                      style={{
                        width: '2%',
                        height: '50%',
                        backgroundColor: '#000000',
                        alignSelf: 'center',
                      }}
                    />
                    {/* Second photo with dhalf filter - 48.5% width, 50% height */}
                    <View
                      style={{
                        width: '48.5%',
                        height: '50%',
                        alignSelf: 'center',
                      }}>
                      {dhalfCapturedPhotos[1]?.uri ? (
                        getFilterComponent(
                          'dhalf',
                          dhalfCapturedPhotos[1].uri,
                          temperatureValue,
                          tempActive,
                          timestamp,
                        )
                      ) : (
                        <View
                          style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#333',
                          }}
                        />
                      )}
                    </View>
                  </View>
                );
              })()
            ) : (
              <View
                style={{
                  width: '100%',
                  height: '100%',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {getFilterComponent(
                  activeFilters[0] || 'default',
                  selectedImage,
                  temperatureValue,
                  tempActive,
                  timestamp,
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Temporary view for image combination */}
      {tempCombinationView && (
        <View
          ref={tempCombinationViewRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 1080,
            height: 1080,
            zIndex: 1000,
          }}>
          {tempCombinationView}
        </View>
      )}
      {/* Camera View with Frame */}
      <Animated.View
        ref={cameraContainerRef}
        style={[
          styles.cameraFrame,
          {
            // transform: [{scaleX: flipInterpolate}],
            transform: [
              {rotateY: flipInterpolate},
              {scaleX: cameraPosition === 'front' ? -1 : 1}, // Horizontal flip for front camera
            ],
            backgroundColor: 'black', // Ensure transparent background
          },
        ]}>
        {/* 
        {!isAppInBackground && <View style={styles.cameraFrameInside} />} */}
        {device && !isAppInBackground ? (
          <>
            <Camera
              key={`${device.id}-${cameraPosition}`}
              ref={cameraRef}
              style={styles.camera}
              device={device}
              isActive={
                isCameraReady && !!device && !isAppInBackground && !isFlipping
              }
              exposure={cameraExposure}
              // photo={isPhotoEnabled}
              photo={true}
              zoom={calculateZoomFromFocalLength(focalLength)}
              //video={true}
              //audio={true}
              onInitialized={() => {
                // console.log('Camera initialized successfully');
                // Don't set ready immediately, let the useEffect handle it
              }}
              onError={error => {
                console.error(
                  'Camera error for',
                  cameraPosition,
                  'camera:',
                  error,
                );
                setIsCameraReady(false);

                // Special handling for front camera errors
                if (cameraPosition === 'front') {
                  console.log(
                    '🎯 Front camera error detected, attempting recovery...',
                  );
                  // Try to reinitialize the front camera with faster recovery
                  setTimeout(() => {
                    console.log('🎯 Reinitializing front camera...');
                    setIsCameraReady(false);
                    // Force a complete camera reset
                    setTimeout(() => {
                      console.log('🎯 Front camera reset complete');
                      setIsCameraReady(true);
                    }, 300);
                  }, 500);
                }

                // If it's an AVFoundation error, try switching to a different device
                if (
                  error.code === -11800 ||
                  error.domain === 'AVFoundationErrorDomain'
                ) {
                  console.log(
                    'AVFoundation error detected for',
                    cameraPosition,
                    'camera',
                  );

                  // Special handling for AVFoundation errors on front camera
                  if (cameraPosition === 'front') {
                    console.log(
                      '🎯 AVFoundation error on front camera, forcing reset...',
                    );
                    // Force a more aggressive reset for AVFoundation errors
                    setIsCameraReady(false);
                    // Force a complete camera reset with longer delay
                    setTimeout(() => {
                      console.log('🎯 Front camera AVFoundation reset...');
                      setIsCameraReady(true);
                    }, 1000);
                  }
                }

                // Log the error but don't prevent future attempts
                console.log(
                  'Camera error occurred for',
                  cameraPosition,
                  'camera, but allowing retry',
                );
              }}
            />
            {/* Absolute tap overlay for focus gesture */}
            <View style={StyleSheet.absoluteFill} pointerEvents="auto">
              <GestureDetector gesture={gesture}>
                <View style={{flex: 1}} />
              </GestureDetector>
            </View>
            {/* Focus reticle + exposure slider overlay */}
            {focusUIVisible && (
              <View
                style={{
                  position: 'absolute',
                  left:
                    Math.max(
                      20,
                      Math.min(
                        focusPoint.x,
                        Dimensions.get('window').width - 20,
                      ),
                    ) - 30,
                  top:
                    Math.max(
                      20,
                      Math.min(
                        focusPoint.y,
                        Dimensions.get('window').height - 20,
                      ),
                    ) - 30,
                }}
                pointerEvents="box-none">
                <Animated.View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    borderWidth: 1,
                    borderColor: focusUIColor,
                    transform: [{scale: focusScale}],
                    opacity: focusOpacity,
                  }}
                />
                <GestureDetector gesture={exposureGesture}>
                  <View
                    style={{
                      position: 'absolute',
                      left: exposureSliderSide === 'right' ? 60 : -36, // 70px right, or 106px left (36+70)
                      top: -40,
                      width: 36,
                      height: sliderBarHeight,
                      alignItems: 'center',
                    }}
                    pointerEvents="auto">
                    {showExposureLine && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          width: 1,
                          backgroundColor: focusUIColor,
                        }}
                      />
                    )}
                    <Animated.View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        //backgroundColor: '#FFD94A',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: [{translateY: exposurePan}],
                      }}>
                      {/* <Text style={{fontSize: 16}}>☀️</Text> */}
                      <Image
                        source={require('../src/assets/icons/sun-reticle.png')}
                        style={{
                          width: 18,
                          height: 18,
                          tintColor: focusUIColor,
                        }}
                      />
                    </Animated.View>
                  </View>
                </GestureDetector>
              </View>
            )}
          </>
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
      </Animated.View>
      {/* Zoom Level Indicator - Moved to left side */}
      {/*   {device && !isAppInBackground && (
        <View style={[styles.zoomIndicator, {left: 40, right: 'auto'}]}>
          <Text style={styles.zoomText}>
            {calculateZoomFromFocalLength(focalLength)}x
          </Text>
        </View>
      )} */}
      {/* Temperature Overlay - Changes camera tint based on Kelvin value */}
      {device && !isAppInBackground && (
        <View
          style={[
            styles.temperatureOverlay,
            {
              backgroundColor: getTemperatureColor(temperatureValue),
            },
          ]}
        />
      )}
      {/* OpenGL Filter Overlay for All Filters */}
      {activeFilters.length > 0 && !isAppInBackground && (
        <>
          <OpenGLFilterOverlay
            activeFilters={activeFilters}
            cameraPosition={cameraPosition}
          />
          {/*           {__DEV__ && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                backgroundColor: 'rgba(0,255,0,0.8)',
                padding: 5,
                borderRadius: 5,
                zIndex: 10000,
              }}>
              <Text style={{color: 'white', fontSize: 10}}>
                OpenGL: {activeFilters[0]}
              </Text>
            </View>
          )} */}
        </>
      )}
      {/* Debug Info - Commented for future use */}
      {/*
        {__DEV__ && (
          <View
            style={{
              position: 'absolute',
              top: 50,
              left: 10,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: 5,
              borderRadius: 5,
            }}>
            <Text style={{color: 'white', fontSize: 10}}>
              OpenGL: {openGLWorking ? '✅' : '❌'} | Filters:{' '}
              {activeFilters.length} | Active: {activeFilters[0] || 'none'}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: 'rgba(255,0,0,0.8)',
                padding: 5,
                marginTop: 5,
                borderRadius: 3,
              }}
              onPress={() => {
                console.log('🧪 Test: Setting GR F filter manually');
                setActiveFilters(['grf']);
                global.activeFilters = ['grf'];
              }}>
              <Text style={{color: 'white', fontSize: 8}}>TEST GR F</Text>
            </TouchableOpacity>
          </View>
        )}
        */}
      {/* Grid Overlay - Inside Camera Frame */}
      {showGrid && !isAppInBackground && (
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
      {!isAppInBackground && (
        <View style={styles.topSection}>
          {/* 3 dots More Options Button */}
          <TouchableOpacity
            style={styles.moreOptionsButton}
            onPress={() => setModalActive(!modalActive)}>
            <View style={styles.moreOptionsDots}>
              <View style={styles.dot} />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </TouchableOpacity>
        </View>
      )}
      {/* More Options Modal */}
      {modalActive && !isAppInBackground && (
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalContent} onPress={toggleGrid}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>
              Assistive grid
            </Text>
            {showGrid && !isAppInBackground ? (
              <Image
                style={{width: 20, height: 20, marginLeft: 220, marginTop: -17}}
                source={require('../src/assets/icons/grid-on.png')}
              />
            ) : (
              <Image
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: 220,
                  marginTop: -17,
                }}
                source={require('../src/assets/icons/grid-off.png')}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalContent} onPress={toggleLevel}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Level</Text>
            {level && !isAppInBackground ? (
              <Image
                style={{width: 20, height: 20, marginLeft: 220, marginTop: -17}}
                source={require('../src/assets/icons/level-on.png')}
              />
            ) : (
              <Image
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: 220,
                  marginTop: -17,
                }}
                source={require('../src/assets/icons/level-off.png')}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalContent}
            onPress={toggleLocation}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Save Location</Text>
            {locationMode && !isAppInBackground ? (
              <Image
                style={{width: 20, height: 20, marginLeft: 220, marginTop: -17}}
                source={require('../src/assets/icons/location-on.png')}
              />
            ) : (
              <Image
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: 220,
                  marginTop: -17,
                }}
                source={require('../src/assets/icons/location-off.png')}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalContent}
            onPress={toggleZoomMode}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Zoom Mode</Text>
            {zoomMode && !isAppInBackground ? (
              <Image
                style={{width: 20, height: 20, marginLeft: 220, marginTop: -17}}
                source={require('../src/assets/icons/zoom-on.png')}
              />
            ) : (
              <Image
                style={{
                  width: 20,
                  height: 20,
                  marginLeft: 220,
                  marginTop: -17,
                }}
                source={require('../src/assets/icons/zoom-off.png')}
              />
            )}
            {zoomMode && !isAppInBackground ? (
              <Text
                style={{
                  width: 120,
                  height: 120,
                  color: 'gray',
                  marginLeft: 18,
                  marginTop: -5,
                  marginBottom: 10,
                }}>
                Full Screen Mode
              </Text>
            ) : (
              <Text
                style={{
                  width: 120,
                  height: 120,
                  color: 'gray',
                  marginLeft: 18,
                  marginTop: -5,
                  marginBottom: 10,
                }}>
                Frame Mode
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalContent, {borderBottomColor: 'transparent'}]}
            onPress={() => navigation.navigate('Settings')}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Settings</Text>
            <Image
              source={require('../src/assets/icons/settings.png')}
              style={{width: 20, height: 20, marginLeft: 220, marginTop: -17}}
            />
          </TouchableOpacity>
        </View>
      )}
      {/* Focal Length Indicator */}
      {/* <View style={styles.focalLengthContainer}>
        <Text style={styles.focalLengthText}>35mm</Text>
      </View> */}
      {/* Middle Control Bar */}
      {!isAppInBackground && (
        <View style={styles.middleControlBar}>
          {!tempActive && (
            <TouchableOpacity
              style={[
                styles.controlItem,
                {
                  backgroundColor: 'rgb(255, 255, 255)',
                  width: 35,
                  height: 35,
                  alignContent: 'center',
                  justifyContent: 'center',
                  borderRadius: 50,
                  ...(exposureControlActive && {marginBottom: 1}),
                },
              ]}
              onPress={() => handleControlToggle('temp')}>
              {/* <Text style={styles.tempIcon}>🌡️</Text> */}
              <Image
                source={require('../src/assets/icons/temp.png')}
                style={styles.tempIcon}
              />
              {/*  <Text style={styles.controlValue}>35</Text> */}
            </TouchableOpacity>
          )}
          {tempActive && (
            <TouchableOpacity
              style={{
                //marginRight: 20,
                marginLeft: 12,
                width: 35,
                height: 35,
                borderRadius: 50,
                justifyContent: 'center',
                alignContent: 'center',
              }}
              onPress={() => {
                // Close tempActive and show controls
                setTempActive(!tempActive);
                setHideControls(!hideControls);
              }}>
              <Image
                source={require('../src/assets/icons/arrow-down.png')}
                style={{width: 14, height: 14, tintColor: '#fff'}}
              />
            </TouchableOpacity>
          )}
          {!viewControlActive && (
            <TouchableOpacity
              style={[
                styles.controlItem,
                {
                  justifyContent: 'center',
                  alignContent: 'center',
                  ...(exposureControlActive && {marginBottom: 1}),
                },
              ]}
              onPress={() => handleControlToggle('view')}>
              {/* <Text style={styles.brightnessIcon}>☀️</Text> */}
              <Text style={styles.controlValue}>{focalLength}</Text>
            </TouchableOpacity>
          )}
          {viewControlActive && (
            <TouchableOpacity
              style={{
                marginLeft: 15,
                marginRight: -3,
                //marginRight: 15,
                justifyContent: 'center',
                alignContent: 'center',
                width: 35,
              }}
              onPress={() => {
                // Close viewControlActive and show controls
                setViewControlActive(!viewControlActive);
                setHideControls(!hideControls);
                if (exposureControlActive) {
                  setExposureControlActive(!exposureControlActive);
                  setHideControls(!hideControls);
                }
                if (tempActive) {
                  setTempActive(!tempActive);
                  setHideControls(!hideControls);
                }
              }}>
              <Image
                source={require('../src/assets/icons/arrow-down.png')}
                style={{width: 14, height: 14, tintColor: '#fff'}}
              />
            </TouchableOpacity>
          )}
          {exposureControlActive && (
            <TouchableOpacity
              style={styles.exposureControlItemClose}
              onPress={() => handleControlToggle('exposure')}>
              <Image
                source={require('../src/assets/icons/arrow-down.png')}
                style={{width: 14, height: 14, tintColor: '#fff'}}
              />
            </TouchableOpacity>
          )}
          {!exposureControlActive && (
            <TouchableOpacity
              style={styles.exposureControlItem}
              onPress={() => handleControlToggle('exposure')}>
              {/* <Text style={styles.controlValue}>Exposure</Text> */}
              <Image
                source={require('../src/assets/icons/sun-reticle.png')}
                style={{width: 15, height: 15, tintColor: '#fff'}}
              />
              <Text style={styles.controlValue2}>
                {Math.round(exposureValue)}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
          {!hideControls &&
            !tempActive &&
            !viewControlActive &&
            !exposureControlActive && (
              <View style={styles.topControls}>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={selectPhotosFromGalleryToApplyFilters}>
                  <View style={styles.galleryButtonIcon}>
                    {/* <View style={styles.cameraOutline} /> */}
                    <Image
                      source={require('../src/assets/icons/gallery-plus.png')}
                      style={styles.galleryPlus}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.controlButton,
                    isCombinationMode && styles.controlButtonActive,
                  ]}
                  onPress={takeCombinedImages}>
                  <View style={styles.gridIcon}>
                    <View
                      style={[
                        styles.gridSquare1,
                        isCombinationMode && styles.gridSquareActive,
                      ]}
                    />
                    <View
                      style={[
                        styles.gridSquare2,
                        isCombinationMode && styles.gridSquareActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleTimer}>
                  <Image
                    source={require('../src/assets/icons/clock.png')}
                    style={[
                      styles.clock,
                      timerMode !== 'off' && styles.clockActive,
                    ]}
                  />
                  {timerMode !== 'off' && (
                    <Text style={styles.timerModeText}>{timerMode}</Text>
                  )}
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
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={flipCamera}>
                  <Image
                    style={styles.cameraSwitchArrow}
                    source={require('../src/assets/icons/flip-camera.png')}
                  />
                </TouchableOpacity>
              </View>
            )}
          {/* Combination Mode Overlay */}
          {isCombinationMode && (
            <View style={styles.combinationModeOverlay}>
              <Text style={styles.combinationModeText}>
                Please take or import 2 photos {combinationModeStatus}
              </Text>
            </View>
          )}
          {/* Temperature Control */}
          {tempActive && (
            <View style={styles.viewControlActive}>
              <View
                style={{
                  borderWidth: 1,
                  borderColor: '#fff',
                  width: 144,
                  height: 54,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: -59,
                  marginRight: 18,
                  position: 'relative',
                }}>
                {/* Temperature Control Container */}
                <View
                  style={{
                    width: 120,
                    height: 40,
                    position: 'relative',
                    justifyContent: 'center',
                  }}>
                  {/* Temperature Display */}
                  <Text
                    style={{
                      position: 'absolute',
                      top: -25,
                      left: '50%',
                      marginLeft: -20,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                    {Math.round(3000 + (temperatureValue / 100) * 4000)}K
                  </Text>

                  {/* Gradient Background Bar */}
                  <View
                    style={{
                      width: '119%',
                      height: 53,
                      marginLeft: -11,
                      marginTop: -2,
                      borderRadius: 8,
                      backgroundColor: 'transparent',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                    {/* Gradient Colors */}
                    <View
                      style={{
                        width: '100%',
                        height: '160%',
                        borderRadius: 8,
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        overflow: 'hidden',
                      }}>
                      {/* Gradient Background */}
                      <View
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundColor: 'transparent',
                          position: 'relative',
                        }}>
                        {/* Smooth Gradient with Overlapping Colors */}
                        <View
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            width: '30%',
                            height: '100%',
                            backgroundColor: '#4A90E2', // Cool blue
                          }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            left: '20%',
                            top: 0,
                            width: '30%',
                            height: '100%',
                            backgroundColor: '#7B68EE', // Purple
                            opacity: 0.8,
                          }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            left: '40%',
                            top: 0,
                            width: '30%',
                            height: '100%',
                            backgroundColor: '#FF6B6B', // Warm red
                            opacity: 0.8,
                          }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            left: '60%',
                            top: 0,
                            width: '30%',
                            height: '100%',
                            backgroundColor: '#FF8C42', // Warm orange
                            opacity: 0.8,
                          }}
                        />
                        <View
                          style={{
                            position: 'absolute',
                            left: '80%',
                            top: 0,
                            width: '20%',
                            height: '100%',
                            backgroundColor: '#FF6B35', // Warm red-orange
                          }}
                        />
                      </View>
                      {/* Top Markers */}
                      <View
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: 0,
                          right: 0,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingHorizontal: 2,
                        }}>
                        {[0, 25, 50, 75, 100].map((marker, index) => (
                          <View
                            key={index}
                            style={{
                              width: 1,
                              height: 3,
                              backgroundColor: '#fff',
                              opacity: 0.6,
                            }}
                          />
                        ))}
                      </View>
                      {/* Bottom Markers */}
                      <View
                        style={{
                          position: 'absolute',
                          bottom: -12,
                          left: 0,
                          right: 0,
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingHorizontal: 2,
                        }}>
                        {[0, 25, 50, 75, 100].map((marker, index) => (
                          <View
                            key={index}
                            style={{
                              width: 1,
                              height: 3,
                              backgroundColor: '#fff',
                              opacity: 0.6,
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Draggable Temperature Dot */}
                  <View
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: `${temperatureValue}%`,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: '#000',
                      borderWidth: 1.5,
                      borderColor: '#fff',
                      marginLeft: -10,
                    }}
                    {...panResponder.panHandlers}
                  />
                </View>
              </View>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#fff',
                  width: 34,
                  height: 34,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                  backgroundColor: '#fff',
                }}
                onPress={() => {
                  // Set temperature to 3597K (A - Auto)
                  // 3597K = 3000 + (14.925/100) * 4000
                  // So temperatureValue should be 14.925
                  setTemperatureValue(14.925);
                }}>
                <Text
                  style={{
                    color: 'rgb(0, 0, 0)',
                    fontSize: 17,
                    fontWeight: '600',
                  }}>
                  A
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#fff',
                  width: 34,
                  height: 34,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
                onPress={() => {
                  // Set temperature to 5500K (Sun - Daylight)
                  // 5500K = 3000 + (62.5/100) * 4000
                  // So temperatureValue should be 62.5
                  setTemperatureValue(62.5);
                }}>
                <Image
                  source={require('../src/assets/icons/sun.png')}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: '#fff',
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: '#fff',
                  width: 34,
                  height: 34,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 14,
                }}
                onPress={() => {
                  // Set temperature to 3200K (Lamp - Tungsten)
                  // 3200K = 3000 + (5/100) * 4000
                  // So temperatureValue should be 5
                  setTemperatureValue(5);
                }}>
                <Image
                  source={require('../src/assets/icons/lamp.png')}
                  style={{
                    width: 20,
                    height: 20,
                    tintColor: '#fff',
                  }}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Focal Length Control */}
          {viewControlActive && (
            <View style={styles.viewControlActive}>
              <TouchableOpacity
                style={[
                  focalLength == focalLengthArray[0]
                    ? {
                        backgroundColor: '#fff',
                        color: 'rgb(0,0,0)',
                        borderWidth: 1,
                        borderColor: '#fff',
                        width: 34,
                        height: 34,
                        borderRadius: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      }
                    : {
                        borderWidth: 1,
                        borderColor: '#fff',
                        width: 34,
                        height: 34,
                        borderRadius: 50,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 14,
                      },
                ]}
                onPress={() => {
                  setFocalLength(focalLengthArray[0]);
                  setHideControls(!hideControls);
                  setViewControlActive(!viewControlActive);
                }}>
                <Text
                  style={
                    focalLength == focalLengthArray[0]
                      ? {color: 'rgb(0,0,0)', fontSize: 14, fontWeight: 600}
                      : {color: '#fff', fontSize: 14, fontWeight: '600'}
                  }>
                  13
                </Text>
                <Text
                  style={[
                    {
                      position: 'absolute',
                      bottom: -8,
                      right: '40%',
                      fontSize: 10,
                      fontWeight: '600',
                    },
                    focalLength == focalLengthArray[0]
                      ? {
                          color: 'rgb(0,0,0)',
                          textShadowColor: '#fff',
                          textShadowOffset: {width: 0, height: 0},
                          textShadowRadius: 1,
                        }
                      : {color: '#fff'},
                  ]}>
                  .5x
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  focalLength == focalLengthArray[1] && {
                    backgroundColor: '#fff',
                    color: 'rgb(0,0,0)',
                  },
                  {
                    borderWidth: 1,
                    borderColor: '#fff',
                    width: 34,
                    height: 34,
                    borderRadius: 50,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  },
                ]}
                onPress={() => {
                  setFocalLength(focalLengthArray[1]);
                  setHideControls(!hideControls);
                  setViewControlActive(!viewControlActive);
                }}>
                <Text
                  style={
                    focalLength == focalLengthArray[1]
                      ? {color: 'rgb(0,0,0)', fontSize: 14, fontWeight: 600}
                      : {color: '#fff', fontSize: 14, fontWeight: '600'}
                  }>
                  26
                </Text>
                <Text
                  style={[
                    {
                      position: 'absolute',
                      bottom: -8,
                      left: '50%',
                      marginLeft: -3.5,
                      fontSize: 10,
                      fontWeight: '600',
                    },
                    focalLength == focalLengthArray[1]
                      ? {
                          color: 'rgb(0,0,0)',
                          textShadowColor: '#fff',
                          textShadowOffset: {width: 0, height: 0},
                          textShadowRadius: 1,
                        }
                      : {color: '#fff'},
                  ]}>
                  1x
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  focalLength == focalLengthArray[2] && {
                    backgroundColor: '#fff',
                    color: 'rgb(0,0,0)',
                  },
                  {
                    borderWidth: 1,
                    borderColor: '#fff',
                    width: 34,
                    height: 34,
                    borderRadius: 50,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 14,
                  },
                ]}
                onPress={() => {
                  setFocalLength(focalLengthArray[2]);
                  setHideControls(!hideControls);
                  setViewControlActive(!viewControlActive);
                }}>
                <Text
                  style={
                    focalLength == focalLengthArray[2]
                      ? {color: 'rgb(0,0,0)', fontSize: 14, fontWeight: 600}
                      : {color: '#fff', fontSize: 14, fontWeight: '600'}
                  }>
                  35
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  focalLength == focalLengthArray[3] && {
                    backgroundColor: '#fff',
                    color: 'rgb(0,0,0)',
                  },
                  {
                    borderWidth: 1,
                    borderColor: '#fff',
                    width: 34,
                    height: 34,
                    borderRadius: 50,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                ]}
                onPress={() => {
                  setFocalLength(focalLengthArray[3]);
                  setHideControls(!hideControls);
                  setViewControlActive(!viewControlActive);
                }}>
                <Text
                  style={
                    focalLength == focalLengthArray[3]
                      ? {color: 'rgb(0,0,0)', fontSize: 14, fontWeight: 600}
                      : {color: '#fff', fontSize: 14, fontWeight: '600'}
                  }>
                  50
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Exposure Control */}
          {exposureControlActive && (
            <View style={styles.exposureControl}>
              {/* the Rewind Exposure Button */}
              <TouchableOpacity
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 50,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
                onPress={() => {
                  setExposureValue(0);
                  setCameraExposure(0);
                  syncSlidersWithExposureValue(0); // Synchronize both sliders to center
                }}>
                <Image
                  source={require('../src/assets/icons/rewind.png')}
                  style={{
                    width: 30,
                    height: 30,
                    marginBottom: 1,
                    tintColor: '#fff',
                  }}
                />
              </TouchableOpacity>
              {/* the Auto Exposure Button */}
              <TouchableOpacity
                style={{
                  width: 35,
                  height: 35,
                  borderRadius: 50,
                  backgroundColor: autoExposure ? '#000' : '#fff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginLeft: 10,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                }}
                onPress={() => setAutoExposure(!autoExposure)}>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'extrabold',
                    marginBottom: 1,
                    color: autoExposure ? '#fff' : '#000',
                  }}>
                  A
                </Text>
              </TouchableOpacity>
              {/* the Exposure Selection Line */}
              <View style={styles.exposureControlSelection}>
                {/* Exposure value text indicator */}
                <View
                  style={[
                    styles.exposureValueIndicator,
                    {left: horizontalSliderPosition - 16.5}, // Center text above slider button
                  ]}>
                  <Text style={styles.exposureValueText}>
                    {exposureValue.toFixed(1)}
                  </Text>
                </View>

                {/* Draggable slider button */}
                <GestureDetector gesture={horizontalSliderGesture}>
                  <View
                    style={[
                      styles.sliderButton,
                      {left: horizontalSliderPosition - 10}, // Center button on slider
                    ]}
                  />
                </GestureDetector>
              </View>
            </View>
          )}
          {/* Shutter Button */}
          <TouchableOpacity
            style={[
              styles.shutterButton,
              isProcessing && styles.shutterButtonProcessing,
              viewControlActive && {marginLeft: 22},
              exposureControlActive && {marginLeft: 65},
            ]}
            onPress={isTimerActive ? cancelTimer : startTimer}
            disabled={!isCameraReady || isProcessing}>
            <View style={styles.shutterInner} />
            {isProcessing && (
              <View style={styles.processingIndicator}>
                <Text style={styles.processingText}>...</Text>
              </View>
            )}
            {isTimerActive && timerCountdown > 0 && (
              <View style={styles.timerCountdown}>
                <Text style={styles.timerCountdownText}>{timerCountdown}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Right Side - Selected Camera Icon */}
        <TouchableOpacity
          style={[
            styles.selectedCameraContainer,
            viewControlActive && {marginLeft: 22},
            tempActive && {paddingLeft: 2},
            exposureControlActive && {marginLeft: 65},
          ]}
          onPress={openFilterControl}>
          {getSelectedCameraIcon(global, activeFilters) ? (
            <Image
              source={getSelectedCameraIcon(global, activeFilters)}
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
        </TouchableOpacity>

        {/* Selected Indicator Bottom Ratio Modal Control Button */}
        <TouchableOpacity
          onPress={toggleModal}
          style={{
            marginBottom: -45,
            marginLeft: -60,
            width: 40,
            borderRadius: 30,
            height: 18,
            zIndex: 2,
            borderWidth: 1.5,
            borderColor: 'gray',
          }}>
          <View style={styles.selectedIndicator} />
        </TouchableOpacity>

        {/* Bottom Control Ratio Modal */}
        {bottomControlModal && (
          <Animated.View
            style={[
              styles.bottomControlModal,
              {
                transform: [{translateY: modalTransform}],
              },
            ]}>
            <View {...modalPanResponder.panHandlers}>
              <View
                style={{
                  backgroundColor: 'rgb(183, 183, 183)',
                  width: 60,
                  height: 6,
                  borderRadius: 22,
                  marginTop: 10,
                  marginLeft: 165,
                }}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.bottomControlModalText, {marginTop: 15}]}>
                Ratio
              </Text>
              <View style={styles.bottomControlModalRatio}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: -5,
                    paddingTop: 10,
                  }}>
                  <TouchableOpacity
                    onPress={() => setAspectRatio(aspectRatioArray[0])}
                    style={{
                      width: 80,
                      height: 55,
                      marginRight: 15,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{color: '#000', fontSize: 13, fontWeight: '600'}}>
                      3:2
                    </Text>
                  </TouchableOpacity>
                  {aspectRatio == aspectRatioArray[1] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 0,
                        bottom: 17,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setAspectRatio(aspectRatioArray[1])}
                    style={{
                      width: 80,
                      height: 55,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text>4:3</Text>
                  </TouchableOpacity>
                  {aspectRatio == aspectRatioArray[0] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 95,
                        bottom: 17,
                      }}
                    />
                  )}
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 10,
                  }}>
                  <TouchableOpacity
                    onPress={() => setAspectRatioType('Original')}>
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={[
                        {
                          width: 15,
                          height: 15,
                          marginRight: 10,
                          backgroundColor: '#000',
                          tintColor: '#fff',
                          borderRadius: 50,
                        },
                        aspectRatioType == 'Selected'
                          ? {
                              backgroundColor: '#fff',
                              borderColor: '#000',
                              borderWidth: 1,
                            }
                          : {},
                      ]}
                    />
                  </TouchableOpacity>
                  <Text style={styles.bottomControlModalRatioText}>
                    Imported assets using selected aspect ratio.
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 24,
                  }}>
                  <TouchableOpacity
                    onPress={() => setAspectRatioType('Selected')}>
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={[
                        {
                          width: 15,
                          height: 15,
                          marginRight: 10,
                          backgroundColor: '#000',
                          tintColor: '#fff',
                          borderRadius: 50,
                        },
                        aspectRatioType == 'Original'
                          ? {
                              backgroundColor: '#fff',
                              borderColor: '#000',
                              borderWidth: 1,
                            }
                          : {},
                      ]}
                    />
                  </TouchableOpacity>
                  <Text style={styles.bottomControlModalRatioText}>
                    Imported assets using original aspect ratio.
                  </Text>
                </View>
              </View>
              <View
                style={{
                  marginTop: 8,
                  width: '100%',
                  height: 0.7,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              <Text style={[styles.bottomControlModalText, {marginTop: 20}]}>
                Color Profile
              </Text>
              <View style={styles.bottomControlModalRatio}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: -5,
                    paddingTop: 10,
                  }}>
                  <TouchableOpacity
                    onPress={() => setColorProfile(colorProfileArray[0])}
                    style={{
                      width: 80,
                      height: 55,
                      marginRight: 15,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 0,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Image
                      source={require('../src/assets/colorprofiles/20250903_151814.jpg')}
                      style={{width: '100%', borderRadius: 10, height: '100%'}}
                    />
                  </TouchableOpacity>
                  {colorProfile == colorProfileArray[0] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 207,
                        bottom: 17,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setColorProfile(colorProfileArray[1])}
                    style={{
                      width: 80,
                      height: 55,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 0,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 20,
                    }}>
                    <Image
                      source={require('../src/assets/colorprofiles/20250903_151816.jpg')}
                      style={{width: '100%', borderRadius: 10, height: '100%'}}
                    />
                  </TouchableOpacity>
                  {colorProfile == colorProfileArray[1] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 110,
                        bottom: 17,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setColorProfile(colorProfileArray[2])}
                    style={{
                      width: 80,
                      height: 55,
                      marginRight: 15,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 0,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Image
                      source={require('../src/assets/colorprofiles/20250903_151902.jpg')}
                      style={{width: '100%', borderRadius: 10, height: '100%'}}
                    />
                  </TouchableOpacity>
                  {colorProfile == colorProfileArray[2] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 10,
                        bottom: 17,
                      }}
                    />
                  )}
                </View>
              </View>
              <View
                style={{
                  marginTop: 8,
                  width: '100%',
                  height: 0.7,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                }}
              />
              <View style={styles.bottomControlModalRatio}></View>
              <Text style={[styles.bottomControlModalText, {marginTop: 10}]}>
                TimeStamp
              </Text>
              <View style={styles.bottomControlModalRatio}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingLeft: -5,
                    paddingTop: 10,
                  }}>
                  <TouchableOpacity
                    onPress={() => setTimestamp(timestampArray[0])}
                    style={{
                      width: 80,
                      height: 55,
                      marginRight: 15,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Image
                      source={require('../src/assets/icons/blocked.png')}
                      style={{width: 15, height: 15, tintColor: 'black'}}
                    />
                  </TouchableOpacity>
                  {timestamp == timestampArray[0] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 292,
                        bottom: 17,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setTimestamp(timestampArray[1])}
                    style={{
                      width: 80,
                      height: 55,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgb(0, 0, 0)',
                      marginRight: 15,
                    }}>
                    <Text
                      style={{
                        color: 'rgb(227, 52, 52)',
                        fontFamily: 'Courier',
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                      2 25 '22
                    </Text>
                  </TouchableOpacity>
                  {timestamp == timestampArray[1] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 195,
                        bottom: 17,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setTimestamp(timestampArray[2])}
                    style={{
                      width: 80,
                      height: 55,
                      marginRight: 10,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: '#000',
                      backgroundColor: 'rgb(0, 0, 0)',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        color: 'rgb(241, 55, 55)',
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                      2 25 '22
                    </Text>
                  </TouchableOpacity>
                  {timestamp == timestampArray[2] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 100,
                        bottom: 17,
                      }}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => setTimestamp(timestampArray[3])}
                    style={{
                      width: 80,
                      height: 55,
                      marginRight: 15,
                      marginBottom: 20,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      backgroundColor: 'rgb(0, 0, 0)',
                      borderColor: '#000',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}>
                    <Text
                      style={{
                        color: 'rgb(250, 57, 57)',
                        fontFamily: 'Menlo',
                        fontSize: 13,
                        fontWeight: '600',
                      }}>
                      2 25 '22
                    </Text>
                  </TouchableOpacity>
                  {timestamp == timestampArray[3] && (
                    <Image
                      source={require('../src/assets/icons/checkmark.png')}
                      style={{
                        width: 15,
                        height: 15,
                        backgroundColor: '#000',
                        tintColor: '#fff',
                        borderRadius: 50,
                        position: 'absolute',
                        right: 10,
                        bottom: 17,
                      }}
                    />
                  )}
                </View>

                <View style={{height: 100, flexDirection: 'column'}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 10,
                    }}>
                    <TouchableOpacity
                      onPress={() => setTimestampDate('Generated')}
                      disabled={timestamp == timestampArray[0]}>
                      <Image
                        source={require('../src/assets/icons/checkmark.png')}
                        style={[
                          {
                            width: 15,
                            height: 15,
                            marginRight: 10,
                            backgroundColor:
                              timestamp == timestampArray[0] ? '#666' : '#000',
                            tintColor:
                              timestamp == timestampArray[0] ? '#999' : '#fff',
                            borderRadius: 50,
                            opacity: timestamp == timestampArray[0] ? 0.5 : 1,
                          },
                          timestampDate == 'Current-Date'
                            ? {
                                backgroundColor: '#fff',
                                borderColor: '#000',
                                borderWidth: 1,
                              }
                            : {},
                        ]}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.bottomControlModalRatioText,
                        timestamp == timestampArray[0] && {
                          color: '#666',
                          opacity: 0.5,
                        },
                      ]}>
                      Display the date the material was generated.
                    </Text>
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 24,
                    }}>
                    <TouchableOpacity
                      onPress={() => setTimestampDate('Current-Date')}
                      disabled={timestamp == timestampArray[0]}>
                      <Image
                        source={require('../src/assets/icons/checkmark.png')}
                        style={[
                          {
                            width: 15,
                            height: 15,
                            marginRight: 10,
                            backgroundColor:
                              timestamp == timestampArray[0] ? '#666' : '#000',
                            tintColor:
                              timestamp == timestampArray[0] ? '#999' : '#fff',
                            borderRadius: 50,
                            opacity: timestamp == timestampArray[0] ? 0.5 : 1,
                          },
                          timestampDate == 'Generated'
                            ? {
                                backgroundColor: '#fff',
                                borderColor: '#000',
                                borderWidth: 1,
                              }
                            : {},
                        ]}
                      />
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.bottomControlModalRatioText,
                        timestamp == timestampArray[0] && {
                          color: '#666',
                          opacity: 0.5,
                        },
                      ]}>
                      Display the current date.
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  dhalfInstructionContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  exposureControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 200,
    marginTop: 30,
    marginBottom: 30,
    marginLeft: -80,
    marginRight: 15,
  },
  exposureControlSelection: {
    width: 245,
    height: 25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: 'rgb(63, 63, 63)',
    marginLeft: 20,
    position: 'relative',
  },
  exposureValueIndicator: {
    position: 'absolute',
    top: -25,
    width: 30,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exposureValueText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  sliderButton: {
    position: 'absolute',
    top: 0,
    width: 17,
    height: 24,
    borderRadius: 7,
    backgroundColor: 'black',
    borderWidth: 1.3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dhalfInstructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  galleryPlus: {
    tintColor: '#fff',
    width: 30,
    height: 30,
  },
  cameraFrame: {
    flex: 1,
    marginHorizontal: 15,
    marginVertical: 230,
    marginTop: 160,
    borderRadius: 8,
    overflow: 'hidden',
    //borderWidth: 2,
    //borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  zoomIndicator: {
    position: 'absolute',
    top: 200,
    right: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 1000,
  },
  zoomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  temperatureOverlay: {
    position: 'absolute',
    top: 160,
    left: 15,
    right: 15,
    bottom: 230,
    pointerEvents: 'none',
    zIndex: 500,
    mixBlendMode: 'overlay',
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
  modalContainer: {
    paddingTop: 0,
    position: 'absolute',
    top: 210,
    right: 40,
    backgroundColor: 'rgba(230, 230, 230, 0.97)',
    zIndex: 10,
    width: 260,
    height: 260,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  modalContent: {
    height: 50,
    width: '100%',
    borderBottomWidth: 0.7,
    borderBottomColor: 'rgba(0, 0, 0, 0.3)',
  },
  openGLFilterOverlay: {
    position: 'absolute',
    top: 160,
    left: 15,
    right: 15,
    bottom: 230,
    pointerEvents: 'none',
    zIndex: 1,
  },
  filterOverlay: {
    position: 'absolute',
    top: 160,
    left: 15,
    right: 15,
    bottom: 230,
    pointerEvents: 'none',
    zIndex: 1,
  },
  gridOverlay: {
    position: 'absolute',
    top: 160,
    left: 15,
    right: 15,
    bottom: 230,
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
  viewControlActive: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 30,
    marginLeft: 10,
  },
  topSection: {
    position: 'absolute',
    top: 170,
    right: 30,
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
  exposureControlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 57,
    height: 35,
    borderRadius: 50,
    justifyContent: 'flex-start',
    marginLeft: 5,
    paddingLeft: 11,
    paddingVertical: 0,
  },
  exposureControlItemClose: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    //backgroundColor: 'rgb(0, 0, 0)',
    width: 57,
    height: 37,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
    paddingVertical: 0,
    marginBottom: -1,
  },
  controlItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    width: 35,
    height: 35,
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
    width: 19,
    height: 19,
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
  controlValue2: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
    marginBottom: 20,
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
    zIndex: 9999,
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
    color: 'rgb(255, 85, 0)',
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
    tintColor: 'rgb(255, 55, 0)',
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
  controlButtonActive: {
    //backgroundColor: 'rgba(255, 100, 0, 0.3)', // Orange tint
    borderRadius: 25,
  },
  gridSquareActive: {
    borderColor: 'rgb(255, 55, 0)', // Orange border
    backgroundColor: 'rgba(255, 34, 0, 0.16)', // Orange background
  },
  clock: {
    width: 26,
    height: 26,
    tintColor: '#fff',
  },
  clockActive: {
    tintColor: '#FF3B30',
  },
  timerModeText: {
    position: 'absolute',
    bottom: -8,
    fontSize: 10,
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  shutterButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
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
  timerCountdown: {
    position: 'absolute',
    top: -50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
  },
  timerCountdownText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  shutterInner: {
    width: 70,
    height: 70,
    borderRadius: 50,
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
    marginBottom: 29,
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
    bottom: 6.5,
    left: '49%',
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
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  skiaFallback: {
    flex: 1,
    backgroundColor: '#000',
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
  bottomControlModal: {
    zIndex: 10,
    position: 'absolute',
    bottom: -70,
    height: 532.5,
    borderTopRightRadius: 23,
    borderTopLeftRadius: 23,
    backgroundColor: 'rgba(250, 250, 250, 1)',
    left: 0,
    right: 0,
  },
  bottomControlModalText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 20,
    marginTop: 32,
    color: '#000',
  },
  bottomControlModalRatio: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingLeft: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  combinationModeOverlay: {
    position: 'absolute',
    top: -130,
    left: 15,
    width: 195,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  combinationModeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default CameraComponent;
