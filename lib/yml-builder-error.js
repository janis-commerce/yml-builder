'use strict';

class YmlBuilderError extends Error {

	static get codes() {

		return {
			INVALID_INPUT_PATH: 1,
			INVALID_OUTPUT_PATH: 2,
			INVALID_OUTPUT_FILE: 3,
			READ_FILES_ERROR: 4,
			YML_BUILD_ERROR: 5,
			WRITE_OUTPUT_FILE_ERROR: 6
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'YmlBuilderError';
	}
}

module.exports = YmlBuilderError;
