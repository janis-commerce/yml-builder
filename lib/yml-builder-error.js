'use strict';

class YmlBuilderError extends Error {

	static get codes() {

		return {
			INVALID_OUTPUT_PATH: 1,
			INVALID_OUTPUT_FILE: 2,
			READ_FILES_ERROR: 3,
			YML_BUILD_ERROR: 4,
			WRITE_OUTPUT_FILE_ERROR: 5
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
