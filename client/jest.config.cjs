// Pinned so date assertions do not depend on the machine's timezone.
process.env.TZ = 'UTC';

module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.spec.js'],
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.js$': 'babel-jest',
  },
  moduleFileExtensions: ['js', 'json', 'vue'],
  // Vue SFCs import .css; Jest cannot parse it and the tests do not assert on styles.
  moduleNameMapper: {
    '\\.css$': '<rootDir>/src/__tests__/stubs/style.cjs',
  },
  collectCoverageFrom: ['src/components/**/*.vue'],
};
