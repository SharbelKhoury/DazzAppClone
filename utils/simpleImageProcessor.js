// ImageFilterKit removed - using simple effects only

// Simple but effective filter configurations
export const simpleFilterConfigs = {
  ndfilter: {
    name: 'ND Filter',
    filters: [
      {name: 'Brightness', value: -0.3},
      {name: 'Contrast', value: 1.1},
    ],
    description: 'Reduces light intensity',
  },

  fisheyef: {
    name: 'Fisheye F',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.2},
      {name: 'Saturation', value: 1.1},
    ],
    description: 'Fisheye lens effect (F)',
  },

  fisheyew: {
    name: 'Fisheye W',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.1},
      {name: 'Saturation', value: 1.05},
    ],
    description: 'Fisheye lens effect (W)',
  },

  prism: {
    name: 'Prism',
    filters: [
      {name: 'Brightness', value: 0.1},
      {name: 'Contrast', value: 1.15},
      {name: 'Saturation', value: 1.3},
      {name: 'Hue', value: 15},
    ],
    description: 'Prism color separation',
  },

  flashc: {
    name: 'Flash C',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.5},
      {name: 'Hue', value: 15}, // Add red tint
    ],
    description: 'Flash exposure effect with red tint',
  },

  star: {
    name: 'Star',
    filters: [
      {name: 'Brightness', value: 0.2},
      {name: 'Contrast', value: 1.3},
      {name: 'Saturation', value: 1.15},
    ],
    description: 'Star diffraction effect',
  },
};

// Create a filtered image component
export const createSimpleFilteredImage = (imageUri, filterId) => {
  const config = simpleFilterConfigs[filterId];
  if (!config) {
    return null;
  }

  // ImageFilterKit removed - return original image
  return imageUri;
};

// Get visual overlay style for live preview
export const getSimpleFilterOverlay = filterId => {
  const config = simpleFilterConfigs[filterId];
  if (!config) {
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

  switch (filterId) {
    case 'flashc':
      overlayStyle.backgroundColor = 'rgba(255, 80, 80, 0.5)'; // Stronger reddish overlay
      break;
    case 'ndfilter':
      overlayStyle.backgroundColor = 'rgba(0, 0, 0, 0.35)';
      break;
    case 'prism':
      overlayStyle.backgroundColor = 'rgba(255, 150, 150, 0.2)';
      break;
    case 'fisheyef':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.15)';
      break;
    case 'fisheyew':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      break;
    case 'star':
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.2)';
      break;
    default:
      overlayStyle.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  }

  return overlayStyle;
};
