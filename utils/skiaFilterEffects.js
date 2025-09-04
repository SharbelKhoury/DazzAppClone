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
    description: 'High contrast definition enhancement',
    effects: {
      brightness: 0.02, // Subtle brightness for good exposure
      contrast: 1.3, // Moderate contrast for sharp definition
      saturation: 1.05, // Slight saturation for color balance
      gamma: 1.08, // Subtle gamma for better mid-tones
      hue: 0, // Neutral hue for natural color balance
    },
  },

  ccdr: {
    name: 'CCD R',
    description: 'Vintage digital camera look',
    effects: {
      brightness: 0.05, // Slight brightness boost for better exposure
      contrast: 1.1, // Slight contrast enhancement for definition
      saturation: 0.9, // Slight desaturation for vintage feel
      gamma: 1.0, // No gamma reduction for natural mid-tones
      hue: 0, // No hue shift for natural colors
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
    description: 'Bright vibrant enhancement',
    effects: {
      brightness: 0.1, // Moderate brightness for luminous quality
      contrast: 1.2, // Moderate contrast for better definition
      saturation: 1.15, // Moderate saturation for vibrant colors
      gamma: 1.05, // Subtle gamma for better mid-tones
      hue: 3, // Slight warm hue shift for natural warmth
    },
  },

  fxn: {
    name: 'FXN',
    description: 'Dramatic cool vintage look',
    effects: {
      brightness: -0.15, // Moderate reduction for moody feel
      contrast: 1.4, // Moderate contrast for dramatic effect
      saturation: 0.6, // Moderate desaturation for vintage look
      gamma: 0.9, // Slight gamma reduction for compressed mid-tones
      hue: -60, // Moderate cool blue-green tint for vintage effect
    },
  },

  fxnr: {
    name: 'FQS R',
    description: 'Film grain simulation',
    effects: {
      brightness: -0.1, // Moderate brightness reduction for vintage feel
      contrast: 1.2, // Moderate contrast to maintain definition despite grain
      saturation: 0.7, // Moderate desaturation for vintage look
      gamma: 0.9, // Slight gamma reduction for darker, richer tones
      hue: 5, // Slight warm hue shift for vintage warmth
    },
  },

  dqs: {
    name: 'DQS',
    description: 'Digital quality enhancement',
    effects: {
      brightness: 0.1, // Slight brightness boost for clarity
      contrast: 1.3, // Enhanced contrast for better definition
      saturation: 1.2, // Increased saturation for vibrant colors
      gamma: 1.05, // Slight gamma boost for better mid-tones
      hue: 0, // Neutral hue for natural color balance
    },
  },

  // VINTAGE 135 SECTION
  dclassic: {
    name: 'D Classic',
    description: 'Classic vintage look',
    effects: {
      brightness: -0.15, // Reduced brightness for classic vintage feel
      contrast: 1.3, // Enhanced contrast for better definition
      saturation: 0.7, // Reduced saturation for authentic vintage look
      gamma: 0.95, // Added gamma for richer mid-tones
      hue: 20, // Enhanced warm hue shift for classic vintage warmth
    },
  },

  grf: {
    name: 'GR F',
    description: 'Black and white film simulation',
    effects: {
      brightness: 0.1, // Slight brightness boost for better exposure
      contrast: 1.6, // Higher contrast for dramatic B&W
      saturation: 0.0, // Complete desaturation for pure B&W
      gamma: 1.2, // Enhanced gamma for film-like response
      hue: 0, // Neutral hue
    },
  },

  ct2f: {
    name: 'CT2F',
    description: 'Cool vintage tones',
    effects: {
      brightness: -0.15, // Moderate brightness reduction for vintage look
      contrast: 1.3, // Moderate contrast for vintage effect
      saturation: 0.6, // Moderate desaturation for vintage feel
      gamma: 0.9, // Slight gamma for deeper, richer tones
      hue: -60, // Moderate cool blue-green tint for vintage effect
    },
  },

  dexp: {
    name: 'D Exp',
    description: 'Expired film look',
    effects: {
      brightness: 0.025, // Very subtle brightness for expired film look
      contrast: 1.05, // Minimal contrast enhancement
      saturation: 0.9, // Slight saturation reduction for aged film feel
      gamma: 0.95, // Very minimal gamma reduction for vintage tones
      hue: -4, // Very subtle greenish tint for expired film color shift
    },
  },

  nt16: {
    name: 'NT16',
    description: 'Neutral tone film',
    effects: {
      brightness: 0.002, // Very subtle brightness for natural look
      contrast: 1.05, // Minimal contrast for natural look
      saturation: 0.995, // Extremely minimal desaturation for natural colors
      gamma: 1.0, // No gamma change for natural mid-tones
      hue: 0, // No hue shift for neutral colors
    },
  },

  d3d: {
    name: 'D3D',
    description: '3D depth effect',
    effects: {
      brightness: -0.096, // 2x darker for much darker vintage look
      contrast: 1.06, // Minimal contrast for depth effect
      saturation: 0.94, // Very slight desaturation for vintage feel
      gamma: 0.98, // Very minimal gamma reduction for deeper, richer tones
      hue: -10, // Very subtle cool blue-green tint for depth effect
    },
  },

  '135ne': {
    name: '135 NE',
    description: 'Natural exposure',
    effects: {
      brightness: 0.15, // Slightly reduced for more natural exposure
      contrast: 1.3, // Enhanced contrast for better definition
      saturation: 1.15, // Slightly increased for natural vibrancy
      gamma: 1.05, // Added gamma for better mid-tones
      hue: 8, // Reduced warm hue shift for more neutral look
    },
  },

  dfuns: {
    name: 'D FunS',
    description: 'Fun saturated look',
    effects: {
      brightness: -0.12, // Moderate reduction for moody feel
      contrast: 1.3, // Moderate contrast for fun effect
      saturation: 0.7, // Moderate desaturation for vintage look
      gamma: 0.9, // Slight gamma reduction for deeper, richer tones
      hue: -60, // Moderate cool blue-green tint for fun effect
    },
  },

  ir: {
    name: 'IR',
    description: 'Infrared effect',
    effects: {
      brightness: -0.1, // Moderate brightness reduction for infrared feel
      contrast: 1.3, // Moderate contrast for infrared effect
      saturation: 0.7, // Moderate desaturation for infrared look
      gamma: 0.95, // Slight gamma for richer mid-tones
      hue: 12, // Moderate warm reddish-pink tint for infrared effect
    },
  },

  classicu: {
    name: 'Classic U',
    description: 'Ultra classic look',
    effects: {
      brightness: -0.3, // Darker effect
      contrast: 1.1, // Slight contrast enhancement
      saturation: 0.9, // Slightly reduced saturation
      gamma: 0.9, // Slightly lower gamma for darker mid-tones
      hue: 0, // No hue shift - no green tint
    },
  },

  golf: {
    name: 'Golf',
    description: 'Golf course tones',
    effects: {
      brightness: -0.25, // Significantly reduced brightness for dramatic vintage look
      contrast: 1.5, // Enhanced contrast for dramatic effect
      saturation: 0.4, // Heavy desaturation for monochromatic feel
      gamma: 0.85, // Added gamma for deeper, richer tones
      hue: -140, // Strong cool blue-green tint for dramatic vintage effect
    },
  },

  cpm35: {
    name: 'CPM35',
    description: '35mm film simulation',
    effects: {
      brightness: -0.15, // Further reduced for darker, aged vintage look
      contrast: 1.5, // Increased for better definition and depth
      saturation: 0.6, // Further reduced for stronger sepia desaturation
      gamma: 0.9, // Added gamma for richer mid-tones
      hue: 25, // Increased warm hue shift for stronger sepia tint
    },
  },

  '135sr': {
    name: '135 SR',
    description: 'Super resolution',
    effects: {
      brightness: -0.1, // Reduced brightness for dramatic contrast
      contrast: 1.8, // Significantly increased for dramatic effect
      saturation: 0.3, // Heavily desaturated for monochromatic look
      gamma: 0.8, // Decreased for deeper shadows
      hue: -160, // Strong cool blue-green shift
    },
  },

  dhalf: {
    name: 'D Half',
    description: 'Half frame effect',
    effects: {
      brightness: 0.15, // Slightly reduced from 0.2 for more natural exposure
      contrast: 1.3, // Increased from 1.2 for better half frame definition
      saturation: 0.9, // Increased from 0.8 for better color balance
      gamma: 1.1, // Slightly reduced from 1.15 for more natural mid-tones
      hue: 2, // Added slight warm hue shift for half frame warmth
    },
  },

  dslide: {
    name: 'D Slide',
    description: 'Slide film look',
    effects: {
      brightness: 0.25, // Slightly reduced from 0.3 for more natural exposure
      contrast: 1.5, // Increased from 1.4 for better slide film contrast
      saturation: 1.6, // Increased from 1.5 for more vibrant slide film colors
      gamma: 0.85, // Decreased from 0.9 for richer mid-tones
      hue: 3, // Added slight warm hue shift for slide film warmth
    },
  },

  // VINTAGE 120 SECTION
  sclassic: {
    name: 'S Classic',
    description: 'Square format classic',
    effects: {
      brightness: -0.2, // Reduced brightness for vintage, aged feel
      contrast: 1.5, // Enhanced contrast for better definition
      saturation: 0.5, // Heavy desaturation for vintage, monochromatic look
      gamma: 0.9, // Added gamma for richer mid-tones
      hue: -120, // Strong cool blue-green tint for vintage feel
    },
  },

  hoga: {
    name: 'HOGA',
    description: 'Holographic effect',
    effects: {
      brightness: 0.15, // Enhanced brightness for holographic glow
      contrast: 1.5, // Enhanced contrast for holographic definition
      saturation: 1.3, // Increased saturation for vibrant holographic colors
      gamma: 1.15, // Enhanced gamma for richer mid-tones
      hue: 15, // Added warm hue shift for holographic warmth
    },
  },

  s67: {
    name: 'S 67',
    description: '6x7 format look',
    effects: {
      brightness: -0.25, // Further reduced brightness for dramatic vintage look
      contrast: 1.6, // Enhanced contrast for better definition
      saturation: 0.4, // Heavy desaturation for monochromatic feel
      gamma: 0.85, // Added gamma for richer mid-tones
      hue: -140, // Strong cool blue-cyan tint for dramatic effect
    },
  },

  kv88: {
    name: 'KV88',
    description: 'Kodak vision 88',
    effects: {
      brightness: 0.4, // Significantly increased for overexposed, luminous quality
      contrast: 0.9, // Reduced contrast for softer, washed-out look
      saturation: 0.4, // Heavy desaturation for monochromatic feel
      gamma: 1.2, // Lifted mid-tones for faded appearance
      hue: -120, // Strong cool blue-green tint for aged atmosphere
    },
  },

  // INST COLLECTION SECTION
  instc: {
    name: 'Inst C',
    description: 'Instant camera classic',
    effects: {
      brightness: -0.1, // Moderate reduction for vintage feel
      contrast: 1.2, // Moderate contrast for better definition
      saturation: 0.8, // Moderate desaturation for vintage, faded colors
      gamma: 0.95, // Slight gamma reduction for film-like quality
      hue: 0, // No hue shift for natural colors
    },
  },

  instsqc: {
    name: 'Inst SQC',
    description: 'Square instant camera',
    effects: {
      brightness: -0.05, // Slightly reduced brightness for natural instant camera look
      contrast: 1.3, // Moderate contrast for better definition
      saturation: 0.9, // Reduced saturation for authentic instant camera feel
      gamma: 0.9, // Reduced gamma for warmer, vintage tones
      hue: 12, // Enhanced warm hue shift for instant camera warmth
    },
  },

  pafr: {
    name: 'PAF R',
    description: 'Polaroid AF look',
    effects: {
      brightness: 0.05, // Balanced brightness for natural luminosity
      contrast: 1.3, // Good contrast for clear definition
      saturation: 0.8, // Reduced saturation for natural tones
      gamma: 1.05, // Added gamma for better mid-tones
      hue: 5, // Reduced warm hue shift for natural balance
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

  // Matrix multiplication helper function
  const multiplyMatrices = (a, b) => {
    const result = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 5; j++) {
        let sum = 0;
        for (let k = 0; k < 4; k++) {
          sum += a[i * 5 + k] * b[k * 5 + j];
        }
        if (j === 4) {
          // Add bias terms
          sum += a[i * 5 + 4];
        }
        result[i * 5 + j] = sum;
      }
    }
    return result;
  };

  // Apply gamma correction (approximated using brightness adjustment)
  const gammaAdjustment = gamma !== 1 ? (gamma - 1) * 0.3 : 0;
  const adjustedBrightness = brightness + gammaAdjustment;

  // Combine matrices in proper order: saturation → contrast → brightness → hue
  let combinedMatrix = saturationMatrix;

  if (saturation !== 0) {
    // Apply contrast
    combinedMatrix = multiplyMatrices(contrastMatrix, combinedMatrix);

    // Apply brightness
    const adjustedBrightnessMatrix = [
      1,
      0,
      0,
      0,
      adjustedBrightness,
      0,
      1,
      0,
      0,
      adjustedBrightness,
      0,
      0,
      1,
      0,
      adjustedBrightness,
      0,
      0,
      0,
      1,
      0,
    ];
    combinedMatrix = multiplyMatrices(adjustedBrightnessMatrix, combinedMatrix);

    // Apply hue if not zero
    if (hue !== 0) {
      combinedMatrix = multiplyMatrices(hueMatrix, combinedMatrix);
    }
  }

  return combinedMatrix;
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
