// Camera Icon Utilities
// Contains camera icon mapping and selection logic

/**
 * Get the selected camera icon based on global state and active filters
 * @param {Object} global - Global state object containing selectedCameraId
 * @param {Array} activeFilters - Array of currently active filters
 * @returns {Object|null} - Camera icon image object or null if not found
 */
export const getSelectedCameraIcon = (global, activeFilters) => {
  // If no camera selected globally, use the first active filter
  const cameraId =
    global.selectedCameraId ||
    (activeFilters.length > 0 ? activeFilters[0] : null);
  if (!cameraId) return null;

  // Import all camera icons
  const cameraIcons = {
    // DIGITAL
    original: require('../src/assets/cameras/original.png'),
    grdr: require('../src/assets/cameras/grdr.png'),
    ccdr: require('../src/assets/cameras/ccdr.png'),
    collage: require('../src/assets/cameras/collage.png'),
    puli: require('../src/assets/cameras/puli.png'),
    fxnr: require('../src/assets/cameras/fxnr.png'),

    // VIDEO
    vclassic: require('../src/assets/cameras/vclassic.png'),
    originalv: require('../src/assets/cameras/originalv.png'),
    dam: require('../src/assets/cameras/dam.png'),
    '16mm': require('../src/assets/cameras/16mm.png'),
    '8mm': require('../src/assets/cameras/8mm.png'),
    vhs: require('../src/assets/cameras/vhs.png'),
    kino: require('../src/assets/cameras/kino.png'),
    instss: require('../src/assets/cameras/instss.png'),
    vfuns: require('../src/assets/cameras/vfuns.png'),
    dcr: require('../src/assets/cameras/dcr.png'),
    glow: require('../src/assets/cameras/glow.png'),
    slidep: require('../src/assets/cameras/slidep.png'),

    // VINTAGE 120
    sclassic: require('../src/assets/cameras/sclassic.png'),
    hoga: require('../src/assets/cameras/hoga.png'),
    s67: require('../src/assets/cameras/s67.png'),
    kv88: require('../src/assets/cameras/kv88.png'),

    // INST COLLECTION
    instc: require('../src/assets/cameras/instc.png'),
    instsq: require('../src/assets/cameras/instsq.png'),
    instsqc: require('../src/assets/cameras/instsqc.png'),
    pafr: require('../src/assets/cameras/pafr.png'),

    // VINTAGE 135
    dclassic: require('../src/assets/cameras/dclassic.png'),
    grf: require('../src/assets/cameras/grf.png'),
    ct2f: require('../src/assets/cameras/ct2f.png'),
    dexp: require('../src/assets/cameras/dexp.png'),
    nt16: require('../src/assets/cameras/nt16.png'),
    d3d: require('../src/assets/cameras/d3d.png'),
    '135ne': require('../src/assets/cameras/135ne.png'),
    dfuns: require('../src/assets/cameras/dfuns.png'),
    ir: require('../src/assets/cameras/ir.png'),
    classicu: require('../src/assets/cameras/classicu.png'),
    dqs: require('../src/assets/cameras/dqs.png'),
    fqsr: require('../src/assets/cameras/fqsr.png'),
    golf: require('../src/assets/cameras/golf.png'),
    cpm35: require('../src/assets/cameras/cmp35.png'),
    '135sr': require('../src/assets/cameras/135sr.png'),
    dhalf: require('../src/assets/cameras/dhalf.png'),
    dslide: require('../src/assets/cameras/dslide.png'),

    // ACCESSORY
    ndfilter: require('../src/assets/accessory/ndfilter.png'),
    fisheyef: require('../src/assets/accessory/fisheyef.png'),
    fisheyew: require('../src/assets/accessory/fisheyew.png'),
    prism: require('../src/assets/accessory/prism.png'),
    flashc: require('../src/assets/accessory/flashc.png'),
    star: require('../src/assets/accessory/star.png'),
  };

  return cameraIcons[cameraId] || null;
};
