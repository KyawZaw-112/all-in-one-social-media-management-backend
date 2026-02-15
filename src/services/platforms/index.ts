import { postToFacebook } from "./facebook.service";

export async function publishToPlatform(
    account: any,
    content: string,
    mediaUrl?: string
) {
    switch (account.platform) {
        case "facebook":
            return postToFacebook(account, content, mediaUrl);

        default:
            throw new Error("Unsupported platform");
    }
}
