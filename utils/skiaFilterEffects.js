import {
  Canvas,
  Image,
  useImage,
  useValue,
  useValueEffect,
  Paint,
  ColorMatrix,
  BlendMode,
  ImageShader,
  LinearGradient,
  vec,
  useDerivedValue,
  useSharedValue,
} from '@shopify/react-native-skia';

// Skia-based filter effects for 2nd row cameras
export const skiaFilterEffects = {
  // DIGITAL SECTION
  original: {
    name: 'Original',
    description: 'Clean digital look',
    // No effects - original image
  },

  grdr: {
    name: 'GR DR',
    description: 'High contrast black & white',
    effects: {
      brightness: -0.1,
      contrast: 1.4,
      saturation: 0.0, // True black and white
      gamma: 1.1,
    },
  },

  ccdr: {
    name: 'CC DR',
    description: 'Color corrected digital',
    effects: {
      brightness: 0.1,
      contrast: 1.3,
      saturation: 1.2,
      hue: 5,
    },
  },

  collage: {
    name: 'Collage',
    description: 'Vibrant collage style',
    effects: {
      brightness: 0.2,
      contrast: 1.2,
      saturation: 1.4,
      gamma: 0.9,
    },
  },

  puli: {
    name: 'Puli',
    description: 'Moody cinematic look',
    effects: {
      brightness: -0.2,
      contrast: 1.5,
      saturation: 0.7,
      hue: -10,
    },
  },

  fxnr: {
    name: 'FXN R',
    description: 'Film grain simulation',
    effects: {
      brightness: 0.1,
      contrast: 1.3,
      saturation: 1.1,
      gamma: 1.05,
    },
  },

  // VINTAGE 135 SECTION
  dclassic: {
    name: 'D Classic',
    description: 'Classic vintage look',
    effects: {
      brightness: -0.1,
      contrast: 1.2,
      saturation: 0.9,
      hue: 15,
    },
  },

  grf: {
    name: 'GR F',
    description: 'Black and white film simulation',
    effects: {
      brightness: 0.05, // Reduced brightness
      contrast: 1.4, // Reduced contrast to prevent white photos
      saturation: -0.8, // Less aggressive saturation reduction
      gamma: 1.1, // Reduced gamma
    },
  },

  ct2f: {
    name: 'CT2F',
    description: 'Warm vintage tones',
    effects: {
      brightness: -0.2,
      contrast: 1.3,
      saturation: 1.1,
      hue: 20,
    },
  },

  dexp: {
    name: 'D Exp',
    description: 'Expired film look',
    effects: {
      brightness: 0.3,
      contrast: 1.1,
      saturation: 1.3,
      gamma: 0.8,
    },
  },

  nt16: {
    name: 'NT16',
    description: 'Neutral tone film',
    effects: {
      brightness: -0.1,
      contrast: 1.5,
      saturation: 0.7,
      hue: -5,
    },
  },

  d3d: {
    name: 'D3D',
    description: '3D depth effect',
    effects: {
      brightness: 0.1,
      contrast: 1.4,
      saturation: 1.2,
      gamma: 1.1,
    },
  },

  '135ne': {
    name: '135 NE',
    description: 'Natural exposure',
    effects: {
      brightness: 0.2,
      contrast: 1.2,
      saturation: 1.1,
      hue: 10,
    },
  },

  dfuns: {
    name: 'D FunS',
    description: 'Fun saturated look',
    effects: {
      brightness: 0.3,
      contrast: 1.3,
      saturation: 1.4,
      gamma: 0.9,
    },
  },

  ir: {
    name: 'IR',
    description: 'Infrared effect',
    effects: {
      brightness: 0.1,
      contrast: 1.6,
      saturation: 0.5,
      hue: 180,
    },
  },

  classicu: {
    name: 'Classic U',
    description: 'Ultra classic look',
    effects: {
      brightness: -0.1,
      contrast: 1.3,
      saturation: 0.9,
      hue: 25,
    },
  },

  golf: {
    name: 'Golf',
    description: 'Golf course tones',
    effects: {
      brightness: 0.2,
      contrast: 1.2,
      saturation: 1.3,
      gamma: 1.05,
    },
  },

  cpm35: {
    name: 'CPM35',
    description: '35mm film simulation',
    effects: {
      brightness: -0.1,
      contrast: 1.4,
      saturation: 1.1,
      hue: 15,
    },
  },

  '135sr': {
    name: '135 SR',
    description: 'Super resolution',
    effects: {
      brightness: 0.1,
      contrast: 1.3,
      saturation: 1.2,
      gamma: 1.1,
    },
  },

  dhalf: {
    name: 'D Half',
    description: 'Half frame effect',
    effects: {
      brightness: 0.2,
      contrast: 1.2,
      saturation: 0.8,
      gamma: 1.15,
    },
  },

  dslide: {
    name: 'D Slide',
    description: 'Slide film look',
    effects: {
      brightness: 0.3,
      contrast: 1.4,
      saturation: 1.5,
      gamma: 0.9,
    },
  },

  // VINTAGE 120 SECTION
  sclassic: {
    name: 'S Classic',
    description: 'Square format classic',
    effects: {
      brightness: -0.1,
      contrast: 1.3,
      saturation: 0.9,
      hue: 20,
    },
  },

  hoga: {
    name: 'HOGA',
    description: 'Holographic effect',
    effects: {
      brightness: 0.1,
      contrast: 1.4,
      saturation: 1.1,
      gamma: 1.1,
    },
  },

  s67: {
    name: 'S 67',
    description: '6x7 format look',
    effects: {
      brightness: -0.2,
      contrast: 1.5,
      saturation: 0.8,
      hue: 15,
    },
  },

  kv88: {
    name: 'KV88',
    description: 'Kodak vision 88',
    effects: {
      brightness: 0.2,
      contrast: 1.3,
      saturation: 1.2,
      gamma: 1.05,
    },
  },

  // INST COLLECTION SECTION
  instc: {
    name: 'Inst C',
    description: 'Instant camera classic',
    effects: {
      brightness: 0.3,
      contrast: 1.2,
      saturation: 1.4,
      gamma: 0.9,
    },
  },

  instsqc: {
    name: 'Inst SQC',
    description: 'Square instant camera',
    effects: {
      brightness: 0.2,
      contrast: 1.3,
      saturation: 1.3,
      gamma: 1.0,
    },
  },

  pafr: {
    name: 'PAF R',
    description: 'Polaroid AF look',
    effects: {
      brightness: 0.1,
      contrast: 1.4,
      saturation: 1.1,
      hue: 10,
    },
  },
};

// Create Skia color matrix for filter effects
export const createSkiaColorMatrix = effects => {
  if (!effects) return null;

  const {
    brightness = 0,
    contrast = 1,
    saturation = 1,
    hue = 0,
    gamma = 1,
  } = effects;

  // Convert effects to color matrix
  const matrix = [];

  // Brightness adjustment
  const brightnessMatrix = [
    1,
    0,
    0,
    0,
    brightness,
    0,
    1,
    0,
    0,
    brightness,
    0,
    0,
    1,
    0,
    brightness,
    0,
    0,
    0,
    1,
    0,
  ];

  // Contrast adjustment
  const contrastMatrix = [
    contrast,
    0,
    0,
    0,
    0,
    0,
    contrast,
    0,
    0,
    0,
    0,
    0,
    contrast,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];

  // Saturation adjustment (convert to grayscale if 0)
  let saturationMatrix;
  if (saturation === 0) {
    // Black and white
    saturationMatrix = [
      0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114, 0, 0, 0.299, 0.587, 0.114,
      0, 0, 0, 0, 0, 1, 0,
    ];
  } else {
    // Color saturation
    const s = saturation;
    const r = 0.213;
    const g = 0.715;
    const b = 0.072;
    saturationMatrix = [
      (1 - s) * r + s,
      (1 - s) * r,
      (1 - s) * r,
      0,
      0,
      (1 - s) * g,
      (1 - s) * g + s,
      (1 - s) * g,
      0,
      0,
      (1 - s) * b,
      (1 - s) * b,
      (1 - s) * b + s,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  }

  // Hue adjustment (simplified)
  const hueRad = (hue * Math.PI) / 180;
  const cosHue = Math.cos(hueRad);
  const sinHue = Math.sin(hueRad);
  const hueMatrix = [
    0.213 + cosHue * 0.787 - sinHue * 0.213,
    0.213 - cosHue * 0.213 + sinHue * 0.143,
    0.213 - cosHue * 0.213 - sinHue * 0.787,
    0,
    0,
    0.715 - cosHue * 0.715 - sinHue * 0.715,
    0.715 + cosHue * 0.285 + sinHue * 0.14,
    0.715 - cosHue * 0.715 + sinHue * 0.715,
    0,
    0,
    0.072 - cosHue * 0.072 + sinHue * 0.928,
    0.072 - cosHue * 0.072 - sinHue * 0.283,
    0.072 + cosHue * 0.928 + sinHue * 0.072,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ];

  // Combine matrices (simplified multiplication)
  // For now, we'll use the most important effects
  if (saturation === 0) {
    // Black and white takes priority
    return saturationMatrix;
  } else {
    // Combine brightness, contrast, and saturation
    return [
      contrast * saturationMatrix[0],
      contrast * saturationMatrix[1],
      contrast * saturationMatrix[2],
      0,
      brightness,
      contrast * saturationMatrix[5],
      contrast * saturationMatrix[6],
      contrast * saturationMatrix[7],
      0,
      brightness,
      contrast * saturationMatrix[10],
      contrast * saturationMatrix[11],
      contrast * saturationMatrix[12],
      0,
      brightness,
      0,
      0,
      0,
      1,
      0,
    ];
  }
};

// Skia Filtered Image Component
export const SkiaFilteredImage = ({imageUri, filterId, style}) => {
  const image = useImage(imageUri);
  const filterConfig = skiaFilterEffects[filterId];

  if (!image || !filterConfig) {
    return null;
  }

  const colorMatrix = createSkiaColorMatrix(filterConfig.effects);

  return (
    <Canvas style={style}>
      <Image
        image={image}
        fit="cover"
        x={0}
        y={0}
        width={style?.width || 400}
        height={style?.height || 600}>
        {colorMatrix && <ColorMatrix matrix={colorMatrix} />}
      </Image>
    </Canvas>
  );
};

// Skia Filter Overlay Component for Live Preview
export const SkiaFilterOverlay = ({filterId, style}) => {
  const filterConfig = skiaFilterEffects[filterId];

  if (!filterConfig || !filterConfig.effects) {
    return null;
  }

  const {brightness, contrast, saturation} = filterConfig.effects;

  // Create overlay based on filter effects
  let overlayColor = 'rgba(255, 255, 255, 0.1)'; // Default

  if (saturation === 0) {
    // Black and white
    overlayColor = 'rgba(128, 128, 128, 0.3)';
  } else if (brightness < 0) {
    // Dark overlay
    overlayColor = 'rgba(0, 0, 0, 0.2)';
  } else if (brightness > 0.2) {
    // Bright overlay
    overlayColor = 'rgba(255, 255, 255, 0.15)';
  } else if (contrast > 1.3) {
    // High contrast
    overlayColor = 'rgba(255, 255, 255, 0.1)';
  }

  return (
    <Canvas style={style}>
      <Paint color={overlayColor} />
    </Canvas>
  );
};

// Get overlay style for live preview (fallback to regular View)
export const getSkiaFilterOverlay = filterId => {
  const filterConfig = skiaFilterEffects[filterId];

  if (!filterConfig || !filterConfig.effects) {
    return {};
  }

  const {brightness, contrast, saturation} = filterConfig.effects;

  let overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  };

  if (saturation === 0) {
    // Black and white
    overlayStyle.backgroundColor = 'rgba(128, 128, 128, 0.3)';
  } else if (brightness < 0) {
    // Dark overlay
    overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.2)';
  } else if (brightness > 0.2) {
    // Bright overlay
    overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.15)';
  } else if (contrast > 1.3) {
    // High contrast
    overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  }

  return overlayStyle;
};
