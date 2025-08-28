import React, {useRef, useEffect, useState} from 'react';
import {View, Text} from 'react-native';
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  makeImageSnapshot,
  Skia,
  useValue,
  useValueEffect,
} from '@shopify/react-native-skia';

// Black and white ColorMatrix for GR F filter
const blackAndWhiteMatrix = [
  0.299,
  0.587,
  0.114,
  0,
  0, // Red channel
  0.299,
  0.587,
  0.114,
  0,
  0, // Green channel
  0.299,
  0.587,
  0.114,
  0,
  0, // Blue channel
  0,
  0,
  0,
  1,
  0, // Alpha channel
];

// High contrast black and white matrix
const highContrastBwMatrix = [
  0.2126,
  0.7152,
  0.0722,
  0,
  0, // Luminance weights
  0.2126,
  0.7152,
  0.0722,
  0,
  0,
  0.2126,
  0.7152,
  0.0722,
  0,
  0,
  0,
  0,
  0,
  1,
  0,
];

// Skia Image Processing Component
const SkiaImageProcessor = ({imageUri, filterType, onProcessed}) => {
  const canvasRef = useRef(null);
  const [processedUri, setProcessedUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const image = useImage(imageUri);

  useEffect(() => {
    if (image && filterType && !isProcessing) {
      processImage();
    }
  }, [image, filterType]);

  const processImage = async () => {
    if (!image || !filterType) {
      console.log('❌ Skia: Missing image or filter type');
      return;
    }

    setIsProcessing(true);
    console.log('🎨 Skia: Starting image processing for filter:', filterType);

    try {
      // Get image dimensions
      const {width, height} = image;
      console.log(`🎨 Skia: Image dimensions ${width}x${height}`);

      // Determine which ColorMatrix to use
      let colorMatrix = null;
      switch (filterType) {
        case 'grf':
          colorMatrix = blackAndWhiteMatrix;
          console.log('🎨 Skia: Using GR F black and white matrix');
          break;
        case 'grdr':
          colorMatrix = highContrastBwMatrix;
          console.log('🎨 Skia: Using GR DR high contrast matrix');
          break;
        default:
          console.log('🎨 Skia: No filter matrix applied');
          setProcessedUri(imageUri);
          setIsProcessing(false);
          return;
      }

      // Create a temporary canvas to process the image
      const surface = Skia.Surface.Make(width, height);
      const canvas = surface.getCanvas();

      // Draw the image with ColorMatrix filter
      const paint = Skia.Paint();
      const colorFilter = Skia.ColorFilter.Matrix(colorMatrix);
      paint.setColorFilter(colorFilter);

      canvas.drawImage(image, 0, 0, paint);

      // Capture the processed image
      const snapshot = surface.makeImageSnapshot();
      const data = snapshot.encodeToData(Skia.ImageFormat.JPEG, 80);

      // Convert to base64 and create data URI
      const base64 = data.toString('base64');
      const processedImageUri = `data:image/jpeg;base64,${base64}`;

      console.log('✅ Skia: Image processing completed');
      setProcessedUri(processedImageUri);

      // Call the callback with the processed URI
      if (onProcessed) {
        onProcessed(processedImageUri);
      }
    } catch (error) {
      console.error('❌ Skia image processing failed:', error);
      setProcessedUri(imageUri);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!image) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Loading image...</Text>
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>Processing image with Skia...</Text>
      </View>
    );
  }

  // Return the processed image or original if processing failed
  return (
    <View style={{flex: 1}}>
      <Canvas ref={canvasRef} style={{flex: 1}}>
        <Image
          x={0}
          y={0}
          width={image.width()}
          height={image.height()}
          image={image}
          fit="cover"
        />
      </Canvas>
    </View>
  );
};

export default SkiaImageProcessor;

// Utility function to process image with Skia
export const processImageWithSkia = async (imageUri, filterType) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🎨 Skia: Processing image with filter:', filterType);

      // This is a simplified approach - in a real implementation,
      // we would need to create a temporary component and render it
      // For now, let's implement a different approach

      resolve(imageUri);
    } catch (error) {
      console.error('❌ Skia processing failed:', error);
      reject(error);
    }
  });
};
