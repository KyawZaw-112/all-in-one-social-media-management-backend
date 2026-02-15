import { supabaseAdmin } from "./../supabaseAdmin.js";
import { publishToPlatform } from "./platforms";

export async function publishPostToAll(
    postId: string,
    userId: string
) {
    const { data: post } = await supabaseAdmin
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

    const { data: accounts } = await supabaseAdmin
        .from("social_connections")
        .select("*")
        .eq("user_id", userId);

    const results = [];

    for (const account of accounts) {
        try {
            const response = await publishToPlatform(
                account,
                post.content,
                post.media_url
            );

            results.push({
                platform: account.platform,
                success: true,
                response,
            });
        } catch (error) {
            results.push({
                platform: account.platform,
                success: false,
            });
        }
    }

    return results;
}
