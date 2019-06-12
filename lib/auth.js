/*
 * Authentication
 */

const jwt = require('jsonwebtoken');

const secretKey = 'SuperSecret!';

exports.requireAuthentication = function (req, res, next) {
  const authHeader = req.get('Authorization') || '';
  const authHeaderParts = authHeader.split(' ');
  const token = authHeaderParts[0] === 'Bearer' ? authHeaderParts[1] : null;

  try {
    const payload = jwt.verify(token, secretKey);
    req.user = payload.sub;
	req.role = payload.role;
    next();
  } catch (err) {
    console.error("  -- error:", err);
    res.status(401).send({
      error: "The specified credentials were invalid."
    });
  }
};

exports.generateAuthToken = function (userId, role) {
  const payload = {
    sub: userId,
	role: role
  };
  const token = jwt.sign(payload, secretKey, { expiresIn: '24h' });
  return token;
};