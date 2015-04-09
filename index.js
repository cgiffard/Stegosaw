// Common-JS module loader
var crypto = require("crypto");

module.exports = require("./index_implementation")(
		crypto.publicEncrypt,
		crypto.privateDecrypt
	);