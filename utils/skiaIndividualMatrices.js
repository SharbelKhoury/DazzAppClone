/**
 * Individual Skia Color Matrices for Each Filter
 * Based on the original and filtered photo pairs shared yesterday
 * These are hardcoded matrices specifically tuned for each filter effect
 */

export const skiaIndividualMatrices = {
  // ORIGINAL - Clean digital look (no effects)
  original: [
    1.0,
    0.0,
    0.0,
    0,
    0, // Red channel: unchanged
    0.0,
    1.0,
    0.0,
    0,
    0, // Green channel: unchanged
    0.0,
    0.0,
    1.0,
    0,
    0, // Blue channel: unchanged
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // GR DR - High contrast definition enhancement with shadows
  grdr: [
    0.7,
    0,
    0,
    0,
    -0.15, // Red boosted
    0,
    0.65,
    0,
    0,
    -0.2, // Green same
    0,
    0,
    0.6,
    0,
    -0.25, // Blue reduced
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // COLLAGE - Vibrant collage style
  collage: [
    1.2,
    0.1,
    0.0,
    0,
    0.2, // Red channel: boosted red, slight green, high brightness
    0.1,
    1.2,
    0.1,
    0,
    0.2, // Green channel: boosted green, slight red/blue, high brightness
    0.0,
    0.1,
    1.2,
    0,
    0.2, // Blue channel: boosted blue, slight green, high brightness
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // PULI - Bright vibrant enhancement
  puli: [
    0.8,
    0.0,
    0.0,
    0,
    0, // Red darker
    0.0,
    0.8,
    0.0,
    0,
    0, // Green darker
    0.0,
    0.0,
    0.8,
    0,
    0, // Blue darker
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // FXN - Dramatic cool vintage look with enhanced shadows
  fxn: [
    0.6,
    0.2,
    0.2,
    0,
    -0.25, // Red channel: reduced red, cool tint, enhanced shadow
    0.2,
    0.6,
    0.2,
    0,
    -0.25, // Green channel: reduced green, cool tint, enhanced shadow
    0.2,
    0.2,
    0.6,
    0,
    -0.25, // Blue channel: reduced blue, cool tint, enhanced shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],
  fqsr: [
    0.27,
    0,
    0,
    0,
    -0.05, // Red darker, deeper blacks
    0,
    0.27,
    0,
    0,
    -0.05, // Green
    0,
    0,
    0.27,
    0,
    -0.05, // Blue
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],
  // FXN R - Film grain simulation with enhanced shadows
  fxnr: [
    0.7,
    0.15,
    0.15,
    0,
    -0.2, // Red channel: reduced red, slight grain effect, enhanced shadow
    0.15,
    0.7,
    0.15,
    0,
    -0.2, // Green channel: reduced green, slight grain effect, enhanced shadow
    0.15,
    0.15,
    0.7,
    0,
    -0.2, // Blue channel: reduced blue, slight grain effect, enhanced shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // DQS - Digital quality enhancement
  dqs: [
    1.1,
    0.0,
    0.0,
    0,
    0.0, // Red channel: slight boost, no other contributions
    0.0,
    1.1,
    0.0,
    0,
    0.0, // Green channel: slight boost, no other contributions
    0.0,
    0.0,
    1.1,
    0,
    0.0, // Blue channel: slight boost, no other contributions
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // DCLASSIC - Digital classic look with vivid colors and more darkness
  colorful: [
    1.8,
    -0.5,
    -0.5,
    0,
    -0.9775, // Red (-0.85 × 1.15 ≈ -0.9775)
    -0.5,
    1.8,
    -0.5,
    0,
    -0.9775, // Green
    -0.5,
    -0.5,
    1.8,
    0,
    -0.9775, // Blue
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],
  dclassic: [
    1.0,
    0.0,
    0.0,
    0,
    0, // Red channel: unchanged
    0.0,
    1.0,
    0.0,
    0,
    0, // Green channel: unchanged
    0.0,
    0.0,
    1.0,
    0,
    0, // Blue channel: unchanged
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // GRF - Pure black and white grain film effect
  grf: [
    0.299,
    0.587,
    0.114,
    0,
    -0.1, // Red channel: luminance weights for pure B&W
    0.299,
    0.587,
    0.114,
    0,
    -0.1, // Green channel: luminance weights for pure B&W
    0.299,
    0.587,
    0.114,
    0,
    -0.1, // Blue channel: luminance weights for pure B&W
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // CT2F - Color to film conversion with shadows
  ct2f: [
    0.85,
    0.075,
    0.075,
    0,
    -0.1, // Red channel: film-like reduction, shadow
    0.075,
    0.85,
    0.075,
    0,
    -0.1, // Green channel: film-like reduction, shadow
    0.075,
    0.075,
    0.85,
    0,
    -0.1, // Blue channel: film-like reduction, shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // D EXP - Expired film look (reduced greenish tint, less brightening, vintage feel)
  dexp: [
    0.9,
    0.05,
    0.05,
    0,
    0.05, // Red channel: less reduced red, minimal green/blue contribution, reduced brightness
    0.05,
    1.05,
    0.05,
    0,
    0.05, // Green channel: less boosted green, minimal red/blue contribution, reduced brightness
    0.05,
    0.05,
    0.95,
    0,
    0.05, // Blue channel: less reduced blue, minimal red/green contribution, reduced brightness
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // D3D - 3D depth effect (very dark, cool blue-green tint)
  d3d: [
    0.65, 0, 0, 0, -0.2, 0, 0.65, 0, 0, -0.2, 0, 0, 0.65, 0, -0.2, 0, 0, 0, 1,
    0,
  ],
  // CCD R - Vintage digital camera look (natural colors, no green tint)
  ccdr: [
    0.75,
    0,
    0,
    0,
    -0.1, // Red higher for warmth
    0,
    0.65,
    0,
    0,
    -0.2, // Green stable
    0,
    0,
    0.55,
    0,
    -0.3, // Blue lower for less coolness
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // NT16 - Neutral tone film (almost invisible, natural)
  nt16: [
    0.6,
    0.01,
    0.01,
    0,
    -0.05, // Red: slightly reduced
    0.01,
    0.65,
    0.01,
    0,
    -0.05, // Green: dominant but subtle
    0.01,
    0.01,
    0.6,
    0,
    -0.05, // Blue: reduced to avoid purple
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // INST C - Instant camera classic (vintage, faded colors, enhanced shadows)
  instc: [
    0.9,
    0.05,
    0.05,
    0,
    -0.2, // Red channel: slightly reduced, minimal other contributions, enhanced shadow
    0.05,
    0.9,
    0.05,
    0,
    -0.2, // Green channel: slightly reduced, minimal other contributions, enhanced shadow
    0.05,
    0.05,
    0.9,
    0,
    -0.2, // Blue channel: slightly reduced, minimal other contributions, enhanced shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // CLASSIC U - Ultra classic look (darker, clean, smooth, enhanced shadows)
  classicu: [
    1.8,
    -0.5,
    -0.5,
    0,
    -0.9775, // Red (-0.85 × 1.15 ≈ -0.9775)
    -0.5,
    1.8,
    -0.5,
    0,
    -0.9775, // Green
    -0.5,
    -0.5,
    1.8,
    0,
    -0.9775, // Blue
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // GOLF - Golf course tones (enhanced greens)
  golf: [
    0.7,
    0,
    0,
    0,
    -0.15, // Red boosted
    0,
    0.65,
    0,
    0,
    -0.2, // Green same
    0,
    0,
    0.6,
    0,
    -0.25, // Blue reduced
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // INFRARED - Infrared effect (warm reddish-pink tint)
  infrared: [
    1.3,
    0.2,
    0.0,
    0,
    0.1, // Red channel: boosted red, slight green contribution
    0.2,
    0.8,
    0.0,
    0,
    0.1, // Green channel: reduced green, slight red contribution
    0.0,
    0.0,
    0.7,
    0,
    0.1, // Blue channel: reduced blue, no other contributions
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // VINTAGE - Vintage film look (warm, slightly desaturated)
  vintage: [
    1.1,
    0.1,
    0.0,
    0,
    0.0, // Red channel: boosted red, slight green contribution
    0.1,
    0.9,
    0.1,
    0,
    0.0, // Green channel: reduced green, slight red/blue contribution
    0.0,
    0.1,
    0.9,
    0,
    0.0, // Blue channel: reduced blue, slight green contribution
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // MONOCHROME - Black and white
  monochrome: [
    0.299,
    0.587,
    0.114,
    0,
    0, // Red channel: luminance weights
    0.299,
    0.587,
    0.114,
    0,
    0, // Green channel: luminance weights
    0.299,
    0.587,
    0.114,
    0,
    0, // Blue channel: luminance weights
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // SEPIA - Sepia tone (warm brownish)
  sepia: [
    0.393,
    0.769,
    0.189,
    0,
    0, // Red channel: sepia weights
    0.349,
    0.686,
    0.168,
    0,
    0, // Green channel: sepia weights
    0.272,
    0.534,
    0.131,
    0,
    0, // Blue channel: sepia weights
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  '135ne': [
    0.84,
    0,
    0,
    0,
    0, // Red: warmer
    0,
    0.76,
    0,
    0,
    0, // Green: slightly darker
    0,
    0,
    0.76,
    0,
    0, // Blue: reduced to remove coolness
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],
  '135sr': [
    0.907,
    0,
    0,
    0,
    0, // Red: reduced 10%
    0,
    0.76,
    0,
    0,
    0, // Green: unchanged
    0,
    0,
    0.667,
    0,
    0, // Blue: slightly increased to reduce warm dominance
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // DFUNS - Digital fun style
  dfuns: [
    0.78,
    0,
    0,
    0,
    -0.1, // Red
    0,
    0.78,
    0,
    0,
    -0.1, // Green
    0,
    0,
    0.78,
    0,
    -0.1, // Blue
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // IR - Infrared effect (warm reddish-pink tint)
  ir: [
    0.944,
    0.115,
    0.0,
    0,
    0.1, // Red unchanged
    0.115,
    0.782,
    0.0,
    0,
    0.115, // Green +15%
    0.0,
    0.0,
    0.667,
    0,
    0.115, // Blue +15%
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // CPM35 - Color Plus 35mm film
  cpm35: [
    0.944,
    0.115,
    0.0,
    0,
    0.1, // Red unchanged
    0.115,
    0.782,
    0.0,
    0,
    0.115, // Green +15%
    0.0,
    0.0,
    0.667,
    0,
    0.115, // Blue +15%
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // DHALF - Digital half tone with shadows
  dhalf: [
    0.9,
    0.05,
    0.05,
    0,
    -0.1, // Red channel: slightly reduced, minimal other contributions, shadow
    0.05,
    0.9,
    0.05,
    0,
    -0.1, // Green channel: slightly reduced, minimal other contributions, shadow
    0.05,
    0.05,
    0.9,
    0,
    -0.1, // Blue channel: slightly reduced, minimal other contributions, shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // DSLIDE - Digital slide film
  dslide: [
    1.0,
    0.0,
    0.0,
    0,
    0, // Red channel: unchanged
    0.0,
    1.0,
    0.0,
    0,
    0, // Green channel: unchanged
    0.0,
    0.0,
    1.0,
    0,
    0, // Blue channel: unchanged
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // SCLASSIC - Super classic with enhanced shadows
  sclassic: [
    0.85,
    0.0,
    0.0,
    0,
    -0.2, // Red channel: reduced red, no other contributions, enhanced shadow
    0.0,
    0.85,
    0.0,
    0,
    -0.2, // Green channel: reduced green, no other contributions, enhanced shadow
    0.0,
    0.0,
    0.85,
    0,
    -0.2, // Blue channel: reduced blue, no other contributions, enhanced shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // HOGA - Hoga film with shadows
  hoga: [
    0.78,
    0,
    0,
    0,
    -0.1, // Red
    0,
    0.78,
    0,
    0,
    -0.1, // Green
    0,
    0,
    0.78,
    0,
    -0.1, // Blue
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  // S67 - Super 67 film
  s67: [
    1.0,
    0.0,
    0.0,
    0,
    0.0, // Red channel: neutral, no other contributions
    0.0,
    1.0,
    0.0,
    0,
    0.0, // Green channel: neutral, no other contributions
    0.0,
    0.0,
    1.0,
    0,
    0.0, // Blue channel: neutral, no other contributions
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // KV88 - Kodak Vision 88
  kv88: [
    0.715,
    0.022,
    0.022,
    0,
    -0.05, // Red: dominant, slightly brighter
    0.022,
    0.66,
    0.022,
    0,
    -0.05, // Green: mid
    0.011,
    0.011,
    0.605,
    0,
    -0.05, // Blue: reduced, avoids cool tones
    0,
    0,
    0,
    1,
    0, // Alpha unchanged
  ],

  brightwarmtest1: [
    1.05,
    0.0,
    0.0,
    0,
    0.0, // Red channel: slight boost, no other contributions
    0.0,
    1.05,
    0.0,
    0,
    0.0, // Green channel: slight boost, no other contributions
    0.0,
    0.0,
    1.05,
    0,
    0.0, // Blue channel: slight boost, no other contributions
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // INSTSQ C - Instant square classic with enhanced shadows
  instsqc: [
    0.85,
    0.05,
    0.05,
    0,
    -0.15, // Red channel: reduced red, minimal other contributions, enhanced shadow
    0.05,
    0.85,
    0.05,
    0,
    -0.15, // Green channel: reduced green, minimal other contributions, enhanced shadow
    0.05,
    0.05,
    0.85,
    0,
    -0.15, // Blue channel: reduced blue, minimal other contributions, enhanced shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],

  // PAFR - Polaroid AF film with shadows
  pafr: [
    0.9,
    0.05,
    0.05,
    0,
    -0.1, // Red channel: slightly reduced, minimal other contributions, shadow
    0.05,
    0.9,
    0.05,
    0,
    -0.1, // Green channel: slightly reduced, minimal other contributions, shadow
    0.05,
    0.05,
    0.9,
    0,
    -0.1, // Blue channel: slightly reduced, minimal other contributions, shadow
    0,
    0,
    0,
    1,
    0, // Alpha channel: unchanged
  ],
};

/**
 * Get individual matrix for a specific filter
 * @param {string} filterId - The filter identifier
 * @returns {Array|null} - The color matrix array or null if not found
 */
export const getIndividualSkiaMatrix = filterId => {
  return skiaIndividualMatrices[filterId] || null;
};

/**
 * Test function to apply individual matrices
 * This can be used to test the matrices before integrating them
 * @param {string} filterId - The filter identifier
 * @param {string} imageUri - The image URI to process
 * @returns {Object} - Test result with matrix and filter info
 */
export const testIndividualMatrix = (filterId, imageUri) => {
  const matrix = getIndividualSkiaMatrix(filterId);

  if (!matrix) {
    return {
      success: false,
      error: `No individual matrix found for filter: ${filterId}`,
      filterId,
      imageUri,
    };
  }

  return {
    success: true,
    filterId,
    imageUri,
    matrix,
    matrixLength: matrix.length,
    description: `Individual matrix for ${filterId} filter`,
  };
};

/**
 * List all available individual matrices
 * @returns {Array} - Array of filter IDs with individual matrices
 */
export const listAvailableIndividualMatrices = () => {
  return Object.keys(skiaIndividualMatrices);
};

/**
 * Get count of available individual matrices
 * @returns {number} - Number of available matrices
 */
export const getIndividualMatrixCount = () => {
  return Object.keys(skiaIndividualMatrices).length;
};

/**
 * Check if a filter has an individual matrix
 * @param {string} filterId - The filter identifier
 * @returns {boolean} - True if matrix exists, false otherwise
 */
export const hasIndividualMatrix = filterId => {
  return filterId in skiaIndividualMatrices;
};

/**
 * Compare individual matrix with calculated matrix
 * @param {string} filterId - The filter identifier
 * @param {Array} calculatedMatrix - The calculated matrix from skiaFilterEffects
 * @returns {Object} - Comparison result
 */
export const compareMatrices = (filterId, calculatedMatrix) => {
  const individualMatrix = getIndividualSkiaMatrix(filterId);

  if (!individualMatrix) {
    return {
      success: false,
      error: `No individual matrix found for filter: ${filterId}`,
    };
  }

  if (
    !calculatedMatrix ||
    calculatedMatrix.length !== individualMatrix.length
  ) {
    return {
      success: false,
      error: 'Matrix length mismatch',
    };
  }

  const differences = individualMatrix.map((val, index) => ({
    index,
    individual: val,
    calculated: calculatedMatrix[index],
    difference: Math.abs(val - calculatedMatrix[index]),
  }));

  const maxDifference = Math.max(...differences.map(d => d.difference));
  const avgDifference =
    differences.reduce((sum, d) => sum + d.difference, 0) / differences.length;

  return {
    success: true,
    filterId,
    maxDifference,
    avgDifference,
    differences,
    recommendation:
      maxDifference > 0.1
        ? 'Consider using individual matrix'
        : 'Matrices are similar',
  };
};
