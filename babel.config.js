module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/services': './src/services',
          '@/utils': './src/utils',
          '@/stores': './src/stores',
          '@/styles': './src/styles',
          '@/types': './src/types',
        },
      },
    ],
    'react-native-reanimated/plugin',
  ],
}; 