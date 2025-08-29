// ImageFilterKit removed - using simple effects only

// Advanced filter configurations for real image processing
export const advancedFilterConfigs = {
  ndfilter: {
    name: 'ND Filter',
    filter: {
      brightness: -0.3,
      contrast: 1.1,
      saturation: 0.8,
    },
    description: 'Reduces light intensity',
  },

  fisheyef: {
    name: 'Fisheye F',
    filter: {
      brightness: 0.2,
      contrast: 1.2,
      saturation: 1.1,
      gamma: 1.1,
    },
    description: 'Fisheye lens effect (F)',
  },

  fisheyew: {
    name: 'Fisheye W',
    filter: {
      brightness: 0.1,
      contrast: 1.1,
      saturation: 1.05,
      gamma: 1.05,
    },
    description: 'Fisheye lens effect (W)',
  },

  prism: {
    name: 'Prism',
    filter: {
      brightness: 0.1,
      contrast: 1.15,
      saturation: 1.3,
      hue: 15,
    },
    description: 'Prism color separation',
  },

  flashc: {
    name: 'Flash C',
    filter: {
      brightness: 0.2,
      contrast: 1.3,
      saturation: 1.5,
      hue: 15,
      gamma: 0.9,
    },
    description: 'Flash exposure effect with red tint',
  },

  star: {
    name: 'Star',
    filter: {
      brightness: 0.2,
      contrast: 1.3,
      saturation: 1.15,
      gamma: 1.2,
    },
    description: 'Star diffraction effect',
  },
};

// Function to create ImageFilter component with specific filter
export const createFilteredImage = (imageUri, filterId) => {
  const filterConfig = advancedFilterConfigs[filterId];
  if (!filterConfig) {
    return null;
  }

  const {filter} = filterConfig;

  // ImageFilterKit removed - return original image
  return imageUri;
};

// Function to apply multiple filters
export const createMultiFilteredImage = (imageUri, filterIds) => {
  if (!filterIds || filterIds.length === 0) {
    return null;
  }

  // Combine all filter effects
  const combinedFilter = {
    brightness: 0,
    contrast: 1,
    saturation: 1,
    gamma: 1,
    hue: 0,
  };

  filterIds.forEach(filterId => {
    const filterConfig = advancedFilterConfigs[filterId];
    if (filterConfig) {
      const {filter} = filterConfig;
      combinedFilter.brightness += filter.brightness || 0;
      combinedFilter.contrast *= filter.contrast || 1;
      combinedFilter.saturation *= filter.saturation || 1;
      combinedFilter.gamma *= filter.gamma || 1;
      combinedFilter.hue += filter.hue || 0;
    }
  });

  // ImageFilterKit removed - return original image
  return imageUri;
};

// Function to get filter preview style for live camera overlay
export const getFilterPreviewStyle = filterId => {
  const filterConfig = advancedFilterConfigs[filterId];
  if (!filterConfig) {
    return {};
  }

  const {filter} = filterConfig;

  // Convert filter values to visual overlay styles
  const brightness = filter.brightness || 0;
  const saturation = filter.saturation || 1;

  let overlayColor = 'rgba(255, 255, 255, 0)';
  let opacity = 0;

  if (brightness > 0) {
    // Bright filter - white overlay
    opacity = Math.min(brightness * 0.3, 0.4);
    overlayColor = `rgba(255, 255, 255, ${opacity})`;
  } else if (brightness < 0) {
    // Dark filter - black overlay
    opacity = Math.min(Math.abs(brightness) * 0.3, 0.4);
    overlayColor = `rgba(0, 0, 0, ${opacity})`;
  }

  // Add color tint based on saturation and hue
  if (filter.hue) {
    const hue = filter.hue;
    if (hue > 0) {
      overlayColor = `rgba(255, 150, 150, ${opacity + 0.2})`; // Stronger reddish tint
    } else if (hue < 0) {
      overlayColor = `rgba(200, 200, 255, ${opacity + 0.1})`; // Bluish tint
    }
  }

  return {
    backgroundColor: overlayColor,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  };
};
