import { Request, Response } from "express";
import { publishPostToAll } from "../services/publish.service.js";

export const postToAllPlatforms = async (
    req: Request,
    res: Response
) => {
    try {
        const { postId } = req.params;
        const userId = req.user.id;

        const result = await publishPostToAll(postId, userId);

        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
