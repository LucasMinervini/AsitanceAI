// Metro lee los alias de import (@domain/*, etc.) desde tsconfig.json automaticamente
// (soporte nativo de Expo), por lo que no hace falta duplicarlos aqui.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
