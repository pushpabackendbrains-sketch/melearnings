const mongoose = require('mongoose')


const CountrySchema = new mongoose.Schema(
  {
    country_code: { type: String, required: true },
    country_name: { type: String, required: true },
    siteId: { type: String, required: true },
    language_name: { type: String, required: true },
    locale:{ type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);


const Country = mongoose.model('Country', CountrySchema);
module.exports = Country;