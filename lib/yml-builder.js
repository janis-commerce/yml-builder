'use strict';

const path = require('path');
const YAML = require('yaml');
const mergeYaml = require('merge-yaml');
const recursive = require('recursive-readdir');
const fs = require('./utils/promisified-fs');
const log = require('./utils/lllog-wrapper');

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

	async _validateInputPath(dir) {

		if(!await this._isDirectory(dir))
			throw new YmlBuilderError('The specified input path is not a directory or not exists', YmlBuilderError.codes.INVALID_INPUT_PATH);

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
			throw new YmlBuilderError(`Unable to create the output dir: ${err.message}`, YmlBuilderError.codes.INVALID_INPUT_PATH);
		}
	}

	async _getSourceFiles(dir) {

		try {

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


	async execute(input = this._inputPath, output = this._outputPath) {

		log.message('Checking input directory...', '⚙ YML-BUILDER');
		await this._validateInputPath(input);
		log.confirm('', 'Input directory found', '✓ YML-BUILDER');

		log.message('Checking output file path...', '⚙ YML-BUILDER');
		await this._validateOutputPath(output);
		log.confirm('', 'Output file path is valid', '✓ YML-BUILDER');

		log.message('Building ymls...', '⚙ YML-BUILDER');

		let mergedYaml;

		try {
			mergedYaml = mergeYaml(await this._getSourceFiles(input));
			mergedYaml = YAML.stringify(mergedYaml);
		} catch(err) {
			log.error(err.message, 'Invalid yml', '⨯ YML-BUILDER');
			throw new YmlBuilderError('Failed when building ymls', YmlBuilderError.codes.YML_BUILD_ERROR);
		}

		log.confirm('', 'Build successful', '✓ YML-BUILDER');

		log.message(`Writing file '${output}'...`, '⚙ YML-BUILDER');

		try {
			await fs.writeFile(output, mergedYaml, { recursive: true });
		} catch(err) {
			log.error(err.message, err.code || 'Unknown fs write error', '⨯ YML-BUILDER');
			throw new YmlBuilderError(`Unable to write file '${output}'`, YmlBuilderError.codes.WRITE_OUTPUT_FILE_ERROR);
		}

		log.confirm('', 'Write successful', '✓ YML-BUILDER');
	}
}

module.exports = YmlBuilder;
