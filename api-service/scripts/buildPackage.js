const fs = require('fs-extra');
const path = require('path');


// Delete the tests folder and app.js
fs.removeSync(path.join(__dirname, '..', 'dist', 'tests'))
fs.removeSync(path.join(__dirname, '..', 'dist', 'app.js'))
fs.removeSync(path.join(__dirname, '..', 'dist', 'app.d.ts'))
fs.copySync(path.join(__dirname, '..',  'package.json'), path.join(__dirname, '..', 'dist', 'package.json'))
// copy the package.json

