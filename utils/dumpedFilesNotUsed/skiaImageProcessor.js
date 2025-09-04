import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  useValue,
  useValueEffect,
  Paint,
  Group,
  useDerivedValue,
  useSharedValue,
  Skia,
  makeImageSnapshot,
  ImageShader,
} from '@shopify/react-native-skia';

// Black and white ColorMatrix for GR F filter
const blackAndWhiteMatrix = [
  0.299, 0.587, 0.114, 0, 0, // Red channel
  0.299, 0.587, 0.114, 0, 0, // Green channel  
  0.299, 0.587, 0.114, 0, 0, // Blue channel
  0, 0, 0, 1, 0, // Alpha channel
];

// High contrast black and white matrix
const highContrastBwMatrix = [
  0.2126, 0.7152, 0.0722, 0, 0, // Luminance weights
  0.2126, 0.7152, 0.0722, 0, 0,
  0.2126, 0.7152, 0.0722, 0, 0,
  0, 0, 0, 1, 0,
];

// Function to create a Skia image processing component
export const createSkiaImageProcessor = (imageUri, filterType) => {
  return () => {
    const image = useImage(imageUri);
    
    if (!image) {
      console.log('❌ Skia: Image not loaded');
      return null;
    }

    console.log('✅ Skia: Image loaded, processing with filter:', filterType);

    // Get image dimensions
    const { width, height } = image;
    console.log(`🎨 Skia: Image dimensions ${width}x${height}`);

    let colorMatrix = null;

    // Apply different filters based on type
    switch (filterType) {
      case 'grf':
        colorMatrix = blackAndWhiteMatrix;
        console.log('🎨 Skia: Applying GR F black and white matrix');
        break;
      case 'grdr':
        colorMatrix = highContrastBwMatrix;
        console.log('🎨 Skia: Applying GR DR high contrast matrix');
        break;
      default:
        console.log('🎨 Skia: No filter applied');
        return (
          <Canvas style={{ width, height }}>
            <Image
              x={0}
              y={0}
              width={width}
              height={height}
              image={image}
              fit="cover"
            />
          </Canvas>
        );
    }

    return (
      <Canvas style={{ width, height }}>
        <Image
          x={0}
          y={0}
          width={width}
          height={height}
          image={image}
          fit="cover"
        >
          <ColorMatrix matrix={colorMatrix} />
        </Image>
      </Canvas>
    );
  };
};

// Function to process image with Skia and return processed URI
export const processImageWithSkia = async (imageUri, filterType) => {
  try {
    console.log('🎨 Skia: Starting image processing for filter:', filterType);
    
    // Create the Skia component
    const SkiaProcessor = createSkiaImageProcessor(imageUri, filterType);
    
    // This is a simplified approach - in a real implementation,
    // we would need to render the Skia component to a canvas and capture it
    // For now, let's return the original URI and implement the full solution
    
    console.log('🎨 Skia: Image processing component created');
    
    // TODO: Implement actual Skia rendering to file
    // This requires more complex setup with Skia's makeImageSnapshot
    
    return imageUri;
  } catch (error) {
    console.error('❌ Skia image processing failed:', error);
    return imageUri;
  }
};

// Alternative approach using Skia's makeImageSnapshot
export const processImageWithSkiaSnapshot = async (imageUri, filterType) => {
  try {
    console.log('🎨 Skia: Using makeImageSnapshot for filter:', filterType);
    
    // This would require setting up a Skia canvas context
    // and rendering the image with ColorMatrix filter
    // Then using makeImageSnapshot to capture the result
    
    // For now, return the original URI
    // The full implementation would involve:
    // 1. Creating a Skia canvas
    // 2. Loading the image
    // 3. Applying ColorMatrix filter
    // 4. Using makeImageSnapshot to capture
    // 5. Saving to file
    
    console.log('🎨 Skia: makeImageSnapshot approach (not fully implemented)');
    return imageUri;
  } catch (error) {
    console.error('❌ Skia makeImageSnapshot failed:', error);
    return imageUri;
  }
};
