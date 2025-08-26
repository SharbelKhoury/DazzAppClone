export const filterConfigs = {
  ndfilter: {
    name: 'ND Filter',
    effects: [{brightness: -0.3}, {contrast: 1.1}, {saturation: 0.8}],
    description: 'Reduces light intensity',
  },

  fisheyef: {
    name: 'Fisheye F',
    effects: [{brightness: 0.2}, {contrast: 1.2}, {saturation: 1.1}],
    description: 'Fisheye lens effect (F)',
  },

  fisheyew: {
    name: 'Fisheye W',
    effects: [{brightness: 0.1}, {contrast: 1.1}, {saturation: 1.05}],
    description: 'Fisheye lens effect (W)',
  },

  prism: {
    name: 'Prism',
    effects: [{brightness: 0.1}, {contrast: 1.15}, {saturation: 1.3}],
    description: 'Prism color separation',
  },

  flashc: {
    name: 'Flash C',
    effects: [{brightness: 0.2}, {contrast: 1.3}, {saturation: 1.5}],
    description: 'Flash exposure effect with red tint',
  },

  star: {
    name: 'Star',
    effects: [{brightness: 0.2}, {contrast: 1.3}, {saturation: 1.15}],
    description: 'Star diffraction effect',
  },
};
