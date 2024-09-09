const jwt = require('jsonwebtoken');
const jwksRsa = require('jwks-rsa');

const tenantName = process.env.B2C_TENANT_NAME;

const validateToken = async (req, res, next) => {
	const bearerToken = req.headers?.authorization?.split(' ')[1] ?? '';
	const {header, payload} = jwt.decode(bearerToken, {complete: true});
	const jwksUri = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${payload.tfp}/discovery/v2.0/keys`

	const client = jwksRsa({
		jwksUri,
		timeout: 10000 // 10sec
	});

	client.getSigningKey(header.kid, (err, key) => {
		if (err) {
			console.info(err);
			throw new Error('Could not get signingKey from JWKS Uri');
		};

		const signingKey = key.publicKey || key.rsaPublicKey;
		
		jwt.verify(bearerToken, signingKey, {
			algorithms: ['RS256'],
			audience: payload.aud,
			issuer: payload.iss
		}, (err, decoded) => {
			if (err?.name === 'TokenExpiredError') {
				console.info(err);
				throw new Error('Provided token has expired');
			}
			console.log('Token is valid', decoded);
		})
	});

	if (!bearerToken) {
		res.status(403);
		return res.end();
	}

	req.auth = {
		userId: payload.emails[0]
	};

	next();
};

module.exports = { validateToken };
