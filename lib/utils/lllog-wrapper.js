'use strict';

const chalk = require('chalk');
const logger = require('lllog')();

/**
 * @class Log
 * @classdesc Log messages, errors warnings and confirmations at the right way
 */
class Log {

	static message(message, title) {
		logger.info(
			chalk`{bgBlue {black  ${title} }} ${message}`
		);
	}

	static confirm(message, title) {
		logger.info(
			chalk`{bgGreen {black  ${title} }} {green ${message}}`
		);
	}

	static error(message, description, title) {
		logger.error(
			chalk`{bgRed {black  ${title} }} {red ${description}} ${message}`
		);
	}

	static warn(message, description, title) {
		logger.warn(
			chalk`{bgYellow {black  ${title} }} {yellow ${description}} ${message}`
		);
	}
}

module.exports = Log;
