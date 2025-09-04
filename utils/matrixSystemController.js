/**
 * Matrix System Controller
 * Easy way to control and test the matrix system from the console or UI
 */

import {
  setMatrixSystem,
  getMatrixSystem,
  MATRIX_SYSTEMS,
  getFilterMatrix,
  compareMatrixSystems,
} from './filterMatrixUtils';

import {
  getIndividualSkiaMatrix,
  listAvailableIndividualMatrices,
  getIndividualMatrixCount,
} from './skiaIndividualMatrices';

/**
 * Switch to Individual Matrices system
 */
export const useIndividualMatrices = () => {
  setMatrixSystem(MATRIX_SYSTEMS.INDIVIDUAL);
  console.log('🎨 Switched to Individual Matrices system');
  console.log(
    `📊 Available individual matrices: ${getIndividualMatrixCount()}`,
  );
};

/**
 * Switch to Skia calculated matrices system
 */
export const useSkiaMatrices = () => {
  setMatrixSystem(MATRIX_SYSTEMS.SKIA);
  console.log('🎨 Switched to Skia calculated matrices system');
};

/**
 * Switch to hardcoded matrices system
 */
export const useHardcodedMatrices = () => {
  setMatrixSystem(MATRIX_SYSTEMS.HARDCODED);
  console.log('🎨 Switched to hardcoded matrices system');
};

/**
 * Switch to AUTO system (best available)
 */
export const useAutoMatrices = () => {
  setMatrixSystem(MATRIX_SYSTEMS.AUTO);
  console.log('🎨 Switched to AUTO matrix system (best available)');
};

/**
 * Get current system status
 */
export const getSystemStatus = () => {
  const currentSystem = getMatrixSystem();
  const availableFilters = listAvailableIndividualMatrices();

  const status = {
    current: currentSystem,
    individualMatrices: {
      count: getIndividualMatrixCount(),
      available: availableFilters,
    },
    systems: {
      individual: MATRIX_SYSTEMS.INDIVIDUAL,
      skia: MATRIX_SYSTEMS.SKIA,
      hardcoded: MATRIX_SYSTEMS.HARDCODED,
      auto: MATRIX_SYSTEMS.AUTO,
    },
  };

  console.log('📊 Matrix System Status:');
  console.log(`  Current System: ${status.current}`);
  console.log(
    `  Individual Matrices: ${status.individualMatrices.count} available`,
  );
  console.log(
    `  Available Filters: ${status.individualMatrices.available
      .slice(0, 5)
      .join(', ')}${
      status.individualMatrices.available.length > 5 ? '...' : ''
    }`,
  );

  return status;
};

/**
 * Test a specific filter with current system
 * @param {string} filterId - Filter to test
 */
export const testFilter = filterId => {
  console.log(`🧪 Testing filter: ${filterId}`);
  console.log(`🎨 Current system: ${getMatrixSystem()}`);

  const matrix = getFilterMatrix(filterId, {}, () => []);

  if (matrix) {
    console.log(
      '✅ Matrix found:',
      matrix.length === 20
        ? 'Valid 20-element matrix'
        : `Invalid ${matrix.length}-element matrix`,
    );
    console.log('📊 Matrix preview:', matrix.slice(0, 5).join(', '), '...');
  } else {
    console.log('❌ No matrix found for this filter');
  }

  return matrix;
};

/**
 * Compare all systems for a specific filter
 * @param {string} filterId - Filter to compare
 */
export const compareFilter = filterId => {
  console.log(`🔍 Comparing systems for filter: ${filterId}`);

  const comparison = compareMatrixSystems(filterId);

  console.log('📊 System Comparison:');
  console.log(
    `  Individual: ${
      comparison.available.individual ? '✅ Available' : '❌ Not available'
    }`,
  );
  console.log(
    `  Skia: ${
      comparison.available.skia ? '✅ Available' : '❌ Not available'
    }`,
  );
  console.log(
    `  Hardcoded: ${
      comparison.available.hardcoded ? '✅ Available' : '❌ Not available'
    }`,
  );

  return comparison;
};

/**
 * Quick test of individual matrices
 */
export const quickTest = () => {
  console.log('⚡ Quick Individual Matrices Test');
  console.log('='.repeat(40));

  const testFilters = ['dexp', 'd3d', 'ccdr', 'nt16', 'instc'];

  testFilters.forEach(filterId => {
    const matrix = getIndividualSkiaMatrix(filterId);
    console.log(
      `${filterId}: ${matrix ? '✅' : '❌'} ${
        matrix ? `(${matrix.length} elements)` : ''
      }`,
    );
  });

  console.log('='.repeat(40));
};

/**
 * List all available individual matrices
 */
export const listMatrices = () => {
  const matrices = listAvailableIndividualMatrices();
  console.log('📋 Available Individual Matrices:');
  matrices.forEach((filterId, index) => {
    console.log(`  ${index + 1}. ${filterId}`);
  });
  console.log(`\nTotal: ${matrices.length} individual matrices`);
  return matrices;
};

// Make functions available globally for console testing
if (typeof global !== 'undefined') {
  global.matrixSystem = {
    useIndividual: useIndividualMatrices,
    useSkia: useSkiaMatrices,
    useHardcoded: useHardcodedMatrices,
    useAuto: useAutoMatrices,
    status: getSystemStatus,
    test: testFilter,
    compare: compareFilter,
    quickTest: quickTest,
    list: listMatrices,
  };

  console.log('🎮 Matrix System Controller loaded!');
  console.log('💡 Available commands:');
  console.log('  matrixSystem.useIndividual() - Use individual matrices');
  console.log('  matrixSystem.useSkia() - Use Skia calculated matrices');
  console.log('  matrixSystem.useHardcoded() - Use hardcoded matrices');
  console.log('  matrixSystem.useAuto() - Use auto system');
  console.log('  matrixSystem.status() - Get system status');
  console.log('  matrixSystem.test("dexp") - Test a specific filter');
  console.log('  matrixSystem.compare("dexp") - Compare systems for a filter');
  console.log('  matrixSystem.quickTest() - Quick test of individual matrices');
  console.log('  matrixSystem.list() - List all available matrices');
}

export default {
  useIndividualMatrices,
  useSkiaMatrices,
  useHardcodedMatrices,
  useAutoMatrices,
  getSystemStatus,
  testFilter,
  compareFilter,
  quickTest,
  listMatrices,
};
