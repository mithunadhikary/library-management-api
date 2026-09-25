const mongoose = require("mongoose");
const Book = require("../models/Book");

const createBook = async (req, res, next) => {
    try {
        const {
            title,
            author,
            category,
            isbn,
            publishedYear,
            description,
            availableCopies
        } = req.body;

        if (
            !title ||
            !author ||
            !category ||
            !isbn ||
            publishedYear === undefined ||
            availableCopies === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "All required book fields must be provided."
            });
        }

        const existingBook = await Book.findOne({ isbn });

        if (existingBook) {
            return res.status(409).json({
                success: false,
                message: "A book with this ISBN already exists."
            });
        }

        const book = await Book.create({
            title,
            author,
            category,
            isbn,
            publishedYear,
            description,
            availableCopies,
            createdBy: req.user._id
        });

        const populatedBook = await Book.findById(book._id)
            .populate("createdBy", "fullName email role");

        res.status(201).json({
            success: true,
            message: "Book created successfully.",
            data: populatedBook
        });
    } catch (error) {
        next(error);
    }
};

const getBooks = async (req, res, next) => {
    try {
        let {
            page = 1,
            limit = 10,
            search,
            category,
            sort = "desc"
        } = req.query;

        page = Math.max(parseInt(page) || 1, 1);
        limit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

        const filter = {};

        if (search) {
            filter.title = {
                $regex: search,
                $options: "i"
            };
        }

        if (category) {
            filter.category = {
                $regex: `^${category}$`,
                $options: "i"
            };
        }

        const sortOrder = sort === "asc" ? 1 : -1;

        const skip = (page - 1) * limit;

        const [books, total] = await Promise.all([
            Book.find(filter)
                .populate("createdBy", "fullName email")
                .sort({ createdAt: sortOrder })
                .skip(skip)
                .limit(limit),

            Book.countDocuments(filter)
        ]);

        res.status(200).json({
            success: true,
            message: "Books retrieved successfully.",
            data: {
                books,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

const getBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id)
            .populate("createdBy", "fullName email role");

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Book retrieved successfully.",
            data: book
        });
    } catch (error) {
        next(error);
    }
};

const updateBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        const isOwner =
            book.createdBy.toString() === req.user._id.toString();

        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this book."
            });
        }

        const allowedFields = [
            "title",
            "author",
            "category",
            "isbn",
            "publishedYear",
            "description",
            "availableCopies"
        ];

        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) {
                book[field] = req.body[field];
            }
        });

        await book.save();

        res.status(200).json({
            success: true,
            message: "Book updated successfully.",
            data: book
        });
    } catch (error) {
        next(error);
    }
};

const deleteBook = async (req, res, next) => {
    try {
        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                success: false,
                message: "Book not found."
            });
        }

        const isOwner =
            book.createdBy.toString() === req.user._id.toString();

        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this book."
            });
        }

        await book.deleteOne();

        res.status(200).json({
            success: true,
            message: "Book deleted successfully.",
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createBook,
    getBooks,
    getBook,
    updateBook,
    deleteBook
};