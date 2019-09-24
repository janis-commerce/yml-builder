'use strict';

const sandbox = require('sinon').createSandbox();
const MockRequire = require('mock-require');

class YmlBuilder {
	async execute() {
		return true;
	}
}

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

	beforeEach(() => {
		sandbox.stub(process, 'exit').returns();
		sandbox.stub(console, 'log').returns();
		MockRequire('./../lib', { YmlBuilder });
	});

	afterEach(() => {
		sandbox.restore();
		MockRequire.stopAll();
		// clear node require caches
		Object.keys(require.cache).forEach(key => { delete require.cache[key]; });
	});

	it('should run the index script without problems', () => {

		const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype)
			.expects('execute')
			.returns();

		const index = require('./../index'); // eslint-disable-line

		ymlBuilderMock.verify();
	});

	it('should run the index script without problems', () => {

		const ymlBuilderMock = sandbox.mock(YmlBuilder.prototype)
			.expects('execute')
			.rejects();

		const index = require('./../index'); // eslint-disable-line

		ymlBuilderMock.verify();
	});

});
