/** @type {import('vitest').UserConfig} */
module.exports = {
  test: {
    include: ["tests/unit/**/*.test.js", "tests/integration/**/*.test.js"],
    environment: "node",
    globals: true,
    clearMocks: true
  }
};
