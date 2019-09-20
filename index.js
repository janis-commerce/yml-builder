'use strict';

const { argv } = require('yargs')
	.option('input', {
		alias: 'i',
		describe: 'relative dir for your input files folder',
		type: 'string',
		demandOption: true
	})
	.option('output', {
		alias: 'o',
		describe: 'relative path for the output file',
		type: 'string',
		demandOption: true
	});

const log = require('./lib/log');
const { YmlBuilder } = require('./lib');

(async () => {

	const { input, output } = argv;

	const ymlBuilder = new YmlBuilder(input, output);

	try {

		await ymlBuilder.execute();
		log.confirm('', 'Operation completed successfully');

	} catch(error) {

		log.error(error.message, 'Operation failed');

		process.exit(1);
	}

})();

module.exports = YmlBuilder;
