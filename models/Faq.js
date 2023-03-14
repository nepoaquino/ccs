const mongoose = require("mongoose");
const marked = require("marked");
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const dompurify = createDomPurify(new JSDOM().window);

const faqSchema = new mongoose.Schema({
  title: String,
  description: String,
  markedHtml: String
}, { timestamps: true });

faqSchema.pre("validate", function(next) {
  if (this.description) {
      this.markedHtml = dompurify.sanitize(marked.parse(this.description));
  }
  next();
});

module.exports = mongoose.model("faq", faqSchema);
