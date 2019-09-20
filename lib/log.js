'use strict';

const chalk = require('chalk');

/**
 * @class Log
 * @classdesc Log messages, errors warnings and confirmations at the right way
 */
class Log {

	/**
	 * Sends a simple log
	 * @param {String} message The message to show in the log
	 * @param {String} title Default '⊚ INFO' The title for the log
	 * @example
	 * Log.message('Doing something nice :)')
	 */
	static message(message, title = '⊚ INFO') {
		console.log(
			chalk`{bgBlue {black  ${title} }} ${message}`
		);
	}

	/**
	 * Sends an error log
	 * @param {String} message The message to show in the log
	 * @param {String} description The short description of the error
	 * @param {String} title Default '⨯  ERROR' The title for the log
	 * @example
	 * Log.error('Something gone wrong :(','Operation failed')
	 */
	static error(message, description = '', title = '⨯ ERROR') {
		console.log(
			chalk`{bgRed {black  ${title} }} {red ${description}} ${message}`
		);
	}

	/**
	 * Sends a warning log
	 * @param {String} message The message to show in the log
	 * @param {String} description The short description of the warning
	 * @param {String} title Default '⚠  WARNING' The title for the log
	 * @example
	 * Log.warn('This is not right but we can continue')
	 */
	static warn(message, description = '', title = '⚠ WARNING') {
		console.log(
			chalk`{bgYellow {black  ${title} }} {yellow ${description}} ${message}`
		);
	}

	/**
	 * Sends an confirmation log
	 * @param {String} message The message to show in the log
	 * @param {String} description The short description of the message
	 * @param {String} title Default '✓ OK' The title for the log
	 * @example
	 * Log.confirm('','Operation successful')
	 */
	static confirm(message = '', description = '', title = '✓ OK') {
		console.log(
			chalk`{bgGreen {black  ${title} }} {green ${description}} ${message}`
		);
	}
}

module.exports = Log;
