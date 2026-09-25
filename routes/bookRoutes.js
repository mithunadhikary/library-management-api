const express = require("express");

const {
    createBook,
    getBooks,
    getBook,
    updateBook,
    deleteBook
} = require("../controllers/bookController");

const {
    protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getBooks);
router.get("/:id", getBook);

router.post("/", protect, createBook);
router.put("/:id", protect, updateBook);
router.delete("/:id", protect, deleteBook);

module.exports = router;