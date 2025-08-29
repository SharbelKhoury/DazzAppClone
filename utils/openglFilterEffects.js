// ImageFilterKit removed - using OpenGL effects only

// OpenGL-based filter effects for Dazz Cam style filters
export const openglFilterEffects = {
  // DIGITAL SECTION
  original: {
    name: 'Original',
    filters: [
      {name: 'Brightness', value: 0},
      {name: 'Contrast', value: 1.0},
      {name: 'Saturation', value: 1.0},
    ],
    description: 'Clean digital look',
  },

  grdr: {
    name: 'GR DR',
    filters: [
      {name: 'Brightness', value: -0.1},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 0.8},
      {name: 'Gamma', value: 1.1},
    ],
    description: 'High contrast black & white',
  },

  ccdr: {
    name: 'CC DR',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.2},
      {name: 'Hue', value: 5},
    ],
    description: 'Color corrected digital',
  },

  collage: {
    name: 'Collage',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 1.4},
      {name: 'Gamma', value: 0.9},
    ],
    description: 'Vibrant collage style',
  },

  puli: {
    name: 'Puli',
    filters: [
      {name: 'Brightness', value: -0.2},
      {name: 'Contrast', value: 1.5},
      {name: 'Saturation', value: 0.7},
      {name: 'Hue', value: -10},
    ],
    description: 'Moody cinematic look',
  },

  fxnr: {
    name: 'FXN R',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.1},
      {name: 'Gamma', value: 1.05},
    ],
    description: 'Film grain simulation',
  },

  // VINTAGE 135 SECTION
  dclassic: {
    name: 'D Classic',
    filters: [
      {name: 'Brightness', value: -0.1},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 0.9},
      {name: 'Hue', value: 15},
    ],
    description: 'Classic vintage look',
  },

  grf: {
    name: 'GR F',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 0.0}, // TRUE BLACK AND WHITE - NO COLOR
      {name: 'Gamma', value: 1.2},
    ],
    description: 'Black and white film simulation',
  },

  ct2f: {
    name: 'CT2F',
    filters: [
      {name: 'Brightness', value: -0.2},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.1},
      {name: 'Hue', value: 20},
    ],
    description: 'Warm vintage tones',
  },

  dexp: {
    name: 'D Exp',
    filters: [
      {name: 'Brightness', value: 0.3},
      {name: 'Contrast', value: 1.1},
      {name: 'Saturation', value: 1.3},
      {name: 'Gamma', value: 0.8},
    ],
    description: 'Expired film look',
  },

  nt16: {
    name: 'NT16',
    filters: [
      {name: 'Brightness', value: -0.1},
      {name: 'Contrast', value: 1.5},
      {name: 'Saturation', value: 0.7},
      {name: 'Hue', value: -5},
    ],
    description: 'Neutral tone film',
  },

  d3d: {
    name: 'D3D',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 1.2},
      {name: 'Gamma', value: 1.1},
    ],
    description: '3D depth effect',
  },

  '135ne': {
    name: '135 NE',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 1.1},
      {name: 'Hue', value: 10},
    ],
    description: 'Natural exposure',
  },

  dfuns: {
    name: 'D FunS',
    filters: [
      {name: 'Brightness', value: 0.3},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.4},
      {name: 'Gamma', value: 0.9},
    ],
    description: 'Fun saturated look',
  },

  ir: {
    name: 'IR',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.6},
      {name: 'Saturation', value: 0.5},
      {name: 'Hue', value: 180},
    ],
    description: 'Infrared effect',
  },

  classicu: {
    name: 'Classic U',
    filters: [
      {name: 'Brightness', value: -0.1},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 0.9},
      {name: 'Hue', value: 25},
    ],
    description: 'Ultra classic look',
  },

  golf: {
    name: 'Golf',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 1.3},
      {name: 'Gamma', value: 1.05},
    ],
    description: 'Golf course tones',
  },

  cpm35: {
    name: 'CPM35',
    filters: [
      {name: 'Brightness', value: -0.1},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 1.1},
      {name: 'Hue', value: 15},
    ],
    description: '35mm film simulation',
  },

  '135sr': {
    name: '135 SR',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.2},
      {name: 'Gamma', value: 1.1},
    ],
    description: 'Super resolution',
  },

  dhalf: {
    name: 'D Half',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 0.8},
      {name: 'Gamma', value: 1.15},
    ],
    description: 'Half frame effect',
  },

  dslide: {
    name: 'D Slide',
    filters: [
      {name: 'Brightness', value: 0.3},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 1.5},
      {name: 'Gamma', value: 0.9},
    ],
    description: 'Slide film look',
  },

  // VINTAGE 120 SECTION
  sclassic: {
    name: 'S Classic',
    filters: [
      {name: 'Brightness', value: -0.1},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 0.9},
      {name: 'Hue', value: 20},
    ],
    description: 'Square format classic',
  },

  hoga: {
    name: 'HOGA',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 1.1},
      {name: 'Gamma', value: 1.1},
    ],
    description: 'Holographic effect',
  },

  s67: {
    name: 'S 67',
    filters: [
      {name: 'Brightness', value: -0.2},
      {name: 'Contrast', value: 1.5},
      {name: 'Saturation', value: 0.8},
      {name: 'Hue', value: 15},
    ],
    description: '6x7 format look',
  },

  kv88: {
    name: 'KV88',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.2},
      {name: 'Gamma', value: 1.05},
    ],
    description: 'Kodak vision 88',
  },

  // INST COLLECTION SECTION
  instc: {
    name: 'Inst C',
    filters: [
      {name: 'Brightness', value: 0.3},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 1.4},
      {name: 'Gamma', value: 0.9},
    ],
    description: 'Instant camera classic',
  },

  instsqc: {
    name: 'Inst SQC',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.3},
      {name: 'Gamma', value: 1.0},
    ],
    description: 'Square instant camera',
  },

  pafr: {
    name: 'PAF R',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.4},
      {name: 'Saturation', value: 1.1},
      {name: 'Hue', value: 10},
    ],
    description: 'Polaroid AF look',
  },
};

// Create OpenGL filtered image component
export const createOpenGLFilteredImage = (imageUri, filterId) => {
  const filterConfig = openglFilterEffects[filterId];
  if (!filterConfig) {
    return null;
  }

  // ImageFilterKit removed - return original image
  return imageUri;
};

// Get OpenGL filter overlay style for live preview
export const getOpenGLFilterOverlay = filterId => {
  console.log('getOpenGLFilterOverlay called with filterId:', filterId);
  const filterConfig = openglFilterEffects[filterId];
  console.log('Found filter config:', filterConfig);
  if (!filterConfig) {
    console.log('No filter config found for:', filterId);
    return {};
  }

  // Create visual overlay based on filter type
  let overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  };

  // Apply different overlay effects based on filter type
  switch (filterId) {
    case 'grdr':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.4)'; // Strong dark overlay
      break;
    case 'ccdr':
      overlayStyle.backgroundColor = 'rgba(255, 200, 200, 0.3)'; // Strong warm tint
      break;
    case 'collage':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // Bright overlay
      break;
    case 'puli':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Strong dark cinematic
      break;
    case 'fxnr':
      overlayStyle.backgroundColor = 'rgba(128, 128, 128, 0.3)'; // Grain effect
      break;
    case 'dclassic':
      overlayStyle.backgroundColor = 'rgba(255, 200, 150, 0.4)'; // Strong vintage warm
      break;
    case 'grf':
      overlayStyle.backgroundColor = 'rgba(128, 128, 128, 0.6)'; // Strong black and white overlay
      break;
    case 'ct2f':
      overlayStyle.backgroundColor = 'rgba(255, 180, 150, 0.4)'; // Strong warm vintage
      break;
    case 'dexp':
      overlayStyle.backgroundColor = 'rgba(255, 255, 200, 0.3)'; // Expired film
      break;
    case 'nt16':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.4)'; // Strong neutral dark
      break;
    case 'd3d':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)'; // 3D effect
      break;
    case '135ne':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Natural
      break;
    case 'dfuns':
      overlayStyle.backgroundColor = 'rgba(255, 200, 200, 0.4)'; // Strong fun saturated
      break;
    case 'ir':
      overlayStyle.backgroundColor = 'rgba(0, 255, 255, 0.3)'; // Infrared
      break;
    case 'classicu':
      overlayStyle.backgroundColor = 'rgba(255, 200, 150, 0.4)'; // Strong ultra classic
      break;
    case 'golf':
      overlayStyle.backgroundColor = 'rgba(200, 255, 200, 0.3)'; // Green tint
      break;
    case 'cpm35':
      overlayStyle.backgroundColor = 'rgba(255, 200, 150, 0.3)'; // 35mm film
      break;
    case '135sr':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Super res
      break;
    case 'dhalf':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Half frame
      break;
    case 'dslide':
      overlayStyle.backgroundColor = 'rgba(255, 255, 200, 0.2)'; // Slide film
      break;
    case 'sclassic':
      overlayStyle.backgroundColor = 'rgba(255, 200, 150, 0.15)'; // Square classic
      break;
    case 'hoga':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)'; // Holographic
      break;
    case 's67':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.2)'; // 6x7 format
      break;
    case 'kv88':
      overlayStyle.backgroundColor = 'rgba(255, 200, 150, 0.1)'; // Kodak vision
      break;
    case 'instc':
      overlayStyle.backgroundColor = 'rgba(255, 255, 200, 0.2)'; // Instant classic
      break;
    case 'instsqc':
      overlayStyle.backgroundColor = 'rgba(255, 255, 200, 0.15)'; // Square instant
      break;
    case 'pafr':
      overlayStyle.backgroundColor = 'rgba(255, 200, 150, 0.1)'; // Polaroid AF
      break;
    default:
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.05)'; // Default
  }

  return overlayStyle;
};
