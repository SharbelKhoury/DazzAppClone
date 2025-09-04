export const filterEffects = {
  ndfilter: {
    type: 'brightness',
    intensity: 0.7,
    shader: 'brightness_reduction',
    parameters: {brightness: 0.3, contrast: 1.1},
  },
  fisheyef: {
    type: 'distortion',
    intensity: 0.8,
    shader: 'fisheye_distortion',
    parameters: {radius: 0.8, center: [0.5, 0.5]},
  },
  fisheyew: {
    type: 'distortion',
    intensity: 0.6,
    shader: 'fisheye_distortion',
    parameters: {radius: 0.6, center: [0.5, 0.5]},
  },
  prism: {
    type: 'chromatic',
    intensity: 0.5,
    shader: 'chromatic_aberration',
    parameters: {redOffset: 0.02, blueOffset: -0.02},
  },
  flashc: {
    type: 'exposure',
    intensity: 0.9,
    shader: 'flash_exposure',
    parameters: {exposure: 1.3, highlights: 0.8},
  },
  star: {
    type: 'diffraction',
    intensity: 0.4,
    shader: 'star_diffraction',
    parameters: {points: 6, brightness: 0.6},
  },
};
