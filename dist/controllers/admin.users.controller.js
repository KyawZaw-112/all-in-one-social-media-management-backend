import { UserRepository } from "../repositories/user.repository.js";
const repo = new UserRepository();
export class AdminUsersController {
    async getUsers(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const search = req.query.search;
            const result = await repo.findAll(page, limit, search);
            res.json(result);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    async createUser(req, res) {
        try {
            const user = await repo.create(req.body);
            res.status(201).json(user);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    async updateUser(req, res) {
        try {
            const user = await repo.update(req.params.id, req.body);
            res.json(user);
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
    async deleteUser(req, res) {
        try {
            await repo.delete(req.params.id);
            res.json({ success: true });
        }
        catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
