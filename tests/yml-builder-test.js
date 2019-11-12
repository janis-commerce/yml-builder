'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const path = require('path');
const yaml = require('yaml');
const fs = require('../lib/utils/promisified-fs');

const YmlBuilder = require('../lib/yml-builder');
const YmlBuilderError = require('../lib/yml-builder-error');

require('lllog')('none');

describe('YmlBuilder', () => {

	const basePath = path.join('tests', 'resources');
	const outputPath = path.join(basePath, 'output.yml');

	const getPath = targetPath => path.join(basePath, targetPath);
	const makeYmlBuilder = (input, output) => new YmlBuilder(getPath(input), output || outputPath);
	const getOutputFile = async () => fs.readFile(outputPath, 'utf8');

	afterEach(() => {
		sandbox.restore();
	});

	describe('execute()', () => {

		it('Should build an array yaml when the received files are array ymls', async () => {

			const ymlBuilder = makeYmlBuilder('valid-array');

			await ymlBuilder.execute();

			const output = await getOutputFile();

			assert.deepStrictEqual(yaml.parse(output), [
				{ 'new-item': 'new-property' },
				{ 'some-item': 'some-property' },
				{ 'other-item': 'other-property' }
			]);
		});

		it('Should build an object yaml when the received files are object ymls', async () => {

			const ymlBuilder = makeYmlBuilder('valid-object');

			await ymlBuilder.execute();

			const output = await getOutputFile();

			assert.deepStrictEqual(yaml.parse(output), {
				'some-item': {
					property: 'some-property',
					'new-property': 'new-property'
				},
				'other-item': {
					property: 'other-property'
				},
				'new-item': {
					property: 'new-property'
				}
			});
		});

		it('Should create the necessary sub directories specified in output file path', async () => {

			const recursiveOutputPath = path.join(basePath, 'output-dir', 'output.yml');

			const ymlBuilder = makeYmlBuilder('valid-array', recursiveOutputPath);

			const mkdirMock = sandbox.mock(fs)
				.expects('mkdir')
				.withExactArgs(
					path.join(process.cwd(), getPath('output-dir')),
					{ recursive: true }
				)
				.returns();

			const writeFileMock = sandbox.mock(fs)
				.expects('writeFile')
				.returns();

			await ymlBuilder.execute();

			mkdirMock.verify();
			sandbox.assert.calledWithMatch(writeFileMock, recursiveOutputPath, sandbox.match.string, { recursive: true });
		});

		it('Should build an empty output file when the received files are empty', async () => {

			const ymlBuilder = makeYmlBuilder('valid-empty');

			await ymlBuilder.execute();

			const output = await getOutputFile();

			assert.deepStrictEqual(yaml.parse(output), null);
		});

		it('Should build an empty output file when the received input dir not exists', async () => {

			const ymlBuilder = makeYmlBuilder('fake-dir');

			await ymlBuilder.execute();

			const output = await getOutputFile();

			assert.deepStrictEqual(yaml.parse(output), null);
		});

		it('Should build an empty output file when the received input dir is empty', async () => {

			const ymlBuilder = makeYmlBuilder('empty-input');

			await ymlBuilder.execute();

			const output = await getOutputFile();

			assert.deepStrictEqual(yaml.parse(output), null);
		});

		it('Should not reject when there are unsupported file extensions in input directory then ignore them', async () => {

			const ymlBuilder = makeYmlBuilder('unsupported-exts');

			await ymlBuilder.execute();

			const output = await getOutputFile();

			assert.deepStrictEqual(yaml.parse(output), {
				'some-item': {
					property: 'some-property'
				}
			});
		});

		it('Should reject when the specified output file is not a yml file', async () => {

			const ymlBuilder = makeYmlBuilder('valid-array', 'output.txt');

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.INVALID_OUTPUT_FILE
			});
		});

		it('Should reject when can\'t create the output directory (if not exists)', async () => {

			const recursiveOutputPath = path.join(basePath, 'output-dir', 'output.yml');

			const ymlBuilder = makeYmlBuilder('valid-array', recursiveOutputPath);

			const mkdirMock = sandbox.mock(fs)
				.expects('mkdir')
				.withExactArgs(
					path.join(process.cwd(), getPath('output-dir')),
					{ recursive: true }
				)
				.throws();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.INVALID_OUTPUT_PATH
			});

			mkdirMock.verify();
		});

		it('Should reject when the received files includes array and object ymls to combine', async () => {

			const ymlBuilder = makeYmlBuilder('invalid');

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.YML_BUILD_ERROR
			});
		});

		it('Should reject when the received files includes object and array ymls to combine', async () => {

			const ymlBuilder = makeYmlBuilder('invalid');

			const files = await fs.readdir(getPath('invalid'));

			const readdirMock = sandbox.mock(fs)
				.expects('readdir')
				.withArgs(
					path.join(process.cwd(), getPath('invalid'))
				)
				.yields(null, files.reverse());

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.YML_BUILD_ERROR
			});

			readdirMock.verify();
		});

		it('Should reject when can\'t write the output file', async () => {

			const ymlBuilder = makeYmlBuilder('valid-array');

			const writeFileMock = sandbox.mock(fs)
				.expects('writeFile')
				.rejects();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.WRITE_OUTPUT_FILE_ERROR
			});

			writeFileMock.verify();
			sandbox.assert.calledWithMatch(writeFileMock, outputPath, sandbox.match.string, { recursive: true });
		});

		it('Should reject when can\'t read the input directory files', async () => {

			const ymlBuilder = makeYmlBuilder('valid-array');

			const readdirMock = sandbox.mock(fs)
				.expects('readdir')
				.withArgs(
					path.join(process.cwd(), getPath('valid-array'))
				)
				.throws();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.READ_FILES_ERROR
			});

			readdirMock.verify();
		});
	});
});
