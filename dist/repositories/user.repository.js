import { supabaseAdmin } from "../supabaseAdmin.js";
export class UserRepository {
    async findAll(page, limit, search) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        let query = supabaseAdmin
            .from("users")
            .select("*", { count: "exact" })
            .range(from, to)
            .order("created_at", { ascending: false });
        if (search) {
            query = query.ilike("email", `%${search}%`);
        }
        const { data, error, count } = await query;
        if (error)
            throw error;
        return { data, count };
    }
    async findById(id) {
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", id)
            .single();
        if (error)
            throw error;
        return data;
    }
    async create(payload) {
        const { data, error } = await supabaseAdmin
            .from("users")
            .insert(payload)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async update(id, payload) {
        const { data, error } = await supabaseAdmin
            .from("users")
            .update(payload)
            .eq("id", id)
            .select()
            .single();
        if (error)
            throw error;
        return data;
    }
    async delete(id) {
        const { error } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", id);
        if (error)
            throw error;
    }
}
