/**
 * LUT Loader for Filter Management
 * Handles loading of large LUT files efficiently with caching to avoid build issues
 */

import {Skia} from '@shopify/react-native-skia';

// Cache for LUT data and Skia images
const lutCache = new Map();
const skiaImageCache = new Map();
const shaderCache = new Map();

// Pre-compiled shader for LUT processing
const LUT_SHADER_CODE = `
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
`;

/**
 * Initialize LUT cache at app startup
 * Loads all LUT files and pre-compiles Skia images and shaders
 */
export const initializeLUTCache = async () => {
  console.log('🚀 Initializing LUT cache...');
  const startTime = Date.now();

  try {
    // Pre-compile the shader
    const shader = Skia.RuntimeEffect.Make(LUT_SHADER_CODE);
    if (shader) {
      shaderCache.set('lut_shader', shader);
      console.log('✅ LUT shader pre-compiled successfully');
    }

    // List of all LUT filters to pre-load
    const lutFilters = [
      'grf',
      'ir',
      'dexp',
      'dfuns',
      'cpm35',
      'classicu',
      'grdr',
      'nt16',
      'dclassic',
      'ccdr',
      'puli',
      'fqsr',
    ];

    // Load all LUTs in parallel
    const loadPromises = lutFilters.map(async filterId => {
      try {
        const lutBase64 = await loadLUTFromFile(filterId);
        if (lutBase64) {
          // Cache the base64 data
          lutCache.set(filterId, lutBase64);

          // Pre-compile Skia image
          const lutData = Skia.Data.fromBase64(lutBase64);
          const lutImage = Skia.Image.MakeImageFromEncoded(lutData);
          if (lutImage) {
            skiaImageCache.set(filterId, lutImage);
            console.log(`✅ Cached LUT for ${filterId}`);
          }
        }
      } catch (error) {
        console.error(`❌ Failed to cache LUT for ${filterId}:`, error);
      }
    });

    await Promise.all(loadPromises);

    const endTime = Date.now();
    console.log(
      `🎉 LUT cache initialization completed in ${endTime - startTime}ms`,
    );
    console.log(
      `📊 Cached ${lutCache.size} LUTs and ${skiaImageCache.size} Skia images`,
    );
  } catch (error) {
    console.error('❌ Failed to initialize LUT cache:', error);
  }
};

/**
 * Load LUT from file (original dynamic import method)
 */
const loadLUTFromFile = async filterId => {
  try {
    let lutBase64;

    switch (filterId) {
      case 'grf':
        const grfModule = await import('../filtersLUT/grf');
        lutBase64 = grfModule.base64;
        break;
      case 'ir':
        const irModule = await import('../filtersLUT/ir');
        lutBase64 = irModule.base64;
        break;
      case 'dexp':
        const dexpModule = await import('../filtersLUT/dexp');
        lutBase64 = dexpModule.base64;
        break;
      case 'dfuns':
        const dfunsModule = await import('../filtersLUT/dfuns');
        lutBase64 = dfunsModule.base64;
        break;
      case 'cpm35':
        const cpm35Module = await import('../filtersLUT/cpm35');
        lutBase64 = cpm35Module.base64;
        break;
      case 'classicu':
        const classicuModule = await import('../filtersLUT/classicu');
        lutBase64 = classicuModule.base64;
        break;
      case 'grdr':
        const grdrModule = await import('../filtersLUT/grdr');
        lutBase64 = grdrModule.base64;
        break;
      case 'nt16':
        const nt16Module = await import('../filtersLUT/nt16');
        lutBase64 = nt16Module.base64;
        break;
      case 'dclassic':
        const dclassicModule = await import('../filtersLUT/dclassic');
        lutBase64 = dclassicModule.base64;
        break;
      case 'ccdr':
        const ccdrModule = await import('../filtersLUT/ccdr');
        lutBase64 = ccdrModule.base64;
        break;
      case 'puli':
        const puliModule = await import('../filtersLUT/puli');
        lutBase64 = puliModule.base64;
        break;
      case 'fqsr':
        const fqsrModule = await import('../filtersLUT/fqsr');
        lutBase64 = fqsrModule.base64;
        break;
      default:
        throw new Error(`No LUT found for filter: ${filterId}`);
    }

    return lutBase64;
  } catch (error) {
    console.error('❌ Failed to load LUT for filter:', filterId, error);
    return null;
  }
};

/**
 * Get cached LUT base64 data
 */
export const getCachedLUT = filterId => {
  return lutCache.get(filterId);
};

/**
 * Get cached Skia image for LUT
 */
export const getCachedLUTImage = filterId => {
  return skiaImageCache.get(filterId);
};

/**
 * Get cached shader
 */
export const getCachedShader = () => {
  return shaderCache.get('lut_shader');
};

/**
 * Legacy loadLUT function - now uses cache
 * @deprecated Use getCachedLUT instead for better performance
 */
export const loadLUT = async filterId => {
  // Try cache first
  const cachedLUT = getCachedLUT(filterId);
  if (cachedLUT) {
    console.log(`⚡ Using cached LUT for ${filterId}`);
    return cachedLUT;
  }

  // Fallback to dynamic import if not cached
  console.log(`⚠️ LUT not cached for ${filterId}, loading dynamically...`);
  return await loadLUTFromFile(filterId);
};

/**
 * Clear LUT cache (useful for memory management)
 */
export const clearLUTCache = () => {
  lutCache.clear();
  skiaImageCache.clear();
  shaderCache.clear();
  console.log('🧹 LUT cache cleared');
};

/**
 * Get cache statistics
 */
export const getCacheStats = () => {
  return {
    lutCount: lutCache.size,
    imageCount: skiaImageCache.size,
    shaderCount: shaderCache.size,
    memoryUsage: 'N/A', // Could implement memory tracking if needed
  };
};
