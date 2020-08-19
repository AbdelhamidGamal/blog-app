const Buffer = require("safe-buffer").Buffer;
const keyGrip = require("keygrip");
const keys = require("../../config/keys");
const keyGripKeys = new keyGrip([keys.cookieKey]);

module.exports = user => {
  const sessionObject = { passport: { user: user._id.toString() } };

  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  const sig = keyGripKeys.sign("session=" + session);

  return { session, sig };
};
