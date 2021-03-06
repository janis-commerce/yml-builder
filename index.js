#!/usr/bin/env node

'use strict';

const { argv } = require('yargs')
	.option('input', {
		alias: 'i',
		describe: 'path to your sources directory',
		type: 'string',
		demandOption: true
	})
	.option('output', {
		alias: 'o',
		describe: 'path to the file that will be generated',
		type: 'string',
		demandOption: true
	});

const log = require('./lib/utils/lllog-wrapper');
const YmlBuilder = require('./lib/yml-builder');

(async () => {

	const { input, output } = argv;

	const ymlBuilder = new YmlBuilder(input, output);

	try {

		await ymlBuilder.execute();

		log.confirm('Operation completed successfully', '✓ YML-BUILDER');

		process.exit(0);

	} catch(error) {

		log.error(error.message, 'Operation failed', '⨯ YML-BUILDER');

		process.exit(1);
	}

})();
