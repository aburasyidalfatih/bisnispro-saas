import { TwitterApi } from "twitter-api-v2";

export class SocialShareService {
  static async shareToTelegram(botToken: string, chatId: string, text: string) {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || "Failed to share to Telegram");
    return data;
  }

  static async shareToFacebook(pageId: string, accessToken: string, message: string, link: string) {
    const url = new URL(`https://graph.facebook.com/v19.0/${pageId}/feed`);
    url.searchParams.append("access_token", accessToken);
    url.searchParams.append("message", message);
    if (link) url.searchParams.append("link", link);
    
    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Failed to share to Facebook");
    return data;
  }

  static async shareToTwitter(accessToken: string, accessSecret: string, text: string, apiKey: string, apiSecret: string) {
    const client = new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
      accessToken: accessToken,
      accessSecret: accessSecret,
    });
    
    const { data } = await client.v2.tweet(text);
    return data;
  }

  static async shareToInstagram(igUserId: string, accessToken: string, imageUrl: string, caption: string) {
    if (!imageUrl) throw new Error("Instagram requires an image URL");
    
    const url = new URL(`https://graph.facebook.com/v19.0/${igUserId}/media`);
    url.searchParams.append("access_token", accessToken);
    url.searchParams.append("image_url", imageUrl);
    url.searchParams.append("caption", caption);
    
    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Failed to create IG media container");
    
    const creationId = data.id;
    
    const pubUrl = new URL(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`);
    pubUrl.searchParams.append("access_token", accessToken);
    pubUrl.searchParams.append("creation_id", creationId);
    
    const pubRes = await fetch(pubUrl.toString(), { method: "POST" });
    const pubData = await pubRes.json();
    if (pubData.error) throw new Error(pubData.error.message || "Failed to publish IG media");
    
    return pubData;
  }

  static async shareToThreads(threadsUserId: string, accessToken: string, text: string) {
    const url = new URL(`https://graph.threads.net/v1.0/${threadsUserId}/threads`);
    url.searchParams.append("access_token", accessToken);
    url.searchParams.append("media_type", "TEXT");
    url.searchParams.append("text", text);
    
    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "Failed to create Threads media container");
    
    const creationId = data.id;
    
    const pubUrl = new URL(`https://graph.threads.net/v1.0/${threadsUserId}/threads_publish`);
    pubUrl.searchParams.append("access_token", accessToken);
    pubUrl.searchParams.append("creation_id", creationId);
    
    const pubRes = await fetch(pubUrl.toString(), { method: "POST" });
    const pubData = await pubRes.json();
    if (pubData.error) throw new Error(pubData.error.message || "Failed to publish Threads media");
    
    return pubData;
  }
}
