'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const path = require('path');
const fs = require('../lib/utils/promisified-fs'); // eslint-disable-line

const YmlBuilder = require('./../lib/yml-builder');
const YmlBuilderError = require('./../lib/yml-builder-error');

describe('YmlBuilder', () => {

	const ymlBuilder = new YmlBuilder('input-path', 'output-path/output-file.yml');
	const inputPath = path.join(process.cwd(), 'input-path');
	const outputPath = path.join(process.cwd(), 'output-path/output-file.yml');
	const outputPathParentDir = path.parse(outputPath).dir;

	beforeEach(() => {
		sandbox.stub(console, 'log').returns();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('_isDirectory()', () => {

		it('should return true when the specified path is a directory', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.withExactArgs(inputPath)
				.returns({
					isDirectory: () => true
				});

			assert.deepStrictEqual(await ymlBuilder._isDirectory(inputPath), true);

			statMock.verify();
		});

		it('should return false when the specified path is not a directory', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.withExactArgs(inputPath)
				.returns({
					isDirectory: () => false
				});

			assert.deepStrictEqual(await ymlBuilder._isDirectory(inputPath), false);

			statMock.verify();
		});

		it('should return false when the directory not exists', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.withExactArgs(inputPath)
				.rejects();

			assert.deepStrictEqual(await ymlBuilder._isDirectory(inputPath), false);

			statMock.verify();
		});
	});

	describe('_validateOutputPath()', () => {

		it('should not reject when the output file is a yaml file', async () => {

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.withExactArgs(outputPathParentDir)
				.returns(true);

			await assert.doesNotReject(ymlBuilder._validateOutputPath(outputPath));

			isDirectoryMock.verify();
		});

		it('should reject when the output file is not a yaml file', async () => {

			await assert.rejects(ymlBuilder._validateOutputPath('not-an-yml.txt'), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.INVALID_OUTPUT_FILE
			});
		});

		it('should create the output directory when not exists', async () => {

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.withExactArgs(outputPathParentDir)
				.returns(false);

			const buildOutputDirMock = sandbox.mock(YmlBuilder.prototype).expects('_buildOutputDir')
				.withExactArgs(outputPathParentDir)
				.returns();

			await assert.doesNotReject(ymlBuilder._validateOutputPath(outputPath));

			isDirectoryMock.verify();
			buildOutputDirMock.verify();
		});
	});

	describe('_buildOutputDir()', () => {

		it('should create the output directory recursively', async () => {

			const mkdirMock = sandbox.mock(fs).expects('mkdir')
				.withExactArgs(outputPath, { recursive: true })
				.returns();

			await assert.doesNotReject(ymlBuilder._buildOutputDir(outputPath));

			mkdirMock.verify();
		});

		it('should reject when the mkdir rejects', async () => {

			const mkdirMock = sandbox.mock(fs).expects('mkdir')
				.withExactArgs(outputPath, { recursive: true })
				.rejects();

			await assert.rejects(ymlBuilder._buildOutputDir(outputPath), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.INVALID_OUTPUT_PATH
			});

			mkdirMock.verify();
		});
	});

	describe('_getSourceFiles()', () => {

		it('should return only the yml files from the input dir recursively', async () => {

			const fsMock = sandbox.mock(fs);

			fsMock.expects('readdir').withArgs(inputPath)
				.yields(null, [
					'some-file.yml',
					'random-file.txt',
					'more-files'
				]);

			fsMock.expects('readdir').withArgs(path.join(inputPath, 'more-files'))
				.yields(null, [
					'other-file.yml'
				]);

			fsMock.expects('stat').withArgs(path.join(inputPath, 'some-file.yml'))
				.yields(null, {
					isDirectory: () => false
				});

			fsMock.expects('stat').withArgs(path.join(inputPath, 'random-file.txt'))
				.yields(null, {
					isDirectory: () => false
				});

			fsMock.expects('stat').withArgs(path.join(inputPath, 'more-files'))
				.yields(null, {
					isDirectory: () => true
				});

			fsMock.expects('stat').withArgs(path.join(inputPath, 'more-files', 'other-file.yml'))
				.yields(null, {
					isDirectory: () => false
				});

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.withExactArgs(inputPath)
				.returns(true);

			assert.deepStrictEqual(await ymlBuilder._getSourceFiles(inputPath), [
				path.join(inputPath, 'some-file.yml'),
				path.join(inputPath, 'more-files', 'other-file.yml')
			]);

			fsMock.verify();
			isDirectoryMock.verify();
		});

		it('should reject when the fs process fails', async () => {

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.withExactArgs(inputPath)
				.returns(true);

			const fsMock = sandbox.mock(fs).expects('readdir')
				.withArgs(inputPath)
				.yields(new Error('FS ERROR'));

			await assert.rejects(ymlBuilder._getSourceFiles(inputPath), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.READ_FILES_ERROR
			});

			fsMock.verify();
			isDirectoryMock.verify();
		});

		it('should return an empty array when the received input dir not exists', async () => {

			const readdirSpy = sandbox.spy(fs, 'readdir');

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.withExactArgs(inputPath)
				.returns(false);

			assert.deepStrictEqual(await ymlBuilder._getSourceFiles(inputPath), []);

			isDirectoryMock.verify();
			sandbox.assert.notCalled(readdirSpy);
		});
	});

	describe('execute()', () => {

		it('should build the ymls from the input folder into the output file', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const fsMock = sandbox.mock(fs);

			// Generating a fake input-path
			fsMock.expects('stat')
				.withExactArgs(inputPath)
				.twice()
				.returns({
					isDirectory: () => true
				});

			// _validateOutputPath will check if the output file directory exists
			fsMock.expects('stat')
				.withExactArgs(outputPathParentDir)
				.returns({
					isDirectory: () => true
				});

			// _getSourceFiles will read recursively the input directory (using callback)
			fsMock.expects('readdir')
				.withArgs(inputPath)
				.yields(null, [
					'some-file.yml',
					'other-file.yml'
				]);

			// _getSourceFiles will check recursively if everything that readdir returns is a directory (using callback)
			fsMock.expects('stat')
				.withArgs(path.join(inputPath, 'some-file.yml'))
				.yields(null, {
					isDirectory: () => false
				});

			fsMock.expects('stat')
				.withArgs(path.join(inputPath, 'other-file.yml'))
				.yields(null, {
					isDirectory: () => false
				});

			// mergeYaml will read all the received files
			fsMock.expects('readFileSync')
				.withExactArgs(path.join(inputPath, 'some-file.yml'), 'utf8')
				.returns('property: value');

			fsMock.expects('readFileSync')
				.withExactArgs(path.join(inputPath, 'other-file.yml'), 'utf8')
				.returns('otherProperty: value');

			// execute() will write the mergedYaml result into the output file
			fsMock.expects('writeFile')
				.withExactArgs(outputPath, 'property: value\notherProperty: value\n', { recursive: true })
				.returns();

			await assert.doesNotReject(ymlBuilder.execute());

			ymlBuilderMock.verify();
			fsMock.verify();
		});

		it('should reject when the yml build fails', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);

			ymlBuilderMock.expects('_validateOutputPath')
				.withExactArgs(outputPath)
				.returns();

			ymlBuilderMock.expects('_getSourceFiles')
				.withExactArgs(inputPath)
				.rejects();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.YML_BUILD_ERROR
			});

			ymlBuilderMock.verify();
		});

		it('should reject when the output file write process fails', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const fsMock = sandbox.mock(fs);

			ymlBuilderMock.expects('_validateOutputPath')
				.withExactArgs(outputPath)
				.returns();

			ymlBuilderMock.expects('_getSourceFiles')
				.withExactArgs(inputPath)
				.returns([
					path.join(inputPath, 'some-file.yml'),
					path.join(inputPath, 'other-file.yml')
				]);

			fsMock.expects('readFileSync')
				.withExactArgs(path.join(inputPath, 'some-file.yml'), 'utf8')
				.returns('property: value');

			fsMock.expects('readFileSync')
				.withExactArgs(path.join(inputPath, 'other-file.yml'), 'utf8')
				.returns('otherProperty: value');

			fsMock.expects('writeFile')
				.withExactArgs(outputPath, 'property: value\notherProperty: value\n', { recursive: true })
				.rejects();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.WRITE_OUTPUT_FILE_ERROR
			});

			ymlBuilderMock.verify();
			fsMock.verify();
		});

		it('should not reject when the input directory not exists', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const fsMock = sandbox.mock(fs);

			ymlBuilderMock.expects('_isDirectory')
				.withExactArgs(inputPath)
				.twice()
				.returns(false);

			ymlBuilderMock.expects('_validateOutputPath')
				.withExactArgs(outputPath)
				.returns();

			fsMock.expects('writeFile')
				.withExactArgs(outputPath, '\n', { recursive: true })
				.returns();

			await assert.doesNotReject(ymlBuilder.execute());

			ymlBuilderMock.verify();
			fsMock.verify();
		});
	});
});
