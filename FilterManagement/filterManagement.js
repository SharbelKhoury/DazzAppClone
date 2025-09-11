import React from 'react';
import {
  Canvas,
  Image as SkiaImage,
  useImage,
  ColorMatrix,
  Shader,
  ImageShader,
  Fill,
  Group,
  FilterMode,
  MipmapMode,
  drawAsImage,
  ImageFormat,
} from '@shopify/react-native-skia';
import {Skia} from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';
import {Buffer} from 'buffer';
import {
  openglFilterEffects,
  getOpenGLFilterOverlay,
  createOpenGLFilteredImage,
} from '../utils/openglFilterEffects';
import {
  getFilterMatrix,
  setMatrixSystem,
  getMatrixSystem,
  MATRIX_SYSTEMS,
} from '../utils/filterMatrixUtils';
import {base64 as grfLutBase64} from '../filtersLUT/grf';
import {base64 as irLutBase64} from '../filtersLUT/ir';
import {base64 as dexpLutBase64} from '../filtersLUT/dexp';
import {base64 as dfunsLutBase64} from '../filtersLUT/dfuns';
import {base64 as cpm35LutBase64} from '../filtersLUT/cpm35';
import {base64 as classicuLutBase64} from '../filtersLUT/classicu';

/**
 * Helper function to create color matrix from filter config
 * @param {Object} filterConfig - Filter configuration object
 * @returns {Array} - Color matrix array
 */
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
      0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114,
      0, 0, 0, 0, 0, 1, 0,
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

/**
 * Helper function to create temperature color matrix
 * @param {number} tempValue - Temperature value (0-100)
 * @returns {Array} - Temperature color matrix array
 */
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
 * Create LUT filter element for Skia processing
 * Creates a Skia component that applies LUT-based filtering with noise effects
 *
 * @param {string} photoUrl - Base64 encoded photo data
 * @param {number} imageWidth - Width of the image
 * @param {number} imageHeight - Height of the image
 * @param {string} filterId - ID of the filter to apply
 * @returns {JSX.Element|null} - Skia filter element or null if failed
 */
export const createLUTFilterElement = (
  photoUrl,
  imageWidth,
  imageHeight,
  filterId,
) => {
  const shader = Skia.RuntimeEffect.Make(`
    uniform shader image;
    uniform shader luts;
  
    // Simple noise function
    float rand(float2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
  
    half4 main(float2 xy) {
      // Original image processing
      vec4 color = image.eval(xy);
      
      int r = int(color.r * 255.0 / 4);
      int g = int(color.g * 255.0 / 4);
      int b = int(color.b * 255.0 / 4);
      
      float lutX = float(int(mod(float(b), 8.0)) * 64 + r);
      float lutY = float(int((b / 8) * 64 + g));
      
      vec4 lutsColor = luts.eval(float2(lutX, lutY));
      
      // Generate noise
      float noiseIntensity = 0.04; // Adjust this to control noise strength
      float noise = rand(xy) * noiseIntensity;
      
      // Blend noise with the image (simple additive blend)
      vec4 noisyColor = lutsColor + vec4(noise, noise, noise, 0.0);
      
      return noisyColor;
    }
  `);

  // Import LUT based on filter ID
  let lutBase64;
  try {
    if (filterId === 'grf') {
      lutBase64 = grfLutBase64;
    } else if (filterId === 'ir') {
      lutBase64 = irLutBase64;
    } else if (filterId === 'dexp') {
      lutBase64 = dexpLutBase64;
    } else if (filterId === 'dfuns') {
      lutBase64 = dfunsLutBase64;
    } else if (filterId === 'cpm35') {
      lutBase64 = cpm35LutBase64;
    } else if (filterId === 'classicu') {
      lutBase64 = classicuLutBase64;
    } else {
      // For other filters, you can add more imports here
      throw new Error(`No LUT found for filter: ${filterId}`);
    }
  } catch (error) {
    console.error('❌ Failed to load LUT for filter:', filterId, error);
    return null;
  }

  const lutData = Skia.Data.fromBase64(lutBase64);
  const lutImage = Skia.Image.MakeImageFromEncoded(lutData);
  const data = Skia.Data.fromBase64(photoUrl);
  const capturedImage = Skia.Image.MakeImageFromEncoded(data);

  if (!capturedImage || !shader || !lutImage) {
    return null;
  }

  return (
    <Group>
      <Fill />
      <Shader source={shader} uniforms={{}}>
        <ImageShader
          fit="cover"
          image={capturedImage}
          rect={{
            x: 0,
            y: 0,
            width: imageWidth,
            height: imageHeight,
          }}
          sampling={{
            filter: FilterMode.Linear,
            mipmap: MipmapMode.None,
          }}
        />
        <ImageShader
          fit="cover"
          image={lutImage}
          rect={{
            x: 0,
            y: 0,
            width: 512,
            height: 512,
          }}
          sampling={{
            filter: FilterMode.Linear,
            mipmap: MipmapMode.None,
          }}
        />
      </Shader>
    </Group>
  );
};

/**
 * Apply Skia-based filter to a photo
 * Processes photos using Skia with support for both LUT-based and matrix-based filtering
 * Includes special effects for specific filters like vignettes and color overlays
 *
 * @param {string} photoUri - URI of the photo to process
 * @param {string} filterId - ID of the filter to apply
 * @param {number} temperatureValue - Temperature value for color adjustment (0-100)
 * @returns {Promise<string>} - URI of the processed photo or original if failed
 */
export const applySkiaFilterToPhoto = async (
  photoUri,
  filterId,
  temperatureValue = 50,
) => {
  try {
    console.log('🎨 Commencing Skia approach...');

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

    // Create surface and canvas
    const surface = Skia.Surface.Make(width, height);
    const canvas = surface.getCanvas();

    // Apply LUT-based filtering for 'grf', 'ir', 'dexp', 'dfuns', 'cpm35', and 'classicu' filters
    if (
      filterId === 'grf' ||
      filterId === 'ir' ||
      filterId === 'dexp' ||
      filterId === 'dfuns' ||
      filterId === 'cpm35' ||
      filterId === 'classicu'
    ) {
      console.log(`🎨 Applying LUT-based filtering for ${filterId} filter`);

      try {
        console.log('🎨 Using drawAsImage method like the working example...');

        // Create LUT filter element like the working example
        const filteredElement = createLUTFilterElement(
          imageData,
          width,
          height,
          filterId,
        );

        if (!filteredElement) {
          throw new Error('Failed to create LUT filter element');
        }

        // Use drawAsImage like the working example
        const skImage = await drawAsImage(filteredElement, {
          width: width,
          height: height,
        });

        // Draw the processed image to canvas
        canvas.drawImage(skImage, 0, 0);

        console.log('✅ drawAsImage LUT method completed successfully');
      } catch (lutError) {
        console.error(
          '❌ LUT filtering failed, falling back to matrix:',
          lutError,
        );

        // Fallback to matrix-based filtering for grf
        const filterConfig = openglFilterEffects[filterId];
        const colorMatrix = getFilterMatrix(
          filterId,
          openglFilterEffects,
          createColorMatrixFromFilter,
        );
        const temperatureMatrix =
          createTemperatureColorMatrix(temperatureValue);
        const combinedMatrix = combineColorMatrices(
          colorMatrix,
          temperatureMatrix,
        );
        const colorFilter = Skia.ColorFilter.MakeMatrix(combinedMatrix);
        const paint = Skia.Paint();
        paint.setColorFilter(colorFilter);
        canvas.drawImage(skiaImage, 0, 0, paint);
      }
    } else {
      // Use original matrix-based filtering for all other filters
      console.log('🎨 Using matrix-based filtering for', filterId);

      // Create color matrix
      const filterConfig = openglFilterEffects[filterId];
      console.log('🎨 Filter config:', filterConfig);

      // Get the correct color matrix for the specific filter
      console.log('🎨 Current matrix system:', getMatrixSystem());
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

      // Draw the image with the filter
      canvas.drawImage(skiaImage, 0, 0, paint);
    }

    // Apply vignette effect specifically for hoga filter
    if (filterId === 'hoga') {
      console.log('🎨 Applying vignette effect for hoga filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.5)')], // 50% dark at corners
        [0, 0.5], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for hoga filter
    if (filterId === 'classicu') {
      console.log('🎨 Applying vignette effect for classicu filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.2)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient2 = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(255, 255, 255, 0.09)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient2);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for dfuns filter
    if (filterId === 'dfuns') {
      console.log('🎨 Applying vignette effect for dfuns filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.25)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply vignette effect specifically for cpm35 filter
    if (filterId === 'cpm35') {
      console.log('🎨 Applying vignette effect for cpm35 filter');

      // Create vignette paint
      const vignettePaint = Skia.Paint();

      // Create radial gradient for vignette (reduced size as requested)
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.max(width, height) / 2;

      // Create gradient from transparent center to dark corners (reduced shadow size)
      const gradient = Skia.Shader.MakeRadialGradient(
        {x: centerX, y: centerY},
        radius,
        [Skia.Color('transparent'), Skia.Color('rgba(0,0,0,0.25)')], // 50% dark at corners
        [0, 0.001], // Reduced from 0.5 to 0.25 for half the shadow size
        0, // TileMode.Clamp = 0
      );

      vignettePaint.setShader(gradient);

      // Draw vignette overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), vignettePaint);
    }

    // Apply special effects for dexp filter
    if (filterId === 'dexp') {
      console.log('🎨 Applying vignette effect for dexp filter');

      // 1. Yellow weak background overlay
      const yellowPaint = Skia.Paint();
      yellowPaint.setColor(Skia.Color('rgba(0, 0, 0, 0.2)')); // Weak yellow overlay
      canvas.drawRect(Skia.XYWHRect(0, 0, width, height), yellowPaint);

      // 2. Red vignette at bottom (20% from bottom, full width)
      const redVignettePaint = Skia.Paint();
      const bottomStartY = height * 0.8; // Start from 80% height (20% from bottom)
      const bottomHeight = height * 0.2; // 20% of image height

      // Create linear gradient from transparent to red at bottom
      const redGradient = Skia.Shader.MakeLinearGradient(
        {x: 0, y: bottomStartY}, // Start point (top of bottom area)
        {x: 0, y: height}, // End point (bottom of image)
        [Skia.Color('transparent'), Skia.Color('rgba(255, 0, 0, 0.25)')], // Red with 0.25 opacity
        [0, 4],
        0, // TileMode.Clamp = 0
      );

      redVignettePaint.setShader(redGradient);

      // Draw red vignette at bottom
      canvas.drawRect(
        Skia.XYWHRect(0, bottomStartY, width, bottomHeight),
        redVignettePaint,
      );

      // 3. Black vignette at top (20% from top, full width)
      const blackVignettePaint = Skia.Paint();
      const topStartY = 0; // Start from top
      const topHeight = height * 0.2; // 20% of image height

      // Create linear gradient from black to transparent (top to bottom)
      const blackGradient = Skia.Shader.MakeLinearGradient(
        {x: 0, y: topStartY}, // Start point (top of image)
        {x: 0, y: topHeight}, // End point (20% down from top)
        [Skia.Color('rgba(0, 0, 0, 0.3)'), Skia.Color('transparent')], // Black to transparent
        [0, 1],
        0, // TileMode.Clamp = 0
      );

      blackVignettePaint.setShader(blackGradient);

      // Draw black vignette at top
      canvas.drawRect(
        Skia.XYWHRect(0, topStartY, width, topHeight),
        blackVignettePaint,
      );
    }

    // Apply corner vignette effect for dfuns filter
    if (filterId === 'dfuns') {
      console.log('🎨 Applying corner vignette effect for dfuns filter');

      // Create corner vignette paint
      const cornerVignettePaint = Skia.Paint();
      const cornerSize = Math.min(width, height) * 0.2; // 30% of image size for larger coverage

      // Create radial gradient for corner vignette
      const cornerGradient = Skia.Shader.MakeRadialGradient(
        {x: 0, y: 0}, // Center point (will be adjusted per corner)
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')], // Dark to transparent
        [0, 1],
        0, // TileMode.Clamp = 0
      );

      cornerVignettePaint.setShader(cornerGradient);

      // Top-left corner
      const topLeftGradient = Skia.Shader.MakeRadialGradient(
        {x: 0, y: 0}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(topLeftGradient);
      canvas.drawRect(
        Skia.XYWHRect(0, 0, cornerSize, cornerSize),
        cornerVignettePaint,
      );

      // Top-right corner
      const topRightGradient = Skia.Shader.MakeRadialGradient(
        {x: width, y: 0}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(topRightGradient);
      canvas.drawRect(
        Skia.XYWHRect(width - cornerSize, 0, cornerSize, cornerSize),
        cornerVignettePaint,
      );

      // Bottom-left corner
      const bottomLeftGradient = Skia.Shader.MakeRadialGradient(
        {x: 0, y: height}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(bottomLeftGradient);
      canvas.drawRect(
        Skia.XYWHRect(0, height - cornerSize, cornerSize, cornerSize),
        cornerVignettePaint,
      );

      // Bottom-right corner
      const bottomRightGradient = Skia.Shader.MakeRadialGradient(
        {x: width, y: height}, // Center at the very corner point
        cornerSize,
        [Skia.Color('rgba(0, 0, 0, 0.4)'), Skia.Color('transparent')],
        [0, 1],
        0,
      );
      cornerVignettePaint.setShader(bottomRightGradient);
      canvas.drawRect(
        Skia.XYWHRect(
          width - cornerSize,
          height - cornerSize,
          cornerSize,
          cornerSize,
        ),
        cornerVignettePaint,
      );
    }

    // Make image from surface
    const image = surface.makeImageSnapshot();
    if (!image) {
      throw new Error('Failed to create image from surface');
    }

    // Encode image to bytes
    const imageDataOut = image.encodeToBytes();
    if (!imageDataOut) {
      throw new Error('Failed to encode image');
    }

    // Convert to base64
    const base64String = Buffer.from(imageDataOut).toString('base64');

    // Save to temporary file
    const tempPath = `${
      RNFS.TemporaryDirectoryPath
    }/skia_filtered_${filterId}_${Date.now()}.jpg`;
    await RNFS.writeFile(tempPath, base64String, 'base64');

    console.log('✅ Skia filter applied successfully:', tempPath);
    return tempPath;
  } catch (error) {
    console.error('❌ Skia filter application failed:', error);
    return photoUri; // Return original URI if filtering fails
  }
};
