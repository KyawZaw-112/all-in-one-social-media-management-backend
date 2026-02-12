import { Request, Response } from "express";
import { UserRepository } from "../repositories/user.repository.js";

const repo = new UserRepository();

export class AdminUsersController {
    async getUsers(req: Request, res: Response) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = req.query.search as string;

            const result = await repo.findAll(page, limit, search);

            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    async createUser(req: Request, res: Response) {
        try {
            const user = await repo.create(req.body);
            res.status(201).json(user);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    async updateUser(req: Request, res: Response) {
        try {
            const user = await repo.update(req.params.id, req.body);
            res.json(user);
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }

    async deleteUser(req: Request, res: Response) {
        try {
            await repo.delete(req.params.id);
            res.json({ success: true });
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    }
}
