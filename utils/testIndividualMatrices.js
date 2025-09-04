/**
 * Test Individual Matrices System
 * Simple test utilities to verify individual matrices are working correctly
 */

import {
  getIndividualSkiaMatrix,
  listAvailableIndividualMatrices,
  getIndividualMatrixCount,
  hasIndividualMatrix,
} from './skiaIndividualMatrices';

import {
  getFilterMatrix,
  setMatrixSystem,
  getMatrixSystem,
  MATRIX_SYSTEMS,
  compareMatrixSystems,
} from './filterMatrixUtils';

/**
 * Test all individual matrices
 * @returns {Object} - Test results
 */
export const testAllIndividualMatrices = () => {
  const availableFilters = listAvailableIndividualMatrices();
  const results = {
    total: availableFilters.length,
    tested: 0,
    passed: 0,
    failed: 0,
    details: {},
  };

  console.log('🧪 Testing Individual Matrices System...');
  console.log(`📊 Total filters with individual matrices: ${results.total}`);

  availableFilters.forEach(filterId => {
    try {
      const matrix = getIndividualSkiaMatrix(filterId);
      const hasMatrix = hasIndividualMatrix(filterId);

      if (matrix && hasMatrix && matrix.length === 20) {
        results.passed++;
        results.details[filterId] = {
          status: 'PASS',
          matrixLength: matrix.length,
          hasMatrix: hasMatrix,
        };
      } else {
        results.failed++;
        results.details[filterId] = {
          status: 'FAIL',
          matrixLength: matrix ? matrix.length : 0,
          hasMatrix: hasMatrix,
          error: 'Invalid matrix format',
        };
      }
      results.tested++;
    } catch (error) {
      results.failed++;
      results.details[filterId] = {
        status: 'ERROR',
        error: error.message,
      };
      results.tested++;
    }
  });

  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📈 Success Rate: ${((results.passed / results.tested) * 100).toFixed(1)}%`,
  );

  return results;
};

/**
 * Test matrix system switching
 * @returns {Object} - Test results
 */
export const testMatrixSystemSwitching = () => {
  const testFilter = 'dexp'; // Use a filter that exists in all systems
  const results = {
    filter: testFilter,
    systems: {},
    switching: {},
  };

  console.log('🔄 Testing Matrix System Switching...');

  // Test each system
  Object.values(MATRIX_SYSTEMS).forEach(system => {
    if (system !== MATRIX_SYSTEMS.AUTO) {
      setMatrixSystem(system);
      const matrix = getFilterMatrix(testFilter, {}, () => []);
      results.systems[system] = {
        current: getMatrixSystem(),
        matrix: matrix,
        hasMatrix: matrix && matrix.length === 20,
      };
    }
  });

  // Test AUTO system
  setMatrixSystem(MATRIX_SYSTEMS.AUTO);
  const autoMatrix = getFilterMatrix(testFilter, {}, () => []);
  results.systems.auto = {
    current: getMatrixSystem(),
    matrix: autoMatrix,
    hasMatrix: autoMatrix && autoMatrix.length === 20,
  };

  console.log('✅ Matrix system switching test completed');
  return results;
};

/**
 * Compare different matrix systems for a specific filter
 * @param {string} filterId - Filter to compare
 * @returns {Object} - Comparison results
 */
export const testMatrixComparison = (filterId = 'dexp') => {
  console.log(`🔍 Comparing matrix systems for: ${filterId}`);

  const comparison = compareMatrixSystems(filterId);

  console.log('📊 Matrix System Comparison:');
  console.log(`  Individual: ${comparison.available.individual ? '✅' : '❌'}`);
  console.log(`  Skia: ${comparison.available.skia ? '✅' : '❌'}`);
  console.log(`  Hardcoded: ${comparison.available.hardcoded ? '✅' : '❌'}`);

  return comparison;
};

/**
 * Run all tests
 * @returns {Object} - Complete test results
 */
export const runAllTests = () => {
  console.log('🚀 Running Individual Matrices Test Suite...');
  console.log('='.repeat(50));

  const results = {
    individualMatrices: testAllIndividualMatrices(),
    systemSwitching: testMatrixSystemSwitching(),
    matrixComparison: testMatrixComparison(),
    summary: {},
  };

  // Calculate summary
  results.summary = {
    totalFilters: results.individualMatrices.total,
    passedTests: results.individualMatrices.passed,
    successRate: (
      (results.individualMatrices.passed / results.individualMatrices.tested) *
      100
    ).toFixed(1),
    systemsWorking: Object.keys(results.systemSwitching.systems).length,
    timestamp: new Date().toISOString(),
  };

  console.log('='.repeat(50));
  console.log('📋 TEST SUMMARY:');
  console.log(`  Total Filters: ${results.summary.totalFilters}`);
  console.log(`  Passed Tests: ${results.summary.passedTests}`);
  console.log(`  Success Rate: ${results.summary.successRate}%`);
  console.log(`  Systems Working: ${results.summary.systemsWorking}`);
  console.log('='.repeat(50));

  return results;
};

/**
 * Quick test for a specific filter
 * @param {string} filterId - Filter to test
 * @returns {Object} - Test result
 */
export const quickTest = filterId => {
  console.log(`⚡ Quick test for filter: ${filterId}`);

  const result = {
    filterId,
    individual: null,
    skia: null,
    hardcoded: null,
    auto: null,
  };

  // Test individual matrix
  result.individual = getIndividualSkiaMatrix(filterId);

  // Test with different systems
  setMatrixSystem(MATRIX_SYSTEMS.SKIA);
  result.skia = getFilterMatrix(filterId, {}, () => []);

  setMatrixSystem(MATRIX_SYSTEMS.HARDCODED);
  result.hardcoded = getFilterMatrix(filterId, {}, () => []);

  setMatrixSystem(MATRIX_SYSTEMS.AUTO);
  result.auto = getFilterMatrix(filterId, {}, () => []);

  console.log(`  Individual: ${result.individual ? '✅' : '❌'}`);
  console.log(`  Skia: ${result.skia ? '✅' : '❌'}`);
  console.log(`  Hardcoded: ${result.hardcoded ? '✅' : '❌'}`);
  console.log(`  Auto: ${result.auto ? '✅' : '❌'}`);

  return result;
};

// Export for easy testing
export default {
  testAllIndividualMatrices,
  testMatrixSystemSwitching,
  testMatrixComparison,
  runAllTests,
  quickTest,
};
