// See https://metareal.blog/en/post/2021/01/16/setup-jest-for-expo-typescript-project/

// By default, all files inside `node_modules` are not transformed. But some 3rd party
// modules are published as untranspiled, Jest will not understand the code in these modules.
// To overcome this, exclude these modules in the ignore pattern.
const untranspiledModulePatterns = [
    '(jest-)?react-native',
    '@react-native-community',
    'expo(nent)?',
    '@expo(nent)?/.*',
    'react-navigation',
    '@react-navigation/.*',
    '@unimodules/.*',
    'unimodules',
    'sentry-expo',
    'native-base',
    'react-native-svg',
    'evergrid',
    '@ungap/weakrefs',
];

module.exports = {
    preset: 'ts-jest',
    transform: { '^.+\\.ts?$': 'ts-jest' },
    testEnvironment: 'node',
    testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',

    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

    // explicitly include any node libs using ESM modules
    transformIgnorePatterns: [
        `node_modules/(?!${untranspiledModulePatterns.join('|')})`,
    ],
};
