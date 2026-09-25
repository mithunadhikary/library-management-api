const mongoose = require("mongoose");

const borrowSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true
        },

        borrowDate: {
            type: Date,
            default: Date.now
        },

        returnDate: {
            type: Date,
            default: null
        },

        status: {
            type: String,
            enum: ["borrowed", "returned"],
            default: "borrowed"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Borrow", borrowSchema);