// Filter Matrix Utilities for Skia Post-Processing
// Contains color matrix configurations for all camera filters

/**
 * Get the correct color matrix for each filter
 * @param {string} filterId - The filter identifier
 * @param {Object} openglFilterEffects - The OpenGL filter effects configuration
 * @param {Function} createColorMatrixFromFilter - Fallback function for creating color matrix
 * @returns {Array} - Color matrix array for Skia processing
 */
export const getFilterMatrix = (
  filterId,
  openglFilterEffects,
  createColorMatrixFromFilter,
) => {
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
    // GRD R - digital GR look
    return [
      1.1, 0.05, 0.05, 0, 0, 0.05, 1.05, 0.05, 0, 0, 0.05, 0.05, 1.1, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'ccdr') {
    // CCD R - CCD sensor look
    return [
      1.15, 0.05, 0.05, 0, 0, 0.05, 1.1, 0.05, 0, 0, 0.05, 0.05, 1.15, 0, 0, 0,
      0, 0, 1, 0,
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
    // Puli - unique color treatment
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 1.05, 0.1, 0, 0, 0.05, 0.1, 0.95, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'fxnr') {
    // FXN R - experimental look
    return [
      1.25, 0.05, 0.05, 0, 0, 0.05, 0.9, 0.05, 0, 0, 0.05, 0.05, 1.15, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  // VINTAGE 135 FILTERS
  if (filterId === 'dclassic') {
    // D Classic - vintage classic
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 0.95, 0.1, 0, 0, 0.05, 0.1, 0.85, 0, 0, 0, 0,
      0, 1, 0,
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
    // CT2F - cool tone
    return [
      0.9, 0.1, 0.1, 0, 0, 0.1, 1.1, 0.1, 0, 0, 0.1, 0.1, 1.2, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'dexp') {
    // D Exp - experimental
    return [
      1.2, 0.05, 0.05, 0, 0, 0.05, 0.85, 0.05, 0, 0, 0.05, 0.05, 1.15, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'nt16') {
    // NT16 - neutral tone
    return [
      1.05, 0.05, 0.05, 0, 0, 0.05, 1.05, 0.05, 0, 0, 0.05, 0.05, 1.05, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'd3d') {
    // D3D - 3D effect
    return [
      1.15, 0.1, 0.05, 0, 0, 0.05, 1.1, 0.1, 0, 0, 0.05, 0.1, 1.15, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === '135ne') {
    // 135 NE - negative effect
    return [
      0.2, 0.8, 0.8, 0, 0, 0.8, 0.2, 0.8, 0, 0, 0.8, 0.8, 0.2, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'dfuns') {
    // D FunS - fun, vibrant
    return [
      1.3, 0.1, 0.1, 0, 0, 0.1, 1.3, 0.1, 0, 0, 0.1, 0.1, 1.3, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'ir') {
    // IR - infrared effect
    return [
      0.5, 0.5, 0.5, 0, 0, 0.5, 0.5, 0.5, 0, 0, 0.5, 0.5, 0.5, 0, 0, 0, 0, 0, 1,
      0,
    ];
  }

  if (filterId === 'classicu') {
    // Classic U - universal classic
    return [
      1.1, 0.05, 0.05, 0, 0, 0.05, 1.05, 0.05, 0, 0, 0.05, 0.05, 1.1, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'golf') {
    // Golf - sporty look
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 1.15, 0.1, 0, 0, 0.05, 0.1, 0.9, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'cpm35') {
    // CPM35 - compact look
    return [
      1.05, 0.1, 0.05, 0, 0, 0.05, 1.05, 0.1, 0, 0, 0.05, 0.1, 1.05, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === '135sr') {
    // 135 SR - slide reversal
    return [
      1.2, 0.05, 0.05, 0, 0, 0.05, 1.1, 0.05, 0, 0, 0.05, 0.05, 1.2, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'dhalf') {
    // D Half - half frame
    return [
      1.15, 0.05, 0.05, 0, 0, 0.05, 1.15, 0.05, 0, 0, 0.05, 0.05, 1.15, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'dslide') {
    // D Slide - slide film look
    return [
      1.25, 0.05, 0.05, 0, 0, 0.05, 1.2, 0.05, 0, 0, 0.05, 0.05, 1.25, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  // VINTAGE 120 FILTERS
  if (filterId === 'sclassic') {
    // S Classic - square format classic
    return [
      1.1, 0.05, 0.05, 0, 0, 0.05, 1.1, 0.05, 0, 0, 0.05, 0.05, 1.1, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'hoga') {
    // HOGA - medium format look
    return [
      1.15, 0.05, 0.05, 0, 0, 0.05, 1.15, 0.05, 0, 0, 0.05, 0.05, 1.15, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 's67') {
    // S 67 - 6x7 format
    return [
      1.2, 0.05, 0.05, 0, 0, 0.05, 1.2, 0.05, 0, 0, 0.05, 0.05, 1.2, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'kv88') {
    // KV88 - vintage medium format
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 1.05, 0.1, 0, 0, 0.05, 0.1, 0.95, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  // INST COLLECTION FILTERS
  if (filterId === 'instc') {
    // Inst C - instant camera
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 1.05, 0.1, 0, 0, 0.05, 0.1, 0.9, 0, 0, 0, 0,
      0, 1, 0,
    ];
  }

  if (filterId === 'instsqc') {
    // Inst SQC - square instant
    return [
      1.15, 0.05, 0.05, 0, 0, 0.05, 1.15, 0.05, 0, 0, 0.05, 0.05, 1.15, 0, 0, 0,
      0, 0, 1, 0,
    ];
  }

  if (filterId === 'pafr') {
    // PAF R - polaroid look
    return [
      1.1, 0.1, 0.05, 0, 0, 0.05, 1.05, 0.1, 0, 0, 0.05, 0.1, 0.85, 0, 0, 0, 0,
      0, 1, 0,
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
