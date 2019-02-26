const { compile } = require('./compile');
const path = require('path');

compile([path.join(__dirname, 'main.ts')]);

// Uncomment to update references
// compile([path.join(__dirname, 'fileTransformation/alias.ts')]);
// compile([path.join(__dirname, 'fileTransformation/normal.ts')]);
