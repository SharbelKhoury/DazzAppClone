// DeepAR Filter Effects Configuration
// This file maps our filter IDs to DeepAR effects

export const deepARFilterEffects = {
  // DIGITAL CAMERAS
  original: {
    name: 'Original',
    effect: null, // No effect
    description: 'Clean digital camera look',
  },
  grdr: {
    name: 'GR Digital',
    effect: 'grayscale',
    intensity: 0.8,
    description: 'Ricoh GR Digital look',
  },
  ccdr: {
    name: 'CCD Digital',
    effect: 'vintage',
    intensity: 0.6,
    description: 'CCD sensor look',
  },
  collage: {
    name: 'Collage',
    effect: 'split',
    intensity: 0.5,
    description: 'Split screen effect',
  },
  puli: {
    name: 'Polaroid',
    effect: 'polaroid',
    intensity: 0.7,
    description: 'Polaroid instant camera look',
  },
  fxnr: {
    name: 'Fuji X',
    effect: 'fuji',
    intensity: 0.6,
    description: 'Fuji X-series look',
  },

  // VIDEO CAMERAS
  vclassic: {
    name: 'Video Classic',
    effect: 'vintage_video',
    intensity: 0.8,
    description: 'Classic video camera look',
  },
  originalv: {
    name: 'Original Video',
    effect: null,
    description: 'Clean video look',
  },
  dam: {
    name: 'Digital Art',
    effect: 'artistic',
    intensity: 0.7,
    description: 'Digital art effect',
  },
  '16mm': {
    name: '16mm Film',
    effect: 'film_16mm',
    intensity: 0.9,
    description: '16mm film look',
  },
  '8mm': {
    name: '8mm Film',
    effect: 'film_8mm',
    intensity: 0.9,
    description: '8mm film look',
  },
  vhs: {
    name: 'VHS',
    effect: 'vhs',
    intensity: 0.8,
    description: 'VHS tape look',
  },
  kino: {
    name: 'Cinematic',
    effect: 'cinematic',
    intensity: 0.7,
    description: 'Cinematic look',
  },
  instss: {
    name: 'Instant Square',
    effect: 'instant_square',
    intensity: 0.6,
    description: 'Instant square format',
  },
  vfuns: {
    name: 'Video Fun',
    effect: 'fun_video',
    intensity: 0.5,
    description: 'Fun video effect',
  },
  dcr: {
    name: 'Digital CR',
    effect: 'digital_cr',
    intensity: 0.6,
    description: 'Digital CR look',
  },
  glow: {
    name: 'Glow',
    effect: 'glow',
    intensity: 0.7,
    description: 'Glowing effect',
  },
  slidep: {
    name: 'Slide Projector',
    effect: 'slide_projector',
    intensity: 0.8,
    description: 'Slide projector look',
  },

  // VINTAGE 120
  sclassic: {
    name: 'Square Classic',
    effect: 'square_classic',
    intensity: 0.8,
    description: 'Classic square format',
  },
  hoga: {
    name: 'Holographic',
    effect: 'holographic',
    intensity: 0.6,
    description: 'Holographic effect',
  },
  s67: {
    name: 'Square 6x7',
    effect: 'square_67',
    intensity: 0.7,
    description: '6x7 square format',
  },
  kv88: {
    name: 'Kiev 88',
    effect: 'kiev_88',
    intensity: 0.8,
    description: 'Kiev 88 look',
  },

  // INST COLLECTION
  instc: {
    name: 'Instant Classic',
    effect: 'instant_classic',
    intensity: 0.7,
    description: 'Classic instant look',
  },
  instsq: {
    name: 'Instant Square',
    effect: 'instant_square',
    intensity: 0.6,
    description: 'Instant square format',
  },
  instsqc: {
    name: 'Instant Square Color',
    effect: 'instant_square_color',
    intensity: 0.6,
    description: 'Color instant square',
  },
  pafr: {
    name: 'Polaroid AF',
    effect: 'polaroid_af',
    intensity: 0.7,
    description: 'Polaroid AF look',
  },

  // VINTAGE 135
  dclassic: {
    name: 'Digital Classic',
    effect: 'digital_classic',
    intensity: 0.6,
    description: 'Digital classic look',
  },
  grf: {
    name: 'GR Film',
    effect: 'pure_black_white', // Special effect for pure black and white
    intensity: 1.0,
    description: 'Pure black and white film look',
  },
  ct2f: {
    name: 'Contax T2',
    effect: 'contax_t2',
    intensity: 0.7,
    description: 'Contax T2 look',
  },
  dexp: {
    name: 'Digital Expired',
    effect: 'expired_film',
    intensity: 0.8,
    description: 'Expired film look',
  },
  nt16: {
    name: 'Negative 16',
    effect: 'negative_16',
    intensity: 0.9,
    description: '16mm negative look',
  },
  d3d: {
    name: 'Digital 3D',
    effect: '3d_effect',
    intensity: 0.6,
    description: '3D effect',
  },
  '135ne': {
    name: '135 Negative',
    effect: '135_negative',
    intensity: 0.8,
    description: '135 negative look',
  },
  dfuns: {
    name: 'Digital Fun',
    effect: 'digital_fun',
    intensity: 0.5,
    description: 'Fun digital effect',
  },
  ir: {
    name: 'Infrared',
    effect: 'infrared',
    intensity: 0.8,
    description: 'Infrared effect',
  },
  classicu: {
    name: 'Classic Ultra',
    effect: 'classic_ultra',
    intensity: 0.7,
    description: 'Ultra classic look',
  },
  dqs: {
    name: 'Digital QS',
    effect: 'digital_qs',
    intensity: 0.6,
    description: 'Digital QS look',
  },
  fqsr: {
    name: 'Fuji QS',
    effect: 'fuji_qs',
    intensity: 0.7,
    description: 'Fuji QS look',
  },
  golf: {
    name: 'Golf',
    effect: 'golf',
    intensity: 0.5,
    description: 'Golf effect',
  },
  cpm35: {
    name: 'CPM 35',
    effect: 'cpm_35',
    intensity: 0.6,
    description: 'CPM 35 look',
  },
  '135sr': {
    name: '135 SR',
    effect: '135_sr',
    intensity: 0.7,
    description: '135 SR look',
  },
  dhalf: {
    name: 'Digital Half',
    effect: 'digital_half',
    intensity: 0.6,
    description: 'Half frame digital',
  },
  dslide: {
    name: 'Digital Slide',
    effect: 'digital_slide',
    intensity: 0.7,
    description: 'Digital slide look',
  },

  // ACCESSORY
  ndfilter: {
    name: 'ND Filter',
    effect: 'nd_filter',
    intensity: 0.5,
    description: 'Neutral density filter',
  },
  fisheyef: {
    name: 'Fisheye Front',
    effect: 'fisheye_front',
    intensity: 0.8,
    description: 'Front fisheye lens',
  },
  fisheyew: {
    name: 'Fisheye Wide',
    effect: 'fisheye_wide',
    intensity: 0.8,
    description: 'Wide fisheye lens',
  },
  prism: {
    name: 'Prism',
    effect: 'prism',
    intensity: 0.6,
    description: 'Prism effect',
  },
  flashc: {
    name: 'Flash Color',
    effect: 'flash_color',
    intensity: 0.7,
    description: 'Color flash effect',
  },
  star: {
    name: 'Star',
    effect: 'star',
    intensity: 0.5,
    description: 'Star effect',
  },
};

// Function to get DeepAR effect configuration
export const getDeepAREffect = filterId => {
  return deepARFilterEffects[filterId] || null;
};

// Import DeepAR
let DeepARView, CameraModule;
try {
  const DeepAR = require('react-native-deepar');
  DeepARView = DeepAR.default;
  CameraModule = DeepAR.Camera;
  console.log('✅ DeepAR imported successfully');
} catch (error) {
  console.log('❌ DeepAR import failed:', error);
  DeepARView = null;
  CameraModule = null;
}

// Function to apply DeepAR effect to image
export const applyDeepAREffect = async (imageUri, filterId) => {
  const effect = getDeepAREffect(filterId);

  if (!effect || !effect.effect) {
    return imageUri; // Return original if no effect
  }

  if (!CameraModule) {
    console.log('❌ DeepAR not available, returning original image');
    return imageUri;
  }

  try {
    console.log(`🎨 DeepAR: Applying ${effect.effect} effect to ${filterId}`);

    // Use DeepAR CameraModule to apply effects
    if (CameraModule) {
      // DeepAR effects not implemented yet - return original image
      console.log('🎨 DeepAR effects not implemented yet');
      return imageUri;
    }

    console.log('✅ DeepAR effect processing completed');
    return imageUri;
  } catch (error) {
    console.error('❌ DeepAR effect application failed:', error);
    return imageUri; // Return original on error
  }
};

// Special function for GR F pure black and white
export const applyGRFBlackAndWhite = async imageUri => {
  console.log('🎨 DeepAR: Applying pure black and white for GR F');

  // This would use DeepAR's grayscale filter with maximum intensity
  // For now, return original (will be processed by ImageManipulator)
  return imageUri;
};
