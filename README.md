# Stegosaw

Proof of concept steganography library, for hiding encrypted secrets in the
whitespace of HTML files. It's rough.

The intention is for this to be used by an HTTP proxy to hide encrypted traffic
in completely innocuous and boring HTML files. The Stegosaw server and client will
be public soon!

It'll accept other kinds of files, but will probably bust them — HTML was chosen
because it collapses whitespace down.

## Getting started

```
npm install stegosaw
```

You'll need an RSA keypair first:

```sh
openssl genrsa -out private_key.pem 4096
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

Now you'll need to load it in:

```js
var privateKey = fs.readFileSync("./private_key.pem", "ascii"),
	publicKey = fs.readFileSync("./public_key.pem", "ascii");
```

And then you'll need your secret message or file — and something to hide it in
(a carrier:)

```js

var carrier = fs.readFileSync("./my-great-web-page.html", "utf8"),
	secret = "This is the secret message. It should be able to be encoded and retrieved!";
```

Then require Stegosaw and do the magic!

```js
var stegosaw = require("stegosaw");

// encode:
var encodedData = stegosaw.encode(publicKey, secret, carrier);

// encode:
stegosaw.decode(privateKey, encodedData);
```

## How it works

Data is initially encrypted via node crypto. The decimal values of the byte data
from the crypto operation are then converted to quaternary, and an ASCII
whitespace character is used to represent each quaternary digit. These sequences
are them embedded in the existing whitespace regions in HTML documents.

## Notes

This is rough, and I'm not a crypto expert, so it's probably best not to use
this to learn steganography or encryption. You've been warned.

## Licence

Copyright (c) 2015, Christopher Giffard.

All rights reserved.

Redistribution and use in source and binary forms, with or without modification, 
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this
  list of conditions and the following disclaimer in the documentation and/or
  other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR 
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.