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

// Import ImageManipulator with fallback
let ImageManipulator;
let ImageCropPicker;
try {
  const ImageManipulatorModule = require('react-native-image-manipulator');
  console.log(
    '🔍 ImageManipulator module keys:',
    Object.keys(ImageManipulatorModule),
  );
  console.log('🔍 ImageManipulator module:', ImageManipulatorModule);

  ImageManipulator =
    ImageManipulatorModule.ImageManipulator ||
    ImageManipulatorModule.default ||
    ImageManipulatorModule;
  console.log('✅ ImageManipulator imported successfully:', !!ImageManipulator);
  console.log('🔍 ImageManipulator type:', typeof ImageManipulator);
  console.log(
    '🔍 ImageManipulator methods:',
    ImageManipulator ? Object.keys(ImageManipulator) : 'null',
  );
  if (ImageManipulator) {
    console.log(
      '🔍 ImageManipulator.process exists:',
      !!ImageManipulator.process,
    );
    console.log(
      '🔍 ImageManipulator.manipulate exists:',
      !!ImageManipulator.manipulate,
    );
    console.log(
      '🔍 ImageManipulator.manipulateAsync exists:',
      !!ImageManipulator.manipulateAsync,
    );
    console.log('🔍 ImageManipulator.edit exists:', !!ImageManipulator.edit);
    console.log(
      '🔍 ImageManipulator.grayscale exists:',
      !!ImageManipulator.grayscale,
    );
    console.log(
      '🔍 ImageManipulator.blackAndWhite exists:',
      !!ImageManipulator.blackAndWhite,
    );
    console.log(
      '🔍 ImageManipulator.monochrome exists:',
      !!ImageManipulator.monochrome,
    );
    console.log(
      '🔍 All ImageManipulator methods:',
      Object.keys(ImageManipulator),
    );
  }
} catch (error) {
  console.log('❌ ImageManipulator import failed:', error);
  ImageManipulator = null;
}

// Also try ImageCropPicker as alternative
try {
  ImageCropPicker = require('react-native-image-crop-picker');
  console.log('✅ ImageCropPicker imported successfully:', !!ImageCropPicker);
} catch (error) {
  console.log('❌ ImageCropPicker import failed:', error);
  ImageCropPicker = null;
}

// Try ImageFilterKit for better B&W support
let ImageFilterKit;
try {
  ImageFilterKit = require('react-native-image-filter-kit');
  console.log('✅ ImageFilterKit imported successfully:', !!ImageFilterKit);
  console.log('🔍 ImageFilterKit methods:', Object.keys(ImageFilterKit));
} catch (error) {
  console.log('❌ ImageFilterKit import failed:', error);
  ImageFilterKit = null;
}
// Import Skia components for version 0.1.241
let Canvas, ColorMatrix;

// Try ES6 import first
try {
  const {
    Canvas: CanvasES6,
    ColorMatrix: ColorMatrixES6,
  } = require('@shopify/react-native-skia');
  if (CanvasES6 && ColorMatrixES6) {
    Canvas = CanvasES6;
    ColorMatrix = ColorMatrixES6;
    console.log('✅ Skia components imported via ES6 destructuring');
  }
} catch (error) {
  console.log('ES6 import failed, trying require method...');
}

try {
  // Import Skia module
  const Skia = require('@shopify/react-native-skia');
  console.log('Skia module loaded successfully');
  console.log('Available keys:', Object.keys(Skia));
  console.log('Full Skia object:', Skia);

  // Try different paths for Canvas and ColorMatrix
  if (Skia.Canvas) {
    Canvas = Skia.Canvas;
    console.log('✅ Canvas found at Skia.Canvas');
  } else if (Skia.default && Skia.default.Canvas) {
    Canvas = Skia.default.Canvas;
    console.log('✅ Canvas found at Skia.default.Canvas');
  } else if (Skia.Skia && Skia.Skia.Canvas) {
    Canvas = Skia.Skia.Canvas;
    console.log('✅ Canvas found at Skia.Skia.Canvas');
  } else {
    console.log('❌ Canvas not found in any location');
  }

  if (Skia.ColorMatrix) {
    ColorMatrix = Skia.ColorMatrix;
    console.log('✅ ColorMatrix found at Skia.ColorMatrix');
  } else if (Skia.default && Skia.default.ColorMatrix) {
    ColorMatrix = Skia.default.ColorMatrix;
    console.log('✅ ColorMatrix found at Skia.default.ColorMatrix');
  } else if (Skia.Skia && Skia.Skia.ColorMatrix) {
    ColorMatrix = Skia.Skia.ColorMatrix;
    console.log('✅ ColorMatrix found at Skia.Skia.ColorMatrix');
  } else {
    console.log('❌ ColorMatrix not found in any location');
  }

  console.log('Final Canvas type:', typeof Canvas);
  console.log('Final ColorMatrix type:', typeof ColorMatrix);

  if (Canvas && ColorMatrix) {
    console.log('✅ Skia components imported successfully');
  } else {
    console.log('❌ Skia components not found');
  }
} catch (error) {
  console.log('❌ Skia import failed:', error);
  Canvas = null;
  ColorMatrix = null;
}

// Safe Canvas Wrapper Component
const SafeCanvas = ({children, style}) => {
  try {
    if (
      Canvas &&
      (typeof Canvas === 'function' || typeof Canvas === 'object')
    ) {
      return <Canvas style={style}>{children}</Canvas>;
    } else {
      console.log('No Canvas component available');
      return null;
    }
  } catch (error) {
    console.log('Canvas error:', error);
    return null;
  }
};

// Safe Skia Filter Component with multiple fallbacks
const SkiaFilterOverlay = ({activeFilters}) => {
  console.log('🎨 SkiaFilterOverlay called with filters:', activeFilters);

  // Multiple safety checks
  if (
    !activeFilters ||
    !Array.isArray(activeFilters) ||
    activeFilters.length === 0
  ) {
    console.log('🎨 SkiaFilterOverlay: No active filters');
    return null;
  }

  // Multiple safety checks
  if (
    !activeFilters ||
    !Array.isArray(activeFilters) ||
    activeFilters.length === 0
  ) {
    return null;
  }

  const filterId = activeFilters[0];

  // Check if filterId is valid
  if (!filterId || typeof filterId !== 'string') {
    console.log('Invalid filter ID:', filterId);
    return null;
  }

  // Check if skiaFilterEffects exists
  if (!skiaFilterEffects || typeof skiaFilterEffects !== 'object') {
    console.log('skiaFilterEffects not available');
    return null;
  }

  const skiaConfig = skiaFilterEffects[filterId];

  // Check if config exists and has effects
  if (
    !skiaConfig ||
    !skiaConfig.effects ||
    typeof skiaConfig.effects !== 'object'
  ) {
    console.log('No Skia config for filter:', filterId);
    return null;
  }

  try {
    const {
      brightness = 0,
      contrast = 1,
      saturation = 1,
      hue = 0,
      gamma = 1,
    } = skiaConfig.effects;

    // Validate values are numbers
    if (
      typeof brightness !== 'number' ||
      typeof contrast !== 'number' ||
      typeof saturation !== 'number' ||
      typeof hue !== 'number' ||
      typeof gamma !== 'number'
    ) {
      console.log('Invalid effect values for filter:', filterId);
      return null;
    }

    // Create safe color matrix with bounds checking
    const safeContrast = Math.max(0, Math.min(3, contrast)); // Limit contrast to 0-3
    const safeBrightness = Math.max(-1, Math.min(1, brightness)); // Limit brightness to -1 to 1
    const safeSaturation = Math.max(0, Math.min(2, saturation)); // Limit saturation to 0-2

    // Create color matrix for the filter effects
    const colorMatrix = [
      // Red channel
      safeContrast,
      0,
      0,
      0,
      safeBrightness,
      // Green channel
      0,
      safeContrast,
      0,
      0,
      safeBrightness,
      // Blue channel
      0,
      0,
      safeContrast,
      0,
      safeBrightness,
      // Alpha channel
      0,
      0,
      0,
      1,
      0,
    ];

    // Validate color matrix
    if (!Array.isArray(colorMatrix) || colorMatrix.length !== 20) {
      console.log('Invalid color matrix generated');
      return null;
    }

    // Check if all values are numbers
    const allNumbers = colorMatrix.every(
      val => typeof val === 'number' && !isNaN(val),
    );
    if (!allNumbers) {
      console.log('Color matrix contains invalid values');
      return null;
    }

    // Use a simpler approach without worklets for now
    if (ColorMatrix && typeof ColorMatrix === 'function') {
      // Create a simple identity matrix for testing
      const identityMatrix = [
        1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0,
      ];

      // For GR F filter, use pure black and white matrix (front camera only)
      if (filterId === 'grf') {
        console.log(
          '🎨 Skia: Applying pure black and white matrix for front camera',
        );

        // Pure black and white matrix - converts all colors to grayscale
        const pureBlackAndWhiteMatrix = [
          0.299,
          0.587,
          0.114,
          0,
          0, // Red channel - pure luminance
          0.299,
          0.587,
          0.114,
          0,
          0, // Green channel - pure luminance
          0.299,
          0.587,
          0.114,
          0,
          0, // Blue channel - pure luminance
          0,
          0,
          0,
          1,
          0, // Alpha channel - unchanged
        ];

        console.log(
          '🎨 Skia: Pure black and white matrix applied successfully',
        );
        return <ColorMatrix matrix={pureBlackAndWhiteMatrix} />;
      }
      return <ColorMatrix matrix={identityMatrix} />;
    } else {
      console.log('No ColorMatrix component available');
      return null;
    }
  } catch (error) {
    console.log('Skia filter error for', filterId, ':', error);
    return null;
  }
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
  const [skiaWorking, setSkiaWorking] = useState(false);
  // Camera position state - using the simpler approach like your friend
  const [cameraPosition, setCameraPosition] = useState('front');
  const [flashMode, setFlashMode] = useState('off');
  const [showGrid, setShowGrid] = useState(false);
  const [timerMode, setTimerMode] = useState('off');
  const [latestMedia, setLatestMedia] = useState(null);
  const cameraRef = useRef(null); // Ref for Camera component

  const devices = useCameraDevices();

  // Test if Skia is working
  const testSkia = () => {
    try {
      console.log('Testing Skia components...');
      console.log('Canvas type:', typeof Canvas);
      console.log('ColorMatrix type:', typeof ColorMatrix);
      console.log('Canvas available:', Canvas ? 'YES' : 'NO');
      console.log('ColorMatrix available:', ColorMatrix ? 'YES' : 'NO');

      // Test if Canvas and ColorMatrix are available
      // Canvas is an object (React component), ColorMatrix is a function
      const canvasAvailable =
        Canvas && (typeof Canvas === 'object' || typeof Canvas === 'function');
      const colorMatrixAvailable =
        ColorMatrix && typeof ColorMatrix === 'function';

      if (canvasAvailable && colorMatrixAvailable) {
        console.log('✅ Skia components available');
        setSkiaWorking(true);
        return true;
      } else {
        console.log('❌ Skia components not available');
        console.log('Canvas available:', canvasAvailable);
        console.log('ColorMatrix available:', colorMatrixAvailable);
        setSkiaWorking(false);
        return false;
      }
    } catch (error) {
      console.log('❌ Skia test failed:', error);
      setSkiaWorking(false);
      return false;
    }
  };

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
    // Test Skia on mount
    setTimeout(() => {
      testSkia();
    }, 1000);
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
    } catch (error) {
      console.log('Error getting filter overlay style:', error);
      return {};
    }
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

  // Function to render image through Skia Canvas with ColorMatrix
  const renderImageWithSkia = async (imageUri, colorMatrix) => {
    if (!Canvas || !ColorMatrix) {
      console.log('❌ Skia components not available for image rendering');
      return null;
    }

    try {
      console.log('🎨 Rendering image through Skia Canvas...');

      // Since we can't easily render to a file with Skia in React Native,
      // let's use a different approach - apply the filter using ImageManipulator
      // but with a more aggressive approach

      if (ImageManipulator) {
        console.log('🎨 Using ImageManipulator with safe B&W settings...');

        try {
          // Use safer values that won't crash the app
          let processed = await ImageManipulator.manipulate(
            imageUri,
            [{contrast: 3.0}], // High but safe contrast
            {compress: 0.8, format: 'jpeg'},
          );

          processed = await ImageManipulator.manipulate(
            processed.uri,
            [{brightness: 0.2}], // Moderate brightening
            {compress: 0.8, format: 'jpeg'},
          );

          processed = await ImageManipulator.manipulate(
            processed.uri,
            [{contrast: 2.5}], // Final safe contrast
            {compress: 0.8, format: 'jpeg'},
          );

          console.log('🎨 Safe B&W processing completed');
          return processed.uri;
        } catch (error) {
          console.error('❌ ImageManipulator processing failed:', error);
          // Return original if processing fails
          return imageUri;
        }
      }

      // Fallback: Try using ImageCropPicker if available
      if (ImageCropPicker) {
        console.log('🎨 Trying ImageCropPicker for B&W processing...');
        try {
          // ImageCropPicker might have better support for image manipulation
          // For now, return original as fallback
          return imageUri;
        } catch (error) {
          console.error('❌ ImageCropPicker processing failed:', error);
        }
      }

      return imageUri;
    } catch (error) {
      console.error('❌ Skia image rendering failed:', error);
      return null;
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
      console.log('ImageManipulator type:', typeof ImageManipulator);
      console.log('Photo URI:', photoUri);

      // Check if we have active filters to apply
      if (activeFilters.length > 0) {
        console.log('🎯 Processing active filters for photo...');

        // Get the filter configuration
        const filterId = activeFilters[0];
        const skiaConfig = skiaFilterEffects[filterId];
        const openglConfig = openglFilterEffects[filterId];
        const simpleConfig = simpleFilterConfigs[filterId];

        const filterConfig = skiaConfig || openglConfig || simpleConfig;

        if (filterConfig && filterConfig.effects) {
          console.log('🎯 Applying filter effects:', filterConfig.effects);

          // Create ImageManipulator actions based on filter effects
          const actions = [];

          if (filterConfig.effects.brightness !== undefined) {
            actions.push({brightness: filterConfig.effects.brightness});
            console.log(
              '🎯 Added brightness:',
              filterConfig.effects.brightness,
            );
          }

          if (filterConfig.effects.contrast !== undefined) {
            actions.push({contrast: filterConfig.effects.contrast});
            console.log('🎯 Added contrast:', filterConfig.effects.contrast);
          }

          if (filterConfig.effects.saturation !== undefined) {
            // Special handling for GR F filter to ensure black and white
            if (filterId === 'grf') {
              actions.push({saturation: 0}); // Force to 0 for true black and white
              console.log(
                '🎯 GR F filter: Forcing saturation to 0 for black and white',
              );
            } else {
              actions.push({saturation: filterConfig.effects.saturation});
              console.log(
                '🎯 Added saturation:',
                filterConfig.effects.saturation,
              );
            }
          }

          console.log('🎯 Final actions for photo processing:', actions);

          // Simplified GR F filter handling to prevent freezing
          if (filterId === 'grf') {
            console.log(
              '🎯 GR F filter: Using simplified approach to prevent freezing...',
            );
            console.log('🎯 Note: Skia overlay is applied in camera preview');

            const saved = await savePhotoToGallery(photoUri);
            return {
              uri: photoUri,
              saved,
              filtersApplied: true,
              filterInfo: `Applied GR F black and white filter via Skia overlay (original photo saved)`,
            };
          }

          // For other filters, try ImageManipulator if available
          if (ImageManipulator && actions.length > 0) {
            try {
              console.log('🎯 Processing with ImageManipulator...');
              const result = await ImageManipulator.manipulate(
                photoUri,
                actions,
                {
                  compress: 0.8,
                  format: ImageManipulator.SaveFormat.JPEG,
                },
              );
              console.log('✅ ImageManipulator processing completed');
              const saved = await savePhotoToGallery(result.uri);
              return {
                uri: result.uri,
                saved,
                filtersApplied: true,
                filterInfo: `Applied ${filterId} filter via ImageManipulator`,
              };
            } catch (manipulatorError) {
              console.error('❌ ImageManipulator failed:', manipulatorError);
            }
          }
        }
      }

      // Fallback: save original photo
      console.log('🎯 Using fallback - saving original photo');
      const saved = await savePhotoToGallery(photoUri);
      return {
        uri: photoUri,
        saved,
        filtersApplied: true,
        filterInfo: `Applied filter via UI overlay (original photo saved)`,
      };
    } catch (error) {
      console.error('❌ applyFiltersToPhoto failed:', error);
      // Ultimate fallback
      try {
        const saved = await savePhotoToGallery(photoUri);
        return {uri: photoUri, saved, filtersApplied: false};
      } catch (saveError) {
        console.error('❌ Even savePhotoToGallery failed:', saveError);
        return {uri: photoUri, saved: false, filtersApplied: false};
      }
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

      console.log('🎯 Taking photo with camera position:', cameraPosition);

      // Add extra delay for front camera to prevent AVFoundation errors
      if (cameraPosition === 'front') {
        console.log('🎯 Front camera detected, adding extra delay...');
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const photo = await cameraRef.current.takePhoto({
        qualityPrioritization: 'quality',
        flash: flashMode,
      });

      console.log(
        '🎯 Photo captured successfully for',
        cameraPosition,
        'camera',
      );
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

        // Special handling for front camera - reinitialize if needed
        if (cameraPosition === 'front') {
          console.log(
            '🎯 Front camera photo completed, checking camera state...',
          );
          // Add a small delay to let the camera stabilize
          setTimeout(() => {
            if (!isCameraReady) {
              console.log('🎯 Front camera not ready, reinitializing...');
              setIsCameraReady(false);
              setTimeout(() => setIsCameraReady(true), 500);
            }
          }, 1000);
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
            key={`${device.id}-${cameraPosition}-${
              isCameraReady ? 'ready' : 'not-ready'
            }`}
            ref={cameraRef}
            style={styles.camera}
            device={device}
            isActive={isCameraReady && !!device && !isAppInBackground}
            photo={isPhotoEnabled}
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

      {/* Safe Skia Filter Overlay with Multiple Fallbacks */}
      {/* Safe Skia Filter Overlay with Multiple Fallbacks */}
      {activeFilters.length > 0 && !isAppInBackground && skiaWorking && (
        <View style={[styles.skiaFilterOverlay, {zIndex: 999}]}>
          <Canvas style={StyleSheet.absoluteFill}>
            <SkiaFilterOverlay
              key={`skia-${cameraPosition}-${activeFilters[0]}`}
              activeFilters={activeFilters}
            />
          </Canvas>
          {__DEV__ && (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: 'rgba(0,255,0,0.7)',
                padding: 5,
                borderRadius: 5,
              }}>
              <Text style={{color: 'white', fontSize: 8}}>
                Skia: {activeFilters[0]} | Camera: {cameraPosition}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Fallback CSS Overlay - Only when Skia is not available */}
      {activeFilters.length > 0 && !skiaWorking && (
        <View style={[styles.filterOverlay, getFilterOverlayStyle()]} />
      )}

      {/* Fallback CSS Overlay - Only when Skia is not available */}
      {activeFilters.length > 0 && !skiaWorking && (
        <View style={[styles.filterOverlay, getFilterOverlayStyle()]} />
      )}

      {/* Debug Info - Remove this later */}
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
            Skia: {skiaWorking ? '✅' : '❌'} | Filters: {activeFilters.length}{' '}
            | Active: {activeFilters[0] || 'none'}
          </Text>
        </View>
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
          <TouchableOpacity style={styles.modalContent}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>
              Assistive grid
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalContent}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Level</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalContent}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Save Location</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalContent}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Zoom Mode</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalContent, {borderBottomColor: 'transparent'}]}>
            <Text style={{paddingLeft: 18, paddingTop: 18}}>Settings</Text>
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
                }}>
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  13
                </Text>
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
                }}>
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  26
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
                }}>
                <Text style={{color: '#fff', fontSize: 14, fontWeight: '600'}}>
                  35
                </Text>
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
    marginHorizontal: 15,
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
  skiaFilterOverlay: {
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
