// Naive steganographic encoder/decoder
//
// PoC uses HTML whitespace to encode encrypted data in
// plain sight.
//
// This isn't terribly sophisticated, and could be discovered
// pretty easily, but demonstrates what's possible.


// publicEncrypt and privateDecrypt are injected via the CommonJS interface
// to this module found in index.js. (They're from the node crypto library)

module.exports = function(publicEncrypt, privateDecrypt) {

	function encode(publicKey, message, carrier) {
		if (!(message instanceof Buffer))
			message = Buffer(message);

		return stego(publicEncrypt({ key: publicKey }, message), carrier);
	}

	function decode(privateKey, carrier) {
		return privateDecrypt({ key: privateKey }, unstego(carrier));
	}

	function stego(data, carrier) {
		if (!(data instanceof Buffer))
			data = Buffer(data);

		// If there's no whitespace in the document, chuck
		// the stego whitespace at the end.
		if (!carrier.match(/\s+/)) {
			return carrier + encodeChunkToStegoData(data);
		}

		var retBuf = "",
			regions = carrier.split(/\s+/),
			whitespaceRegionCount = regions.length,
			bytesPerWhitespaceRegion = (data.length / whitespaceRegionCount | 0) || 1,
			bytesInRemainder = (
				data.length / whitespaceRegionCount > 1 ?
						data.length % whitespaceRegionCount : 0 );

		retBuf +=
			regions.reduce(function(acc, cur, idx) {
				acc += cur;

				if (bytesPerWhitespaceRegion * idx < data.length) {
					return acc +
						encodeChunkToStegoData(
							data.slice(	bytesPerWhitespaceRegion * idx,
										bytesPerWhitespaceRegion * (idx + 1)));
				} else {
					return acc + " ";
				}
			}, "");

		if (bytesInRemainder) {
			retBuf += data.slice(regions.length * bytesPerWhitespaceRegion);
		}

		return retBuf;
	}

	function unstego(carrier) {
		return decodeChunkFromStegoData(
			findStegoStrings(carrier)
		);
	}

	// Translates a string chunk to various space characters
	// which are invisible in HTML
	//
	// Takes a buffer or a string, returns a string

	function encodeChunkToStegoData(input) {
		if (!input) return "";

		if (typeof input === "string")
			input = Buffer(input);

		var retBuf = "";

		for (var byteIdx = 0; byteIdx < input.length; byteIdx++)
			retBuf += encodeBit(input[byteIdx]);

		return retBuf;
	}

	// Quarternary conversion, representation as whitespace.
	function encodeBit(bitValue) {
		var quartChars	= ["\n", "\t", " ", "\r"],
			paddingChar = "\b",
			bitString	= (+bitValue).toString(4),
			retBuf		= "";

		for (var chrIdx = 0; chrIdx < bitString.length; chrIdx++)
			retBuf += quartChars[+bitString[chrIdx]];

		// Pad text with an additional different signifier character
		while (retBuf.length < 4)
			retBuf = paddingChar + retBuf;

		return retBuf;
	}

	function decodeChunkFromStegoData(encodedString) {
		if (encodedString.length % 4) {
			throw new Error("Invalid or improperly padded string!");
		}

		var retBuf = new Buffer(encodedString.length / 4);

		for (var pointer = 0; pointer < retBuf.length; pointer ++) {
			retBuf[pointer] = decodeBit(encodedString.substr(pointer * 4, 4))
		}

		return retBuf;
	}

	function decodeBit(bitString) {
		var quartChars	= ["\n", "\t", " ", "\r"],
			bitValue =
				bitString
					.split("")
					.filter(function(chrComponent) {
						return ~quartChars.indexOf(chrComponent);
					})
					.map(function(chrComponent) {
						return quartChars.indexOf(chrComponent);
					})
					.join("");

		if (!bitValue.length) return 0;

		return parseInt(bitValue, 4);
	}

	function findStegoStrings(carrier) {
		return carrier.match(/[\s\b]{4}/g).join("");
	}

	var interface = {};

	interface.encode = encode;
	interface.decode = decode;
	interface._stego = stego;
	interface._unstego = unstego;
	interface._encodeChunkToStegoData = encodeChunkToStegoData;
	interface._encodeBit = encodeBit;
	interface._decodeChunkFromStegoData = decodeChunkFromStegoData;
	interface._decodeBit = decodeBit;
	interface._findStegoStrings = findStegoStrings;

	return interface;
};

