const { compile } = require('./compile');
const path = require('path');

compile([path.join(__dirname, '../main.ts')]);

// Uncomment to update references
// compile([path.join(__dirname, '../fixtures/alias.ts')]);
// compile([path.join(__dirname, '../fixtures/normal.ts')]);
// compile([path.join(__dirname, '../fixtures/with-external-reference.ts')]);
