// Dumped Functions from CameraComponent.js
// These functions are currently unused but kept for future reference
// They provide various image filtering and processing capabilities

import React, {useState, useEffect} from 'react';
import {View, StyleSheet, Image} from 'react-native';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
} from '@shopify/react-native-skia';
import {ColorMatrixImageFilter} from 'react-native-color-matrix-image-filters';
import RNFS from 'react-native-fs';

// Import utility functions (you'll need to ensure these exist in your project)
// import {openglFilterEffects, getOpenGLFilterOverlay} from './openglFilterEffects';

/**
 * Skia Filter Preview Component
 * Renders a live preview of how a filter will look on an image
 * Uses Skia for high-performance image rendering with color matrix filters
 *
 * @param {string} imageUri - URI of the image to preview
 * @param {string} filterId - ID of the filter to apply
 * @returns {JSX.Element} - Filtered image preview using Skia Canvas
 */
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

/**
 * Function to get combined filter effects for ImageFilter
 * Combines multiple active filters into a single array of effects
 * Processes OpenGL filter configurations and logs detailed information
 *
 * @returns {Array} - Array of combined filter effects
 */
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

/**
 * Function to get filter overlay style for live preview
 * Creates overlay styles for real-time filter preview on camera
 * Checks OpenGL filter overlays and provides fallback handling
 *
 * @returns {Object} - CSS style object for filter overlay or empty object
 */
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

/**
 * Function to apply OpenGL filter effects to photo using multiple approaches
 * Processes photos with various filter effects including brightness, contrast, saturation
 * Special handling for GR F (black & white) filter
 * Uses ColorMatrixImageFilter for image processing with fallback to original
 *
 * @param {string} photoUri - URI of the photo to process
 * @param {string} filterId - ID of the filter to apply
 * @returns {Promise<string>} - URI of the processed photo or original if processing fails
 */
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
            0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587,
            0.114, 0, 0, 0, 0, 0, 1, 0,
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
            console.log('✅ GR F filter applied successfully to:', outputPath);
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

/**
 * Function to render image through OpenGL (currently disabled)
 * Placeholder for future OpenGL image processing implementation
 * Currently returns original image as OpenGL processing is not available for file output
 *
 * @param {string} imageUri - URI of the image to process
 * @param {Array} colorMatrix - Color matrix for filter effects
 * @returns {Promise<string|null>} - Currently returns original image URI
 */
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

// NOTE: These functions depend on external dependencies that may not be available:
// - openglFilterEffects: Filter configuration object
// - getOpenGLFilterOverlay: Function to get overlay styles
// - global.activeFilters: Global state for active filters
// - activeFilters: Local state for active filters
//
// To use these functions, you'll need to:
// 1. Import the missing dependencies
// 2. Pass required parameters when calling the functions
// 3. Ensure the filter configurations exist

// Export functions for potential future use
export {
  SkiaFilterPreview,
  getCombinedFilters,
  getFilterOverlayStyle,
  applyOpenGLFilterToPhoto,
  renderImageWithOpenGL,
};
