'use strict';

const path = require('path');
const yaml = require('yaml');
const recursive = require('recursive-readdir');
const fs = require('./utils/promisified-fs');
const log = require('./utils/lllog-wrapper');
const combineYaml = require('./utils/combine-yaml');

const YmlBuilderError = require('./yml-builder-error');

/**
 * @class YmlBuilder
 * @classdesc Builds a yml file from multiple yml files
 */
class YmlBuilder {

	constructor(input, output) {
		this.input = input;
		this.output = output;
	}

	get _inputPath() {
		return path.join(process.cwd(), this.input);
	}

	get _outputPath() {
		return path.join(process.cwd(), this.output);
	}

	_isYaml(filePath) {
		return /\.ya?ml$/.test(filePath);
	}

	async _isDirectory(dir) {

		try {

			const stats = await fs.stat(dir);
			return stats.isDirectory();

		} catch(err) {
			// If the directory not exists
			return false;
		}
	}

	async _validateOutputPath(filePath) {

		if(!this._isYaml(filePath))
			throw new YmlBuilderError('The output file must be a yml file', YmlBuilderError.codes.INVALID_OUTPUT_FILE);

		// Check if the parent directory exists
		const parentDir = path.parse(filePath).dir;

		if(!await this._isDirectory(parentDir)) {
			log.warn(`'${parentDir}' not exists, creating...`, 'Output directory not exists', '⚠ YML-BUILDER');
			return this._buildOutputDir(parentDir);
		}
	}

	async _buildOutputDir(dir) {

		try {
			await fs.mkdir(dir, { recursive: true });
		} catch(err) {
			throw new YmlBuilderError(`Unable to create the output dir: ${err.message}`, YmlBuilderError.codes.INVALID_OUTPUT_PATH);
		}
	}

	async _getSourceFiles(dir) {

		try {

			if(!await this._isDirectory(dir))
				return [];

			const resources = await recursive(dir);

			const files = [];

			for(const file of resources) {

				if(!this._isYaml(file)) {
					log.warn(`'${file}' is not a yml file, skipping...`, 'Invalid file', '⚠ YML-BUILDER');
					continue;
				}

				files.push(file);
			}

			return files;

		} catch(err) {
			throw new YmlBuilderError(`An error ocurred while reading source directory: ${err.message}`, YmlBuilderError.codes.READ_FILES_ERROR);
		}
	}


	/**
	 * Merge the ymls from the input directory into a single yml
	 * @param {String} input the input directory for getting ymls to build
	 * @param {String} output the output file path where build the yml
	 * @throws if any of the steps fails
	 * @example
	 * await ymlBuilder.execute('./input-dir', './output-file.yml');
	 */
	async execute(input = this._inputPath, output = this._outputPath) {

		log.message('Checking input directory...', '⚙ YML-BUILDER');

		if(await this._isDirectory(input))
			log.confirm('Input directory found', '✓ YML-BUILDER');
		else
			log.warn('An empty file will be generated', 'Input directory not exists', '⚠ YML-BUILDER');

		log.message('Checking output file path...', '⚙ YML-BUILDER');
		await this._validateOutputPath(output);
		log.confirm('Output file path is valid', '✓ YML-BUILDER');

		log.message('Reading source files...', '⚙ YML-BUILDER');

		const sourceFiles = await this._getSourceFiles(input);

		log.message('Building ymls...', '⚙ YML-BUILDER');

		let combinedYaml;

		try {

			combinedYaml = await combineYaml(sourceFiles);
			combinedYaml = yaml.stringify(combinedYaml);

		} catch(err) {
			log.error(err.message, 'Invalid yml', '⨯ YML-BUILDER');
			throw new YmlBuilderError('Failed when building ymls', YmlBuilderError.codes.YML_BUILD_ERROR);
		}

		log.confirm('Build successful', '✓ YML-BUILDER');

		log.message(`Writing file '${output}'...`, '⚙ YML-BUILDER');

		try {
			await fs.writeFile(output, combinedYaml, { recursive: true });
		} catch(err) {
			log.error(err.message, err.code || 'Unknown fs write error', '⨯ YML-BUILDER');
			throw new YmlBuilderError(`Unable to write file '${output}'`, YmlBuilderError.codes.WRITE_OUTPUT_FILE_ERROR);
		}

		log.confirm('Write successful', '✓ YML-BUILDER');
	}
}

module.exports = YmlBuilder;
