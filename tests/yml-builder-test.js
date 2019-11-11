'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const path = require('path');
const yaml = require('yaml');
const recursive = require('recursive-readdir');
const fs = require('../lib/utils/promisified-fs');

const YmlBuilder = require('../lib/yml-builder');
const YmlBuilderError = require('../lib/yml-builder-error');

require('lllog')('none');

describe('YmlBuilder', () => {

	const basePath = path.join('tests', 'resources');
	const outputPath = path.join(basePath, 'output.yml');

	const getParentDir = dirPath => path.parse(dirPath).dir;

	const getPath = targetPath => path.join(basePath, targetPath);

	afterEach(() => {
		sandbox.restore();
	});

	describe('execute()', () => {

		it('Should build an array yaml when the received files are array ymls', async () => {

			const ymlBuilder = new YmlBuilder(getPath('valid-array'), outputPath);

			await ymlBuilder.execute();

			const output = await fs.readFile(outputPath, 'utf8');

			assert.deepStrictEqual(yaml.parse(output), [
				{ 'new-item': 'new-property' },
				{ 'some-item': 'some-property' },
				{ 'other-item': 'other-property' }
			]);
		});

		it('Should build an object yaml when the received files are object ymls', async () => {

			const ymlBuilder = new YmlBuilder(getPath('valid-object'), outputPath);

			await ymlBuilder.execute();

			const output = await fs.readFile(outputPath, 'utf8');

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

		it('Should build an empty output file when the received files are empty', async () => {

			const ymlBuilder = new YmlBuilder(getPath('valid-empty'), outputPath);

			await ymlBuilder.execute();

			const output = await fs.readFile(outputPath, 'utf8');

			assert.deepStrictEqual(yaml.parse(output), null);
		});

		it('Should build an empty output file when the received input dir not exists', async () => {

			const ymlBuilder = new YmlBuilder(getPath('fake-dir'), outputPath);

			await ymlBuilder.execute();

			const output = await fs.readFile(outputPath, 'utf8');

			assert.deepStrictEqual(yaml.parse(output), null);
		});

		it('Should build an empty output file when the received input dir is empty', async () => {

			const ymlBuilder = new YmlBuilder(getPath('empty-input'), outputPath);

			await ymlBuilder.execute();

			const output = await fs.readFile(outputPath, 'utf8');

			assert.deepStrictEqual(yaml.parse(output), null);
		});

		it('Should reject when the received files includes array and object ymls mixed', async () => {

			const ymlBuilder = new YmlBuilder(getPath('invalid'), outputPath);

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.YML_BUILD_ERROR
			});

			const files = await fs.readdir(getPath('invalid'));

			const readdirMock = sandbox.mock(fs)
				.expects('readdir')
				.yields(null, files.reverse());

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.YML_BUILD_ERROR
			});

			readdirMock.verify();
			readdirMock.calledWithExactly(path.join(process.cwd(), getPath('invalid')));
		});

		it('Should reject when can\'t write the output file', async () => {

			const ymlBuilder = new YmlBuilder(getPath('valid-array'), outputPath);

			const writeFileMock = sandbox.mock(fs)
				.expects('writeFile')
				.rejects();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.WRITE_OUTPUT_FILE_ERROR
			});

			writeFileMock.verify();
			writeFileMock.calledWithMatch(outputPath, sandbox.match.string, { recursive: true });
		});

		it('Should reject when can\'t read the input directory files', async () => {

			const ymlBuilder = new YmlBuilder(getPath('valid-array'), outputPath);

			const readdirMock = sandbox.mock(fs)
				.expects('readdir')
				.throws();

			await assert.rejects(ymlBuilder.execute(), {
				name: 'YmlBuilderError',
				code: YmlBuilderError.codes.READ_FILES_ERROR
			});

			readdirMock.verify();
			readdirMock.calledWithExactly(path.join(process.cwd(), getPath('valid-array')));
		});
	});
});
