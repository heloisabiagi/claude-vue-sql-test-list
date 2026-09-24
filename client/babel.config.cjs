// Jest needs CommonJS output; Vite handles its own ESM build and ignores this file.
module.exports = {
  presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
};
