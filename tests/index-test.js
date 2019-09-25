'use strict';

const sandbox = require('sinon').createSandbox();

// Simulating command parameters
[
	'-i',
	'input-path',
	'-o',
	'output-path'

].forEach(argv => {
	process.argv.push(argv);
});

describe('index', () => {

	let YmlBuilder;

	beforeEach(() => {
		sandbox.stub(process, 'exit').returns();
		sandbox.stub(console, 'log').returns();
		YmlBuilder = require('./../lib/yml-builder'); // eslint-disable-line
	});

	afterEach(() => {
		sandbox.restore();
		// clear node require caches
		Object.keys(require.cache).forEach(key => { delete require.cache[key]; });
	});

	it('should run the index script then call YmlBuilder.execute()', () => {

		const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype)
			.expects('execute')
			.returns();

		const index = require('./../index'); // eslint-disable-line

		ymlBuilderMock.verify();
	});

	it('should run the index script then call YmlBuilder.execute() and the operation fails', () => {

		const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype)
			.expects('execute')
			.rejects();

		const index = require('./../index'); // eslint-disable-line

		ymlBuilderMock.verify();
	});

});
