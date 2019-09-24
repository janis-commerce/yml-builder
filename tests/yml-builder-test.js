'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const path = require('path');
const fs = require('../lib/utils/promisified-fs'); // eslint-disable-line

const { YmlBuilder, YmlBuilderError } = require('./../lib/index');

describe('YmlBuilder', () => {

	const ymlBuilder = new YmlBuilder('input-path', 'output-path/output-file.yml');
	const inputPath = path.join(process.cwd(), 'input-path');
	const outputPath = path.join(process.cwd(), 'output-path/output-file.yml');

	beforeEach(() => {
		sandbox.stub(console, 'log').returns();
	});

	afterEach(() => {
		sandbox.restore();
	});

	describe('_isDirectory()', () => {

		it('should return true when the specified path is a directory', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.returns({
					isDirectory: () => true
				});

			assert.deepStrictEqual(await ymlBuilder._isDirectory(inputPath), true);

			statMock.verify();
		});

		it('should return false when the specified path is not a directory', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.returns({
					isDirectory: () => false
				});

			assert.deepStrictEqual(await ymlBuilder._isDirectory(inputPath), false);

			statMock.verify();
		});

		it('should return false when the directory not exists', async () => {

			const statMock = sandbox.mock(fs).expects('stat')
				.rejects();

			assert.deepStrictEqual(await ymlBuilder._isDirectory(inputPath), false);

			statMock.verify();
		});
	});

	describe('_validateInputPath()', () => {

		it('should not reject when the input path is a directory', async () => {

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.returns(true);

			await assert.doesNotReject(ymlBuilder._validateInputPath(inputPath));

			isDirectoryMock.verify();
		});

		it('should reject invalid input dir when the input path is not a directory or not exists', async () => {

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
				.returns(false);

			await assert.rejects(ymlBuilder._validateInputPath(inputPath), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.INVALID_INPUT_PATH
			});

			isDirectoryMock.verify();
		});
	});

	describe('_validateOutputPath()', () => {

		it('should not reject when the output file is a yaml file', async () => {

			const isDirectoryMock = sandbox.mock(YmlBuilder.prototype).expects('_isDirectory')
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
				.returns(false);

			const buildOutputDirMock = sandbox.mock(YmlBuilder.prototype).expects('_buildOutputDir')
				.returns();

			await assert.doesNotReject(ymlBuilder._validateOutputPath(outputPath));

			isDirectoryMock.verify();
			buildOutputDirMock.verify();
		});
	});

	describe('_buildOutputDir()', () => {

		it('should create the output directory recursively', async () => {

			const mkdirMock = sandbox.mock(fs).expects('mkdir')
				.withArgs(outputPath, { recursive: true })
				.returns();

			await assert.doesNotReject(ymlBuilder._buildOutputDir(outputPath));

			mkdirMock.verify();
		});

		it('should reject when the mkdir rejects', async () => {

			const mkdirMock = sandbox.mock(fs).expects('mkdir')
				.withArgs(outputPath, { recursive: true })
				.rejects();

			await assert.rejects(ymlBuilder._buildOutputDir(outputPath), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.INVALID_INPUT_PATH
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

			assert.deepStrictEqual(await ymlBuilder._getSourceFiles(inputPath), [
				path.join(inputPath, 'some-file.yml'),
				path.join(inputPath, 'more-files', 'other-file.yml')
			]);

			fsMock.verify();
		});

		it('should reject when the fs process fails', async () => {

			const fsMock = sandbox.mock(fs).expects('readdir')
				.withArgs(inputPath)
				.yields(new Error('FS ERROR'));

			await assert.rejects(ymlBuilder._getSourceFiles(inputPath), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.READ_FILES_ERROR
			});

			fsMock.verify();
		});
	});

	describe('execute()', () => {

		it('should build the ymls from the input folder into the output file', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);
			const fsMock = sandbox.mock(fs);

			ymlBuilderMock.expects('_validateInputPath')
				.withArgs(inputPath)
				.returns();

			ymlBuilderMock.expects('_validateOutputPath')
				.withArgs(outputPath)
				.returns();

			ymlBuilderMock.expects('_getSourceFiles')
				.withArgs(inputPath)
				.returns([
					path.join(inputPath, 'some-file.yml'),
					path.join(inputPath, 'other-file.yml')
				]);

			fsMock.expects('readFileSync')
				.withArgs(path.join(inputPath, 'some-file.yml'), 'utf8')
				.returns('property: value');

			fsMock.expects('readFileSync')
				.withArgs(path.join(inputPath, 'other-file.yml'), 'utf8')
				.returns('otherProperty: value');

			fsMock.expects('writeFile')
				.withArgs(outputPath, 'property: value\notherProperty: value\n', { recursive: true })
				.returns();

			await assert.doesNotReject(ymlBuilder.execute());

			ymlBuilderMock.verify();
			fsMock.verify();
		});

		it('should reject when the yml build fails', async () => {

			const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype);

			ymlBuilderMock.expects('_validateInputPath')
				.withArgs(inputPath)
				.returns();

			ymlBuilderMock.expects('_validateOutputPath')
				.withArgs(outputPath)
				.returns();

			ymlBuilderMock.expects('_getSourceFiles')
				.withArgs(inputPath)
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

			ymlBuilderMock.expects('_validateInputPath')
				.withArgs(inputPath)
				.returns();

			ymlBuilderMock.expects('_validateOutputPath')
				.withArgs(outputPath)
				.returns();

			ymlBuilderMock.expects('_getSourceFiles')
				.withArgs(inputPath)
				.returns([
					path.join(inputPath, 'some-file.yml'),
					path.join(inputPath, 'other-file.yml')
				]);

			fsMock.expects('readFileSync')
				.withArgs(path.join(inputPath, 'some-file.yml'), 'utf8')
				.returns('property: value');

			fsMock.expects('readFileSync')
				.withArgs(path.join(inputPath, 'other-file.yml'), 'utf8')
				.returns('otherProperty: value');

			fsMock.expects('writeFile')
				.withArgs(outputPath, 'property: value\notherProperty: value\n', { recursive: true })
				.rejects();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.WRITE_OUTPUT_FILE_ERROR
			});

			ymlBuilderMock.verify();
			fsMock.verify();
		});
	});
});
