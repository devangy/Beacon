import express from "express";
import asyncHandler from "express-async-handler";
import {
    getFriends,
    searchUsers,
    addFriend,
} from "../controllers/friendController.js";

const router = express.Router();

// More specific routes must come before generic routes
router.get("/:userId/search/:query", asyncHandler(searchUsers)); // search for users by username
router.post("/:userId/add/:friendId", asyncHandler(addFriend)); // add friend
router.get("/:userId", asyncHandler(getFriends)); // get all user friends

export default router;
