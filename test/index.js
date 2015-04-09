var expect	= require("chai").expect,
	fs		= require("fs");

describe("Steganography module", function() {
	it("Exposes basic API methods", function() {
		var stego = require("../index");
		expect(stego).to.be.an("object");
		expect(stego.encode).to.be.a("function");
		expect(stego.decode).to.be.a("function");
		expect(stego.encode.length).to.equal(3);
		expect(stego.decode.length).to.equal(2);
	});

	describe("Encoder", function() {

		describe("Steganographic encoding", function() {

			var fixturePath = __dirname + "/fixtures/html-example-1.html",
				htmlCarrier = fs.readFileSync(fixturePath, "utf8"),
				stegoImplementation = require("../index_implementation");

			describe("#_stego", function() {
				var stego = stegoImplementation()._stego,
					unstego = stegoImplementation()._unstego;

				it("should correctly encode data into an HTML carrier", function() {

					var stegoData = "This is the data to be encoded in!",
						encodedResult = stego(stegoData, htmlCarrier),
						expectedLength = (stegoData.length * 4) + (
							htmlCarrier.split(/\s+/).join(" ").length -
							stegoData.length
						),
						decodedMessage = unstego(encodedResult);

					expect(encodedResult).to.be.a("string");
					expect(encodedResult.length)
						.to.gte(expectedLength);

					expect(String(decodedMessage)).to.equal(stegoData);
				});

				it("should correctly encode a large buffer into an HTML carrier", function() {

					var stegoData = Buffer(Array(1024).map(function() { return Math.random() * 255 | 0 })),
						encodedResult = stego(stegoData, htmlCarrier),
						expectedLength = (stegoData.length * 4) + (
							htmlCarrier.split(/\s+/).join(" ").length -
							stegoData.length
						),
						decodedMessage = unstego(encodedResult);

					expect(encodedResult).to.be.a("string");
					expect(encodedResult.length)
						.to.gte(expectedLength);

					expect(decodedMessage).to.eql(stegoData);
				});
			});

			describe("#_encodeChunkToStegoData", function() {
				var encoder =
						stegoImplementation()
							._encodeChunkToStegoData;

				it("Correctly encodes an example string", function() {
					expect(encoder("hello world!"))
						.to.equal("\t  \n\t \t\t\t \r\n\t \r\n\t \r\r\b \n\n\t\r\t\r\t \r\r\t\r\n \t \r\n\t \t\n\b \n\t");
				});

				it("Correctly encodes an example buffer", function() {
					expect(encoder(new Buffer("hello world!")))
						.to.equal("\t  \n\t \t\t\t \r\n\t \r\n\t \r\r\b \n\n\t\r\t\r\t \r\r\t\r\n \t \r\n\t \t\n\b \n\t");
				});

			});

			describe("#_encodeBit", function() {
				var encoder =
						stegoImplementation()
							._encodeBit;

				it("length of encoded bit is always 4", function() {
					for (var dec = 0; dec < 256; dec ++) {
						expect(encoder(dec).length).to.equal(4);
					}
				});

				it("correctly returns encoded values for example bits", function() {

					// Bit values! ["\n", "\t", " ", "\r"]
					// Padding is \b
					expect(encoder(0)).to.equal("\b\b\b\n");
					expect(encoder(1)).to.equal("\b\b\b\t");
					expect(encoder(2)).to.equal("\b\b\b ");
					expect(encoder(3)).to.equal("\b\b\b\r");
					expect(encoder(33)).to.equal("\b \n\t");
					expect(encoder(255)).to.equal("\r\r\r\r");
				});
			});
		});

	});

	describe("Decoder", function() {

		describe("Steganographic decoding", function() {

			var stegoImplementation = require("../index_implementation");

			describe("#_decodeBit", function() {
				var encoder =
						stegoImplementation()
							._encodeBit,
					decoder =
						stegoImplementation()
							._decodeBit;

				it("correctly decodes previously encoded values", function() {
					for (var dec = 0; dec < 256; dec ++) {
						expect(decoder(encoder(dec))).to.equal(dec);
					}
				});
			});

			describe("#_decodeChunkFromStegoData", function() {
				var encoder =
						stegoImplementation()
							._encodeChunkToStegoData,
					decoder =
						stegoImplementation()
							._decodeChunkFromStegoData;

				it("correctly decodes previously encoded data", function() {
					var input	= "Hello all! This is a test."
						encoded = encoder(input),
						decoded = decoder(encoded);

					expect(String(decoded)).to.equal(input);
				});

				it("correctly decodes previously encoded data from a buffer", function() {
					var input	= Buffer(Array(128).map(function() { return Math.random() * 255 | 0 }))
						encoded = encoder(input),
						decoded = decoder(encoded);

					expect(decoded).to.eql(input);
				});
			});

		});

	});

	describe("End-to-end encryption/decryption", function() {
		var privateKey = fs.readFileSync(__dirname + "/fixtures/private_key.pem", "ascii"),
			publicKey = fs.readFileSync(__dirname + "/fixtures/public_key.pem", "ascii"),
			carrier = fs.readFileSync(__dirname + "/fixtures/html-example-1.html", "utf8"),
			stego = require("../index"),
			secret = "This is the secret message. It should be able to be encoded and retrieved!";

		it("is able to decode and decrypt previously encrypted & stego'ed data", function() {
			var encodedData = stego.encode(publicKey, secret, carrier);
			expect(String(stego.decode(privateKey, encodedData))).to.equal(secret);
		});
	});
});