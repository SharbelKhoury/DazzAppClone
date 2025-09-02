import React, {useState, useRef, useEffect} from 'react';
import 'react-native-reanimated';
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
} from 'react-native';

import {
  Camera,
  useCameraDevice,
  useCameraDevices,
  useCameraPermission,
} from 'react-native-vision-camera';
import {launchImageLibrary} from 'react-native-image-picker';
import {ColorMatrixImageFilter} from 'react-native-color-matrix-image-filters';
import {
  openglFilterEffects,
  getOpenGLFilterOverlay,
  createOpenGLFilteredImage,
} from '../utils/openglFilterEffects';
import {CameraRoll} from '@react-native-camera-roll/camera-roll';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
} from '@shopify/react-native-skia';
import {Skia} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {getFilterMatrix} from '../utils/filterMatrixUtils';
import {getSelectedCameraIcon} from '../utils/cameraIconUtils';
// ImageManipulator removed - using OpenGL effects only

// ImageCropPicker removed - using OpenGL effects only

// ImageFilterKit removed - using OpenGL effects only

// OpenGL Filter Overlay Component for Live Preview
const OpenGLFilterOverlay = ({activeFilters, cameraPosition}) => {
  if (activeFilters.length === 0) {
    return null;
  }

  const filterId = activeFilters[0];
  const overlayStyle = getOpenGLFilterOverlay(filterId);

  return <View style={overlayStyle} pointerEvents="none" />;
};

// Skia Filter Preview Component
const SkiaFilterPreview = ({imageUri, filterId}) => {
  const skiaImage = useImage(imageUri);
  const [filterMatrix, setFilterMatrix] = useState(null);

  useEffect(() => {
    // Get the color matrix for the selected filter
    const getFilterMatrix = () => {
      const filterConfig = openglFilterEffects[filterId];
      if (!filterConfig || !filterConfig.filters) return null;

      let brightness = 0;
      let contrast = 1;
      let saturation = 1;
      let hue = 0;
      let gamma = 1;

      // Extract values from filter config
      filterConfig.filters.forEach(filter => {
        if (filter.name === 'Brightness') brightness = filter.value;
        if (filter.name === 'Contrast') contrast = filter.value;
        if (filter.name === 'Saturation') saturation = filter.value;
        if (filter.name === 'Hue') hue = filter.value;
        if (filter.name === 'Gamma') gamma = filter.value;
      });

      // Special handling for specific filters
      if (filterId === 'grf') {
        // Grayscale matrix for GR F filter
        return [
          0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
          0.114, 0, 0, 0, 0, 0, 1, 0,
        ];
      }

      // Create custom matrix based on filter effects
      const brightnessOffset = brightness * 255;
      return [
        contrast,
        0,
        0,
        0,
        brightnessOffset,
        0,
        contrast,
        0,
        0,
        brightnessOffset,
        0,
        0,
        contrast,
        0,
        brightnessOffset,
        0,
        0,
        0,
        1,
        0,
      ];
    };

    setFilterMatrix(getFilterMatrix());
  }, [filterId]);

  if (!skiaImage || !filterMatrix) {
    return (
      <View style={styles.skiaFallback}>
        <Image source={{uri: imageUri}} style={StyleSheet.absoluteFill} />
      </View>
    );
  }

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <SkiaImage
        image={skiaImage}
        x={0}
        y={0}
        width={400} // Adjust based on your layout
        height={400}>
        <ColorMatrix matrix={filterMatrix} />
      </SkiaImage>
    </Canvas>
  );
};

const CameraComponent = ({navigation}) => {
  const focalLengthArray = [13, 26, 35, 50];
  const {hasPermission, requestPermission} = useCameraPermission();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  const [focalLength, setFocalLength] = useState(focalLengthArray[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPhotoEnabled, setIsPhotoEnabled] = useState(false);
  const [isAppInBackground, setIsAppInBackground] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [tempActive, setTempActive] = useState(false);
  const [viewControlActive, setViewControlActive] = useState(false);
  const [modalActive, setModalActive] = useState(false);
  const [temperatureValue, setTemperatureValue] = useState(50); // Temperature control value (0-100)

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

  // Calculate zoom value based on focal length
  const calculateZoomFromFocalLength = focalLength => {
    // Map focal lengths to zoom values:
    // 13mm = 1.0x (widest available - camera hardware limit)
    // 26mm = 2.0x (standard zoom)
    // 35mm = 2.3x (medium zoom)
    // 50mm = 3.0x (close zoom)

    switch (focalLength) {
      case 13:
        return 1.0; // Widest available - camera hardware limit
      case 26:
        return 2.0; // Standard zoom
      case 35:
        return 2.3; // Medium zoom
      case 50:
        return 3.0; // Close zoom
      default:
        return 2.0; // Default to standard zoom
    }
  };

  // Calculate temperature color overlay based on Kelvin value (INVERTED POLARITIES)
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
  const [cameraPosition, setCameraPosition] = useState('front');
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

  const devices = useCameraDevices();

  // Test if OpenGL is working - Commented for future use
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

  // Fetch latest media for gallery preview (from app's photos)
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

  // Function to get combined filter effects for ImageFilter
  const getCombinedFilters = () => {
    try {
      const allEffects = [];

      console.log('Active filters state:', activeFilters);
      console.log('Global active filters:', global.activeFilters);

      activeFilters.forEach(filterId => {
        try {
          console.log('Processing filter ID:', filterId);

          // Check if it's OpenGL effects
          const openglConfig = openglFilterEffects[filterId];
          if (openglConfig && openglConfig.filters) {
            console.log('Using OpenGL filter config:', openglConfig);
            openglConfig.filters.forEach(filter => {
              allEffects.push(filter);
            });
          } else {
            console.log('No OpenGL config found for filter ID:', filterId);
          }
        } catch (error) {
          console.log('Error processing filter ID:', filterId, error);
        }
      });

      console.log('Combined filters:', allEffects);
      return allEffects;
    } catch (error) {
      console.log('Error getting combined filters:', error);
      return [];
    }
  };

  // Function to get filter overlay style for live preview
  const getFilterOverlayStyle = () => {
    try {
      if (activeFilters.length === 0) return {};

      const filterId = activeFilters[0]; // Only one filter active at a time
      console.log('Getting overlay for filter ID:', filterId);

      // Check if it's OpenGL effects
      const openglOverlay = getOpenGLFilterOverlay(filterId);
      console.log('OpenGL overlay result:', openglOverlay);

      if (Object.keys(openglOverlay).length > 0) {
        console.log('Using OpenGL overlay for:', filterId);
        return openglOverlay;
      }

      // Fallback to empty object
      console.log('No overlay found for:', filterId);
      return {};
    } catch (error) {
      console.log('Error getting filter overlay style:', error);
      return {};
    }
  };

  // Function to apply OpenGL filter effects to photo using multiple approaches
  const applyOpenGLFilterToPhoto = async (photoUri, filterId) => {
    try {
      console.log('🎨 Applying OpenGL filter to photo:', filterId);

      const filterConfig = openglFilterEffects[filterId];
      if (!filterConfig) {
        console.log('🎨 No OpenGL filter config for:', filterId);
        return photoUri;
      }

      console.log('🎨 OpenGL filter config:', filterConfig);

      // Create color matrix based on filter effects
      const createColorMatrix = () => {
        let brightness = 0;
        let contrast = 1;
        let saturation = 1;
        let hue = 0;
        let gamma = 1;

        // Extract values from filter config
        filterConfig.filters.forEach(filter => {
          if (filter.name === 'Brightness') brightness = filter.value;
          if (filter.name === 'Contrast') contrast = filter.value;
          if (filter.name === 'Saturation') saturation = filter.value;
          if (filter.name === 'Hue') hue = filter.value;
          if (filter.name === 'Gamma') gamma = filter.value;
        });

        // Special handling for GR F (black and white)
        if (filterId === 'grf') {
          return [
            0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
            0.114, 0, 0, 0, 0, 0, 1, 0,
          ];
        }

        // Create advanced color matrix based on effects
        const brightnessOffset = brightness * 255;
        const contrastMatrix = [
          contrast,
          0,
          0,
          0,
          brightnessOffset,
          0,
          contrast,
          0,
          0,
          brightnessOffset,
          0,
          0,
          contrast,
          0,
          brightnessOffset,
          0,
          0,
          0,
          1,
          0,
        ];

        // Apply saturation
        if (saturation !== 1) {
          const r = 0.213;
          const g = 0.715;
          const b = 0.072;
          const satMatrix = [
            (1 - saturation) * r + saturation,
            (1 - saturation) * r,
            (1 - saturation) * r,
            0,
            0,
            (1 - saturation) * g,
            (1 - saturation) * g + saturation,
            (1 - saturation) * g,
            0,
            0,
            (1 - saturation) * b,
            (1 - saturation) * b,
            (1 - saturation) * b + saturation,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ];
          return satMatrix;
        }

        return contrastMatrix;
      };

      const colorMatrix = createColorMatrix();
      console.log('🎨 Color matrix created:', colorMatrix);

      // Use working image processing approach
      try {
        const RNFS = require('react-native-fs');

        console.log('🎨 Processing image with working approach...');

        // Apply filter directly to the whole photo without cropping
        if (filterId === 'grf') {
          try {
            // For GR F filter, create a grayscale effect using ColorMatrixImageFilter
            const outputPath = `${
              RNFS.TemporaryDirectoryPath
            }/grf_filtered_${Date.now()}.jpg`;

            console.log('🎨 Applying GR F black & white filter directly...');

            // Create grayscale color matrix for GR F filter
            const grayscaleMatrix = [
              0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299,
              0.587, 0.114, 0, 0, 0, 0, 0, 1, 0,
            ];

            if (
              ColorMatrixImageFilter &&
              typeof ColorMatrixImageFilter.processImage === 'function'
            ) {
              await ColorMatrixImageFilter.processImage(
                photoUri,
                outputPath,
                grayscaleMatrix,
              );
              console.log(
                '✅ GR F filter applied successfully to:',
                outputPath,
              );
              return outputPath;
            } else {
              console.log(
                '❌ ColorMatrixImageFilter not available for GR F filter',
              );
              return photoUri;
            }
          } catch (grfError) {
            console.error('❌ GR F filter processing failed:', grfError);
            console.log('🎨 Using original photo for GR F filter');
            return photoUri;
          }
        } else {
          // For other filters, try ColorMatrixImageFilter with proper error handling
          try {
            const outputPath = `${
              RNFS.TemporaryDirectoryPath
            }/filtered_${Date.now()}.jpg`;

            console.log('🎨 Processing with ColorMatrixImageFilter...');

            // Check if ColorMatrixImageFilter is properly imported
            if (
              ColorMatrixImageFilter &&
              typeof ColorMatrixImageFilter.processImage === 'function'
            ) {
              await ColorMatrixImageFilter.processImage(
                photoUri,
                outputPath,
                colorMatrix,
              );
              console.log('✅ ColorMatrixImageFilter applied successfully');
              return outputPath;
            } else {
              console.log(
                '❌ ColorMatrixImageFilter not properly imported or processImage not available',
              );
              console.log(
                '🎨 ColorMatrixImageFilter object:',
                ColorMatrixImageFilter,
              );
              return photoUri;
            }
          } catch (matrixError) {
            console.error('❌ ColorMatrixImageFilter failed:', matrixError);
            console.log('🎨 Using original photo with overlay effect');
            return photoUri;
          }
        }
      } catch (error) {
        console.error('❌ Image processing failed:', error);
        return photoUri;
      }
    } catch (error) {
      console.error('❌ Error applying OpenGL filter:', error);
      return photoUri;
    }
  };

  // Function to save photo to gallery
  const savePhotoToGallery = async photoUri => {
    try {
      console.log('Attempting to save photo:', photoUri);
      await CameraRoll.save(photoUri);
      console.log('Photo saved successfully');
      // Refresh gallery preview to show the new photo
      fetchLatestMedia();
      return true;
    } catch (error) {
      console.error('Error saving to gallery:', error);
      return false;
    }
  };

  // Function to render image through OpenGL
  const renderImageWithOpenGL = async (imageUri, colorMatrix) => {
    try {
      console.log('🎨 Rendering image through OpenGL...');

      // OpenGL image processing not implemented for file output
      // Return original image for now
      console.log('🎨 OpenGL image processing not available for file output');
      return imageUri;
    } catch (error) {
      console.error('❌ OpenGL image rendering failed:', error);
      return null;
    }
  };

  // NEW: Function to apply Skia filter to photo using actual Skia Canvas
  const applySkiaFilterToPhoto = async (photoUri, filterId) => {
    try {
      console.log('🎨 Trying alternative Skia approach...');

      // Read the image file
      const imageData = await RNFS.readFile(photoUri, 'base64');
      const imageBuffer = Buffer.from(imageData, 'base64');

      // Create Skia data from buffer
      const data = Skia.Data.fromBytes(new Uint8Array(imageBuffer));
      const skiaImage = Skia.Image.MakeImageFromEncoded(data);

      if (!skiaImage) {
        throw new Error('Failed to create Skia image');
      }

      const width = skiaImage.width();
      const height = skiaImage.height();

      // Create color matrix
      const filterConfig = openglFilterEffects[filterId];
      console.log('🎨 Filter config:', filterConfig);

      // Get the correct color matrix for the specific filter
      const colorMatrix = getFilterMatrix(
        filterId,
        openglFilterEffects,
        createColorMatrixFromFilter,
      );
      console.log('🎨 Color matrix:', colorMatrix);

      // Create temperature color matrix based on current temperature value
      const temperatureMatrix = createTemperatureColorMatrix(temperatureValue);
      console.log('🌡️ Temperature matrix:', temperatureMatrix);

      // Combine filter and temperature matrices
      const combinedMatrix = combineColorMatrices(
        colorMatrix,
        temperatureMatrix,
      );
      console.log('🎨 Combined matrix:', combinedMatrix);

      const colorFilter = Skia.ColorFilter.MakeMatrix(combinedMatrix);

      // Create paint
      const paint = Skia.Paint();
      paint.setColorFilter(colorFilter);

      // Create surface and draw
      const surface = Skia.Surface.Make(width, height);
      const canvas = surface.getCanvas();

      // Draw the image with the filter
      canvas.drawImage(skiaImage, 0, 0, paint);

      // Get image and encode
      const image = surface.makeImageSnapshot();
      const imageDataOut = image.encodeToBytes();

      // Write to file with filter ID in filename
      const outputPath = `${
        RNFS.TemporaryDirectoryPath
      }/skia_filtered_${filterId}_${Date.now()}.jpg`;
      await RNFS.writeFile(
        outputPath,
        Buffer.from(imageDataOut).toString('base64'),
        'base64',
      );

      // Refresh gallery preview to show the new filtered photo
      fetchLatestMedia();
      return outputPath;
    } catch (error) {
      console.error('❌ Alternative Skia approach failed:', error);

      // Fallback to ColorMatrixImageFilter
      try {
        const filterConfig = openglFilterEffects[filterId];
        const colorMatrix = createColorMatrixFromFilter(filterConfig);
        const outputPath = `${
          RNFS.TemporaryDirectoryPath
        }/filtered_${filterId}_${Date.now()}.jpg`;

        await ColorMatrixImageFilter.processImage(
          photoUri,
          outputPath,
          colorMatrix,
        );
        // Refresh gallery preview to show the new filtered photo
        fetchLatestMedia();
        return outputPath;
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        return photoUri;
      }
    }
  };

  // Helper function to create color matrix from filter config
  const createColorMatrixFromFilter = filterConfig => {
    if (!filterConfig || !filterConfig.filters) {
      return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
    }

    let brightness = 0;
    let contrast = 1;
    let saturation = 1;
    let hue = 0;
    let gamma = 1;

    // Extract values from filter config
    filterConfig.filters.forEach(filter => {
      if (filter.name === 'Brightness') brightness = filter.value;
      if (filter.name === 'Contrast') contrast = filter.value;
      if (filter.name === 'Saturation') saturation = filter.value;
      if (filter.name === 'Hue') hue = filter.value;
      if (filter.name === 'Gamma') gamma = filter.value;
    });

    // Special handling for GR F (black and white)
    if (
      filterConfig.name === 'grf' ||
      filterConfig.name?.toLowerCase().includes('grf')
    ) {
      return [
        0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
        0.114, 0, 0, 0, 0, 0, 1, 0,
      ];
    }

    // Create comprehensive color matrix based on filter effects
    const brightnessOffset = brightness * 255;

    // Start with identity matrix
    const matrix = [
      contrast,
      0,
      0,
      0,
      brightnessOffset,
      0,
      contrast,
      0,
      0,
      brightnessOffset,
      0,
      0,
      contrast,
      0,
      brightnessOffset,
      0,
      0,
      0,
      1,
      0,
    ];

    // Apply saturation if needed
    if (saturation !== 1) {
      const r = 0.213;
      const g = 0.715;
      const b = 0.072;

      matrix[0] = (1 - saturation) * r + saturation;
      matrix[1] = (1 - saturation) * r;
      matrix[2] = (1 - saturation) * r;

      matrix[5] = (1 - saturation) * g;
      matrix[6] = (1 - saturation) * g + saturation;
      matrix[7] = (1 - saturation) * g;

      matrix[10] = (1 - saturation) * b;
      matrix[11] = (1 - saturation) * b;
      matrix[12] = (1 - saturation) * b + saturation;
    }

    return matrix;
  };

  // Helper function to create temperature color matrix
  const createTemperatureColorMatrix = tempValue => {
    // Convert temperatureValue (0-100) to Kelvin (3000-7000)
    const kelvin = 3000 + (tempValue / 100) * 4000;

    // Create temperature color matrix based on inverted polarities
    let rMultiplier = 1.0;
    let gMultiplier = 1.0;
    let bMultiplier = 1.0;

    if (kelvin <= 3200) {
      // Very warm (tungsten) - now gives strong BLUE tint (cold)
      rMultiplier = 0.85; // Reduce red
      gMultiplier = 0.9; // Slightly reduce green
      bMultiplier = 1.2; // Increase blue
    } else if (kelvin <= 4000) {
      // Warm (sunrise/sunset) - now gives light BLUE tint (cool)
      rMultiplier = 0.9; // Reduce red
      gMultiplier = 0.95; // Slightly reduce green
      bMultiplier = 1.1; // Increase blue
    } else if (kelvin <= 5000) {
      // Neutral (midday) - now gives slight COOL tint
      rMultiplier = 0.95; // Slightly reduce red
      gMultiplier = 0.98; // Slightly reduce green
      bMultiplier = 1.05; // Slightly increase blue
    } else if (kelvin <= 6000) {
      // Cool (overcast) - now gives slight WARM tint
      rMultiplier = 1.05; // Slightly increase red
      gMultiplier = 1.02; // Slightly increase green
      bMultiplier = 0.95; // Slightly reduce blue
    } else {
      // Very cool (shade) - now gives stronger WARM tint
      rMultiplier = 1.2; // Increase red
      gMultiplier = 1.1; // Increase green
      bMultiplier = 0.85; // Reduce blue
    }

    // Return temperature color matrix (5x4 matrix)
    return [
      rMultiplier,
      0,
      0,
      0,
      0,
      0,
      gMultiplier,
      0,
      0,
      0,
      0,
      0,
      bMultiplier,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  };

  // Helper function to combine two color matrices
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

  // MODIFIED: applyFiltersToPhoto function to use Skia
  const applyFiltersToPhoto = async photoUri => {
    try {
      if (activeFilters.length === 0) {
        // No filters to apply, just save original to gallery
        const saved = await savePhotoToGallery(photoUri);
        return {uri: photoUri, saved, filtersApplied: false};
      }

      const filterId = activeFilters[0];
      console.log('🎯 Processing filter:', filterId);

      // Apply Skia filter to the photo
      const filteredPhotoUri = await applySkiaFilterToPhoto(photoUri, filterId);

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

  // MODIFIED: takePicture function
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

    try {
      setIsProcessing(true);
      setIsPhotoEnabled(true);

      await new Promise(resolve => setTimeout(resolve, 200));

      if (cameraPosition === 'front') {
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });

      console.log('🎯 Photo captured successfully:', photo.path);
      console.log('🎯 Camera position during capture:', cameraPosition);
      console.log('🎯 Photo object:', JSON.stringify(photo, null, 2));
      console.log('🎯 Photo path type:', typeof photo.path);
      console.log(
        '🎯 Photo path starts with file://:',
        photo.path.startsWith('file://'),
      );

      // Apply filters to captured photo and save to gallery
      console.log('🎯 About to apply filters to photo path:', photo.path);
      console.log('🎯 Active filters:', activeFilters);
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
      setIsPhotoEnabled(false);
    }
  };

  const openGallery = () => {
    // Navigate to AppGallery instead of opening device gallery
    navigation.navigate('AppGallery');
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

  const toggleLevel = () => {
    setLevel(!level);
  };

  const toggleLocation = () => {
    setLocationMode(!locationMode);
    console.log('Location mode:', locationMode);
    /* todo integrate location workflow with the app */

    /* todo integrate location workflow with the app */

    /* todo integrate location workflow with the app */

    /* todo integrate location workflow with the app */

    /* todo integrate location workflow with the app */

    /* todo integrate location workflow with the app */

    /* todo integrate location workflow with the app */
  };

  const toggleZoomMode = () => {
    setZoomMode(!zoomMode);
  };

  const toggleTimer = () => {
    const timerModes = ['off', '3s', '10s'];
    const currentIndex = timerModes.indexOf(timerMode);
    const nextIndex = (currentIndex + 1) % timerModes.length;
    setTimerMode(timerModes[nextIndex]);
  };

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
      {!isAppInBackground && <View style={styles.cameraFrameInside} />}
      {/* Camera View with Frame */}
      <View ref={cameraContainerRef} style={styles.cameraFrame}>
        {device && !isAppInBackground ? (
          <Camera
            key={`${device.id}-${cameraPosition}-${
              isCameraReady ? 'ready' : 'not-ready'
            }`}
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={isCameraReady && !!device && !isAppInBackground}
            photo={isPhotoEnabled}
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
          {/* More Options Button */}
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
                  width: 37,
                  height: 37,
                  alignContent: 'center',
                  justifyContent: 'center',
                  borderRadius: 50,
                },
              ]}
              onPress={() => {
                // If viewControlActive is active, switch to tempActive
                if (viewControlActive) {
                  setViewControlActive(!viewControlActive);
                  setTempActive(!tempActive);
                  setHideControls(!hideControls);
                } else {
                  // Toggle tempActive normally
                  setTempActive(!tempActive);
                  setHideControls(!hideControls);
                }
              }}>
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
                marginRight: 20,
                marginLeft: 15,
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
                },
              ]}
              onPress={() => {
                // If tempActive is active, switch to viewControlActive
                if (tempActive) {
                  setTempActive(!tempActive);
                  setViewControlActive(!viewControlActive);
                  setHideControls(!hideControls);
                } else {
                  // Toggle viewControlActive normally
                  setViewControlActive(!viewControlActive);
                  setHideControls(!hideControls);
                }
              }}>
              {/* <Text style={styles.brightnessIcon}>☀️</Text> */}
              <Text style={styles.controlValue}>{focalLength}</Text>
            </TouchableOpacity>
          )}
          {viewControlActive && (
            <TouchableOpacity
              style={{
                marginLeft: 20,
                marginRight: 15,
                justifyContent: 'center',
                alignContent: 'center',
              }}
              onPress={() => {
                // Close viewControlActive and show controls
                setViewControlActive(!viewControlActive);
                setHideControls(!hideControls);
              }}>
              <Image
                source={require('../src/assets/icons/arrow-down.png')}
                style={{width: 14, height: 14, tintColor: '#fff'}}
              />
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
          {!hideControls && !tempActive && !viewControlActive && (
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
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleGrid}>
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
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#000',
                      borderWidth: 1.5,
                      borderColor: '#fff',
                      marginLeft: -5,
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
                      fontSize: 7,
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
                      fontSize: 7,
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

          {/* Shutter Button */}
          <TouchableOpacity
            style={[
              styles.shutterButton,
              isProcessing && styles.shutterButtonProcessing,
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
          style={styles.selectedCameraContainer}
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
          <View
            style={{
              marginBottom: -15,
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
    backgroundColor: 'rgba(230, 230, 230, 0.74)',
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
    marginLeft: -50,
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
    tintColor: 'rgb(255, 85, 0)',
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
});

export default CameraComponent;
