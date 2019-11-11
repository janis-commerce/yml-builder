'use strict';

const yaml = require('yaml');
const merge = require('lodash.merge');
const fs = require('./promisified-fs');

/**
 * Read and combine all the received yaml files
 * @param {Array} files yaml files array
 * @returns {Object|Array} combined yaml, it will be an array or an object according to received yamls format.
 * Also returns nothing when all the received files are empty.
 * @throws if try to combine an array yaml with an object yaml or any of the received files is invalid
 * @example
 * combineYaml(['myFile.yml', 'myOtherFile.yml']);
 * // Expected
 *	{
 * 	myProp: myValue
 * 	myOtherProp: { myOtherValue: 1 }
 * }
 */
async function combineYaml(files) {

	let combinedYaml;

	for(const file of files) {

		const rawFile = await fs.readFile(file, 'utf8');
		const parsedFile = yaml.parse(rawFile);

		if(parsedFile === null)
			continue;

		if(Array.isArray(parsedFile)) {

			if(typeof combinedYaml === 'undefined')
				combinedYaml = [];

			if(Array.isArray(combinedYaml)) {
				combinedYaml = [...combinedYaml, ...parsedFile];
				continue;
			}

			throw new Error('Couldn\'t concat yaml files: Can\'t combine objects with arrays.');
		}

		if(typeof combinedYaml === 'undefined')
			combinedYaml = {};

		if(!Array.isArray(parsedFile) && !Array.isArray(combinedYaml)) {
			combinedYaml = merge(combinedYaml, parsedFile);
			continue;
		}

		throw new Error('Couldn\'t concat yaml files: Can\'t combine arrays with objects.');
	}

	return combinedYaml;
}

module.exports = combineYaml;
