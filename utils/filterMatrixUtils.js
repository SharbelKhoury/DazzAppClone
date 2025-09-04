// Filter Matrix Utilities for Skia Post-Processing
// Now uses Individual Matrices first, then Skia filter effects system, then hardcoded fallbacks

import {skiaFilterEffects, createSkiaColorMatrix} from './skiaFilterEffects';
import {getIndividualSkiaMatrix} from './skiaIndividualMatrices';

// System configuration - easily switch between matrix systems
export const MATRIX_SYSTEMS = {
  INDIVIDUAL: 'individual', // Individual hardcoded matrices (most precise)
  SKIA: 'skia', // Skia calculated matrices (dynamic)
  HARDCODED: 'hardcoded', // Original hardcoded matrices (fallback)
  AUTO: 'auto', // Auto-select best available (default)
};

// Current system setting - can be changed to force a specific system
let currentMatrixSystem = MATRIX_SYSTEMS.AUTO;

/**
 * Get the correct color matrix for each filter using Individual Matrices first, then Skia system, then hardcoded fallbacks
 * @param {string} filterId - The filter identifier
 * @param {Object} openglFilterEffects - The OpenGL filter effects configuration (fallback)
 * @param {Function} createColorMatrixFromFilter - Fallback function for creating color matrix
 * @returns {Array} - Color matrix array for Skia processing
 */
export const getFilterMatrix = (
  filterId,
  openglFilterEffects,
  createColorMatrixFromFilter,
) => {
  // Use specific system if set, otherwise use AUTO (best available)
  if (currentMatrixSystem === MATRIX_SYSTEMS.INDIVIDUAL) {
    const individualMatrix = getIndividualSkiaMatrix(filterId);
    if (individualMatrix) {
      console.log('🎨 Using Individual Matrix for:', filterId);
      return individualMatrix;
    }
  } else if (currentMatrixSystem === MATRIX_SYSTEMS.SKIA) {
    const skiaFilterConfig = skiaFilterEffects[filterId];
    if (skiaFilterConfig && skiaFilterConfig.effects) {
      console.log('🎨 Using Skia filter effects for:', filterId);
      const skiaMatrix = createSkiaColorMatrix(skiaFilterConfig.effects);
      if (skiaMatrix) {
        return skiaMatrix;
      }
    }
  } else if (currentMatrixSystem === MATRIX_SYSTEMS.HARDCODED) {
    // Skip to hardcoded matrices directly
  } else {
    // AUTO mode: Try Individual first, then Skia, then hardcoded
    // FIRST: Try to use Individual Matrices (most precise, hand-tuned)
    const individualMatrix = getIndividualSkiaMatrix(filterId);
    if (individualMatrix) {
      console.log('🎨 Using Individual Matrix for:', filterId);
      return individualMatrix;
    }

    // SECOND: Try to use the Skia filter effects system (calculated)
    const skiaFilterConfig = skiaFilterEffects[filterId];
    if (skiaFilterConfig && skiaFilterConfig.effects) {
      console.log('🎨 Using Skia filter effects for:', filterId);
      const skiaMatrix = createSkiaColorMatrix(skiaFilterConfig.effects);
      if (skiaMatrix) {
        return skiaMatrix;
      }
    }
  }

  // THIRD: Fallback to hardcoded matrices for filters not in Individual or Skia systems
  console.log('🎨 Using hardcoded matrix for:', filterId);
  // VIDEO FILTERS
  if (filterId === 'vclassic') {
    // Vintage classic video look - warm, slightly desaturated
    return [
      1.1, 0.1, 0.1, 0, 0, 0.1, 0.9, 0.1, 0, 0, 0.1, 0.1, 0.8, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'originalv') {
    // Original video - clean, slightly enhanced
    return [
      1.05, 0.05, 0.05, 0, 0, 0.05, 1.05, 0.05, 0, 0, 0.05, 0.05, 1.05, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'dam') {
    // DAM filter - dramatic, high contrast
    return [1.3, 0, 0, 0, 0, 0, 0.8, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 1, 0];
  }

  if (filterId === '16mm') {
    // 16mm film look - warm, grainy
    return [
      1.2, 0.1, 0.05, 0, 0, 0.05, 0.9, 0.1, 0, 0, 0.05, 0.1, 0.8, 0, 0, 0, 0, 0,
      1, 0,
    ];
  }

  if (filterId === '8mm') {
    // 8mm film look - vintage, faded
    return [
      1.1, 0.15, 0.1, 0, 0, 0.1, 0.85, 0.15, 0, 0, 0.1, 0.15, 0.75, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'vhs') {
    // VHS look - retro, slightly distorted
    return [
      1.15, 0.1, 0.05, 0, 0, 0.05, 0.95, 0.1, 0, 0, 0.05, 0.1, 0.85, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'kino') {
    // Kino filter - cinematic, moody
    return [
      1.25, 0, 0, 0, 0, 0, 0.85, 0, 0, 0, 0, 0, 0.75, 0, 0, 0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'instss') {
    // Inst SS - instant film look
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 1.05, 0.1, 0, 0, 0.05, 0.1, 0.9, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'dcr') {
    // DCR - digital camera look
    return [
      1.05, 0.05, 0.05, 0, 0, 0.05, 1.05, 0.05, 0, 0, 0.05, 0.05, 1.05, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  // DIGITAL FILTERS
  if (filterId === 'original') {
    // Original - clean, no filter
    return [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
  }

  if (filterId === 'grdr') {
    // GR DR - high contrast definition enhancement
    return [
      1.6, 0.1, 0.1, 0, 0.05, 0.1, 1.6, 0.1, 0, 0.05, 0.1, 0.1, 1.6, 0, 0.05, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'ccdr') {
    // CCD R - vintage digital camera look with natural colors (no green tint)
    return [
      1.1, 0.05, 0.05, 0, 0.05, 0.05, 1.1, 0.05, 0, 0.05, 0.05, 0.05, 1.1, 0,
      0.05, 0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'collage') {
    // Collage - artistic, vibrant
    return [
      1.2, 0.1, 0.1, 0, 0, 0.1, 1.2, 0.1, 0, 0, 0.1, 0.1, 1.2, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'puli') {
    // Puli - bright vibrant enhancement with warm hue
    return [
      1.4, 0.1, 0.1, 0, 0.25, 0.1, 1.3, 0.1, 0, 0.25, 0.1, 0.1, 1.4, 0, 0.25, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'fxnr') {
    // FQS R - film grain simulation with warm vintage tones
    return [
      0.4, 0.2, 0.2, 0, -0.2, 0.2, 0.4, 0.2, 0, -0.2, 0.2, 0.2, 0.4, 0, -0.2, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'fxn') {
    // FXN - dramatic cool vintage look with strong blue-green tint
    return [
      0.3, 0.2, 0.2, 0, -0.3, 0.2, 0.3, 0.2, 0, -0.3, 0.2, 0.2, 0.3, 0, -0.3, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'dqs') {
    // DQS - digital quality enhancement
    return [
      1.3, 0.1, 0.1, 0, 0.1, 0.1, 1.2, 0.1, 0, 0.1, 0.1, 0.1, 1.3, 0, 0.1, 0, 0,
      0, 1, 0,
    ];
  }

  // VINTAGE 135 FILTERS
  if (filterId === 'dclassic') {
    // D Classic - classic vintage look with warm hue
    return [
      0.7, 0.15, 0.15, 0, -0.15, 0.15, 0.7, 0.15, 0, -0.15, 0.15, 0.15, 0.7, 0,
      -0.15, 0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'grf') {
    // GR F - black and white (grayscale)
    return [
      0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114,
      0, 0, 0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'ct2f') {
    // CT2F - cool vintage tones with strong blue-green tint
    return [
      0.3, 0.2, 0.2, 0, -0.3, 0.2, 0.3, 0.2, 0, -0.3, 0.2, 0.2, 0.3, 0, -0.3, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'dexp') {
    // D Exp - expired film look with greenish tint
    return [
      0.8, 0.1, 0.1, 0, 0, 0.1, 1.1, 0.1, 0, 0, 0.1, 0.1, 0.9, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'nt16') {
    // NT16 - neutral tone film with natural colors (almost invisible)
    return [
      1.02, 0.01, 0.01, 0, 0.02, 0.01, 1.02, 0.01, 0, 0.02, 0.01, 0.01, 1.02, 0,
      0.02, 0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'd3d') {
    // D3D - 3D depth effect with cool blue-green tint (very dark with high contrast)
    return [
      0.1, 0.05, 0.05, 0, -0.6, 0.05, 0.1, 0.05, 0, -0.6, 0.05, 0.05, 0.1, 0,
      -0.6, 0, 0, 0, 1, 0,
    ];
  }

  if (filterId === '135ne') {
    // 135 NE - natural exposure with slight warm hue
    return [
      1.3, 0.1, 0.1, 0, 0.15, 0.1, 1.15, 0.1, 0, 0.15, 0.1, 0.1, 1.3, 0, 0.15,
      0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'dfuns') {
    // D FunS - fun saturated look with cool blue-green tint
    return [
      0.3, 0.2, 0.2, 0, -0.25, 0.2, 0.3, 0.2, 0, -0.25, 0.2, 0.2, 0.3, 0, -0.25,
      0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'ir') {
    // IR - infrared effect with warm reddish-pink tint
    return [
      0.4, 0.2, 0.2, 0, -0.2, 0.2, 0.4, 0.2, 0, -0.2, 0.2, 0.2, 0.4, 0, -0.2, 0,
      0, 0, 1, 0,
    ];
  }

  // classicu filter now uses Skia system only - no hardcoded matrix needed

  if (filterId === 'golf') {
    // Golf - golf course tones with cool blue-green tint
    return [
      0.4, 0.2, 0.2, 0, -0.25, 0.2, 0.4, 0.2, 0, -0.25, 0.2, 0.2, 0.4, 0, -0.25,
      0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'cpm35') {
    // CPM35 - 35mm film simulation with warm sepia tint
    return [
      0.6, 0.2, 0.2, 0, -0.15, 0.2, 0.6, 0.2, 0, -0.15, 0.2, 0.2, 0.6, 0, -0.15,
      0, 0, 0, 1, 0,
    ];
  }

  if (filterId === '135sr') {
    // 135 SR - super resolution with cool blue-green tint
    return [
      0.3, 0.2, 0.2, 0, -0.1, 0.2, 0.3, 0.2, 0, -0.1, 0.2, 0.2, 0.3, 0, -0.1, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'dhalf') {
    // D Half - half frame effect with slight warm hue
    return [
      1.3, 0.1, 0.1, 0, 0.15, 0.1, 0.9, 0.1, 0, 0.15, 0.1, 0.1, 1.3, 0, 0.15, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'dslide') {
    // D Slide - slide film look with warm hue
    return [
      1.5, 0.1, 0.1, 0, 0.25, 0.1, 1.6, 0.1, 0, 0.25, 0.1, 0.1, 1.5, 0, 0.25, 0,
      0, 0, 1, 0,
    ];
  }

  // VINTAGE 120 FILTERS
  if (filterId === 'sclassic') {
    // S Classic - square format classic with cool blue-green tint
    return [
      0.5, 0.2, 0.2, 0, -0.2, 0.2, 0.5, 0.2, 0, -0.2, 0.2, 0.2, 0.5, 0, -0.2, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'hoga') {
    // HOGA - holographic effect with warm hue
    return [
      1.5, 0.1, 0.1, 0, 0.15, 0.1, 1.3, 0.1, 0, 0.15, 0.1, 0.1, 1.5, 0, 0.15, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 's67') {
    // S 67 - 6x7 format with cool blue-green tint
    return [
      0.4, 0.2, 0.2, 0, -0.25, 0.2, 0.4, 0.2, 0, -0.25, 0.2, 0.2, 0.4, 0, -0.25,
      0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'kv88') {
    // KV88 - Kodak vision 88 with cool blue-green tint
    return [
      0.4, 0.2, 0.2, 0, 0.4, 0.2, 0.4, 0.2, 0, 0.4, 0.2, 0.2, 0.4, 0, 0.4, 0, 0,
      0, 1, 0,
    ];
  }

  // INST COLLECTION FILTERS
  // instc filter now uses Skia system only - no hardcoded matrix needed

  if (filterId === 'instsqc') {
    // Inst SQC - square instant camera with warm hue
    return [
      0.9, 0.1, 0.1, 0, -0.05, 0.1, 0.9, 0.1, 0, -0.05, 0.1, 0.1, 0.9, 0, -0.05,
      0, 0, 0, 1, 0,
    ];
  }

  if (filterId === 'pafr') {
    // PAF R - Polaroid AF look with natural balance
    return [
      1.3, 0.1, 0.1, 0, 0.05, 0.1, 0.8, 0.1, 0, 0.05, 0.1, 0.1, 1.3, 0, 0.05, 0,
      0, 0, 1, 0,
    ];
  }

  // ACCESSORY FILTERS
  if (filterId === 'ndfilter') {
    // ND Filter - neutral density (darker)
    return [0.7, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 1, 0];
  }

  if (filterId === 'fisheyef') {
    // Fisheye F - fisheye effect
    return [
      1.2, 0.1, 0.05, 0, 0, 0.05, 1.1, 0.1, 0, 0, 0.05, 0.1, 1.2, 0, 0, 0, 0, 0,
      1, 0,
    ];
  }

  if (filterId === 'fisheyew') {
    // Fisheye W - wide fisheye
    return [
      1.15, 0.1, 0.05, 0, 0, 0.05, 1.2, 0.1, 0, 0, 0.05, 0.1, 1.15, 0, 0, 0, 0,
      1, 0,
    ];
  }

  if (filterId === 'prism') {
    // Prism - prismatic effect
    return [
      1.1, 0.2, 0.1, 0, 0, 0.1, 0.8, 0.3, 0, 0, 0.1, 0.2, 0.9, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'flashc') {
    // Flash C - flash effect
    return [
      1.2, 0.1, 0.1, 0, 0, 0.1, 1.2, 0.1, 0, 0, 0.1, 0.1, 1.2, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'star') {
    // Star - star filter effect
    return [
      1.3, 0.1, 0.1, 0, 0, 0.1, 1.3, 0.1, 0, 0, 0.1, 0.1, 1.3, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  // Fallback: Use the original createColorMatrixFromFilter function
  const filterConfig = openglFilterEffects[filterId];
  return createColorMatrixFromFilter(filterConfig);
};

/**
 * Set the matrix system to use
 * @param {string} system - The system to use (MATRIX_SYSTEMS.INDIVIDUAL, SKIA, HARDCODED, or AUTO)
 */
export const setMatrixSystem = system => {
  if (Object.values(MATRIX_SYSTEMS).includes(system)) {
    currentMatrixSystem = system;
    console.log('🎨 Matrix system set to:', system);
  } else {
    console.warn('🎨 Invalid matrix system:', system);
  }
};

/**
 * Get the current matrix system
 * @returns {string} - Current matrix system
 */
export const getMatrixSystem = () => {
  return currentMatrixSystem;
};

/**
 * Get matrix using specific system (bypasses current system setting)
 * @param {string} filterId - The filter identifier
 * @param {string} system - The system to use
 * @returns {Array} - Color matrix array
 */
export const getFilterMatrixBySystem = (filterId, system) => {
  const originalSystem = currentMatrixSystem;
  currentMatrixSystem = system;
  const matrix = getFilterMatrix(filterId, {}, () => []);
  currentMatrixSystem = originalSystem;
  return matrix;
};

/**
 * Compare matrices from different systems for a filter
 * @param {string} filterId - The filter identifier
 * @returns {Object} - Comparison results
 */
export const compareMatrixSystems = filterId => {
  const results = {};

  // Get matrix from each system
  results.individual = getFilterMatrixBySystem(
    filterId,
    MATRIX_SYSTEMS.INDIVIDUAL,
  );
  results.skia = getFilterMatrixBySystem(filterId, MATRIX_SYSTEMS.SKIA);
  results.hardcoded = getFilterMatrixBySystem(
    filterId,
    MATRIX_SYSTEMS.HARDCODED,
  );

  return {
    filterId,
    systems: results,
    available: {
      individual: results.individual !== null,
      skia: results.skia !== null,
      hardcoded: results.hardcoded !== null,
    },
  };
};
