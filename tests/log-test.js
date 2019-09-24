'use strict';

const sandbox = require('sinon').createSandbox();
const log = require('./../lib/utils/log');

describe('log', () => {

	afterEach(() => {
		sandbox.restore();
	});

	describe('message', () => {

		it('should send a simple log message', () => {

			const consoleMock = sandbox.mock(console)
				.expects('log')
				.returns();

			log.message('some message');

			consoleMock.verify();
		});

		it('should send an error log message', () => {

			const consoleMock = sandbox.mock(console)
				.expects('log')
				.returns();

			log.error('some error message');

			consoleMock.verify();
		});

		it('should send a warning log message', () => {

			const consoleMock = sandbox.mock(console)
				.expects('log')
				.returns();

			log.warn('some warning message');

			consoleMock.verify();
		});

		it('should send a confirmaton log message', () => {

			const consoleMock = sandbox.mock(console)
				.expects('log')
				.returns();

			log.confirm('some confirmation message');

			consoleMock.verify();
		});
	});
});
