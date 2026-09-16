module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{js,css,html,png,svg,woff2,woff,ttf,eot,json,map}'
  ],
  swDest: 'dist/sw.js',
  swSrc: 'public/sw.js',
  maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
};