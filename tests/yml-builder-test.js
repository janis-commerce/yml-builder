'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();
const path = require('path');
const fs = require('fs');
const recursive = require('recursive-readdir');

const YmlBuilder = require('./../lib/yml-builder');
const YmlBuilderError = require('./../lib/yml-builder-error');

const log = require('./../lib/log');

const stubLogs = () => {
	[
		'message',
		'error',
		'warn',
		'confirm'

	].forEach(method => {
		log[method] = sandbox.stub();
	});
};

describe('YmlBuilder', () => {

	beforeEach(() => {
		stubLogs();
	});

	afterEach(() => {
		sandbox.restore();
	});

	it('build the ymls', async () => {

		const recursiveStub = sandbox.stub(recursive).returns([
			path.join(process.cwd(), 'input-path', 'some-file.yml')
		]);

		sandbox.mock(fs).expects('stat')
			.returns({
				isDirectory: () => true
			});

		sandbox.mock(fs).expects('writeFile')
			.returns(true);

		await new YmlBuilder('input-path', 'output-path/some-file.yml').execute();

	});

});
