'use strict';

const fs = require('fs');
const util = require('util');

[
	'stat',
	'readdir',
	'readFile',
	'writeFile',
	'mkdir',
	'rmdir',
	'unlink'

].forEach(method => {
	fs[method] = util.promisify(fs[method]);
});

module.exports = fs;
