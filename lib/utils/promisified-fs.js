'use strict';

const fs = require('fs');
const util = require('util');

[
	'stat',
	'readdir',
	'writeFile',
	'mkdir'

].forEach(method => {
	fs[method] = util.promisify(fs[method]);
});

module.exports = fs;