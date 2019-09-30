'use strict';

const sandbox = require('sinon').createSandbox();
const log = require('./../lib/utils/log');

const stubLog = () => sandbox.stub(console, 'log');

describe('log', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('message()', () => {

		it('should send a simple log message', () => {

			const stub = stubLog();

			stub.returns();

			log.message('some message');

			sandbox.assert.calledOnce(stub);
		});
	});

	describe('error()', () => {

		it('should send an error log message', () => {

			const stub = stubLog();

			stub.returns();

			log.error('some error message');

			sandbox.assert.calledOnce(stub);
		});
	});

	describe('warn()', () => {

		it('should send a warning log message', () => {

			const stub = stubLog();

			stub.returns();

			log.warn('some warning message');

			sandbox.assert.calledOnce(stub);
		});
	});

	describe('confirm()', () => {

		it('should send a confirmaton log message', () => {

			const stub = stubLog();

			stub.returns();

			log.confirm('some confirmation message');

			sandbox.assert.calledOnce(stub);
		});
	});
});
