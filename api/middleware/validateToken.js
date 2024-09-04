const jwt = require('jsonwebtoken');

const validateToken = (req, res, next) => {
	const bearerToken = req.headers?.authorization?.split(' ')[1] ?? '';

	// it should be signed somehow to decode it...
	const decodedToken = jwt.decode(bearerToken);
	console.info('Decoded token from req: ', decodedToken);

	if (!bearerToken) {
		res.status(403);
		return res.end();
	}

	next();
};

module.exports = { validateToken };
