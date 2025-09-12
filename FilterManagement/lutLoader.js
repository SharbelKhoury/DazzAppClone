/**
 * LUT Loader for Filter Management
 * Handles loading of large LUT files efficiently to avoid build issues
 */

// Import LUT files dynamically to avoid build issues with large base64 strings
export const loadLUT = async filterId => {
  try {
    let lutBase64;

    switch (filterId) {
      case 'grf':
        const grfModule = await import('../filtersLUT/grf');
        lutBase64 = grfModule.base64;
        break;
      case 'ir':
        const irModule = await import('../filtersLUT/ir');
        lutBase64 = irModule.base64;
        break;
      case 'dexp':
        const dexpModule = await import('../filtersLUT/dexp');
        lutBase64 = dexpModule.base64;
        break;
      case 'dfuns':
        const dfunsModule = await import('../filtersLUT/dfuns');
        lutBase64 = dfunsModule.base64;
        break;
      case 'cpm35':
        const cpm35Module = await import('../filtersLUT/cpm35');
        lutBase64 = cpm35Module.base64;
        break;
      case 'classicu':
        const classicuModule = await import('../filtersLUT/classicu');
        lutBase64 = classicuModule.base64;
        break;
      case 'grdr':
        const grdrModule = await import('../filtersLUT/grdr');
        lutBase64 = grdrModule.base64;
        break;
      case 'nt16':
        const nt16Module = await import('../filtersLUT/nt16');
        lutBase64 = nt16Module.base64;
        break;
      case 'dclassic':
        const dclassicModule = await import('../filtersLUT/dclassic');
        lutBase64 = dclassicModule.base64;
        break;
      default:
        throw new Error(`No LUT found for filter: ${filterId}`);
    }

    return lutBase64;
  } catch (error) {
    console.error('❌ Failed to load LUT for filter:', filterId, error);
    return null;
  }
};
