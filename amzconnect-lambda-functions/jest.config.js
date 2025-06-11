module.exports = {
  clearMocks: true,
  testEnvironment: 'node',
  roots: ['<rootDir>/src/lambdas/callflowProvisioner/tests'],
  testMatch: ['**/*.test.ts', '**/*.test.js'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  setupFiles: ['<rootDir>/src/lambdas/callflowProvisioner/.jest/setEnvVars.js']
};
