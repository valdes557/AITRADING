const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, default: Date.now },
});

siteConfigSchema.statics.get = async function (key, defaultValue = null) {
  const config = await this.findOne({ key });
  return config ? config.value : defaultValue;
};

siteConfigSchema.statics.set = async function (key, value) {
  return this.findOneAndUpdate(
    { key },
    { key, value, updatedAt: new Date() },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model('SiteConfig', siteConfigSchema);
