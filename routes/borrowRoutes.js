const express = require("express");

const {
    borrowBook,
    returnBook
} = require("../controllers/borrowController");

const {
    protect
} = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, borrowBook);

router.put("/:id/return", protect, returnBook);

module.exports = router;