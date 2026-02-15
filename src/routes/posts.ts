import { Router } from "express";
import { postToAllPlatforms } from "../controllers/posts.controller.js";
import {requireSubscription} from "../middleware/requireSubscription.js";

const router = Router();

router.post(
    "/posts/:postId/post-all",
        requireSubscription,
    postToAllPlatforms
);

export default router;