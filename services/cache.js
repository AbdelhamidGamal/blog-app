const mongoose = require("mongoose");
const redis = require("redis");
const utils = require("util");

const store = redis.createClient();
store.hget = utils.promisify(store.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function({ key } = { key: "" }) {
  this.useCache = true;
  this.hashKey = key;
  return this;
};

mongoose.Query.prototype.exec = async function() {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name
  });

  const cachedValue = await store.hget(this.hashKey, key);

  if (cachedValue) {
    const parsedValue = JSON.parse(cachedValue);

    if (Array.isArray(parsedValue)) {
      return parsedValue.map(d => new this.model(d));
    } else {
      return new this.model(parsedValue);
    }
  }

  const result = await exec.apply(this, arguments);

  store.hset(this.hashKey, key, JSON.stringify(result), "EX", 60);

  return result;
};

module.exports = {
  clearHash(hashKey) {
    store.del(hashKey);
  }
};
