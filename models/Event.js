const mongoose = require("mongoose");

const event = new mongoose.Schema({
    title: String,
    description: String,
    date: Date,
    reservers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, { timestamps: true });

module.exports = mongoose.model("Event", event);