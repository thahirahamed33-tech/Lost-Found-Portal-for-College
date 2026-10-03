const crypto = require('crypto');

function nanoid(length = 12) {
  return crypto.randomBytes(length).toString('hex').substring(0, length);
}

module.exports = { nanoid };
