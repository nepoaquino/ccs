const mongoose = require("mongoose");
const marked = require("marked");
const createDomPurify = require("dompurify");
const { JSDOM } = require("jsdom");
const dompurify = createDomPurify(new JSDOM().window);

const articleSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: String,
    body: String,
    markedHtml: String
}, { timestamps: true });

articleSchema.pre("validate", function(next) {
    if (this.body) {
        this.markedHtml = dompurify.sanitize(marked.parse(this.body));
    }
    next();
});

module.exports = mongoose.model("article", articleSchema);