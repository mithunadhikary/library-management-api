const mongoose = require("mongoose");
const Borrow = require("../models/Borrow");
const Book = require("../models/Book");

const borrowBook = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { bookId } = req.body;

        if (!bookId) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "Book ID is required."
            });
        }

        const book = await Book.findById(bookId).session(session);

        if (!book) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        if (book.availableCopies <= 0) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "This book is currently unavailable."
            });
        }

        const existingBorrow = await Borrow.findOne({
            user: req.user._id,
            book: bookId,
            status: "borrowed"
        }).session(session);

        if (existingBorrow) {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "You have already borrowed this book."
            });
        }

        const borrow = await Borrow.create(
            [
                {
                    user: req.user._id,
                    book: bookId
                }
            ],
            { session }
        );

        book.availableCopies -= 1;

        await book.save({ session });

        await session.commitTransaction();

        const result = await Borrow.findById(borrow[0]._id)
            .populate("user", "fullName email")
            .populate("book");

        res.status(201).json({
            success: true,
            message: "Book borrowed successfully.",
            data: result
        });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

const returnBook = async (req, res, next) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const borrow = await Borrow.findById(req.params.id)
            .session(session);

        if (!borrow) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Borrow record not found."
            });
        }

        const isOwner =
            borrow.user.toString() === req.user._id.toString();

        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            await session.abortTransaction();

            return res.status(403).json({
                success: false,
                message: "You are not authorized to return this book."
            });
        }

        if (borrow.status === "returned") {
            await session.abortTransaction();

            return res.status(400).json({
                success: false,
                message: "This book has already been returned."
            });
        }

        const book = await Book.findById(borrow.book)
            .session(session);

        if (!book) {
            await session.abortTransaction();

            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        borrow.status = "returned";
        borrow.returnDate = new Date();

        await borrow.save({ session });

        book.availableCopies += 1;

        await book.save({ session });

        await session.commitTransaction();

        const result = await Borrow.findById(borrow._id)
            .populate("user", "fullName email")
            .populate("book");

        res.status(200).json({
            success: true,
            message: "Book returned successfully.",
            data: result
        });
    } catch (error) {
        await session.abortTransaction();
        next(error);
    } finally {
        session.endSession();
    }
};

module.exports = {
    borrowBook,
    returnBook
};