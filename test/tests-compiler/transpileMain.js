const { transpile } = require('./transpile');
const path = require('path');

transpile(path.join(__dirname, '../main.ts'));
