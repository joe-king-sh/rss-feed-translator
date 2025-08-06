import { config } from "dotenv";
config();

import Parser from "rss-parser";
import dayjs from "dayjs";
import { isNewItem, isValidItem } from "./lib/validate";
import { buildErrorMessageBody, buildMessageBody, notify } from "./lib/notify";
import { translate } from "./lib/translate";
import { feeds } from "./feeds";
import { getEnv } from "./env";
import { putHistory } from "./lib/history";

const parser = new Parser({
  customFields: {
    item: ["description"],
  },
});

// feedUrlからオリジンを取得
const getOrigin = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch {
    return "";
  }
};

// 相対パスかどうかを判定
const isRelativePath = (link: string): boolean => {
  return (
    !link.startsWith("http://") &&
    !link.startsWith("https://") &&
    !link.startsWith("//")
  );
};

// 相対パスを絶対URLに変換
const toFullUrl = (link: string, feedUrl: string): string => {
  if (isRelativePath(link)) {
    const origin = getOrigin(feedUrl);
    return `${origin}${link}`;
  }
  return link;
};

export const handler = async () => {
  const nowDate = dayjs();

  const {
    SLACK_INCOMING_WEBHOOK_URL_BLOGS,
    SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS,
  } = getEnv();

  try {
    await Promise.all(
      feeds.map(async (feed) => {
        console.info(`Now processing ${feed.title}...`);
        const posts = await parser.parseURL(feed.url);
        console.info(
          `Now processing ${feed.title}...Found ${posts.items.length} items!`,
        );

        const filteredPosts: typeof posts.items = [];
        for (const item of posts.items) {
          if (!isValidItem(item)) return;

          const isNew = await isNewItem({
            guid: item.guid!,
            nowDate,
            pubDate: dayjs(item.pubDate),
          });
          if (isNew) {
            filteredPosts.push(item);
          }
        }

        const newPosts = await Promise.all(
          filteredPosts.map(async (item) => {
            // リンクをfull URLに変換
            const fullLink = toFullUrl(item.link!, feed.url);

            return {
              id: item.guid!,
              feed: feed.title!,
              title: (await translate(item.title!))!,
              rawTitle: item.title!,
              link: fullLink,
              description: (await translate(item.description!))!,
              rawDescription: item.description!,
              pubDate: item.pubDate!,
            };
          }),
        );

        if (newPosts.length > 0) {
          console.info(`Found ${newPosts.length} new items!`);

          const batchSize = 30;
          for (let i = 0; i < newPosts.length; i += batchSize) {
            const batch = newPosts.slice(i, i + batchSize);
            await notify({
              url:
                feed.type === "blogs"
                  ? SLACK_INCOMING_WEBHOOK_URL_BLOGS
                  : SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS,
              body: buildMessageBody({
                source: feed.title,
                posts: batch,
              }),
            });
          }

          for (const post of newPosts) {
            const publishedAt = dayjs(post.pubDate).toISOString();
            const item = {
              Id: post.id,
              Title: post.rawTitle,
              Type: feed.type,
              Link: post.link, // 既にfull URLに変換済み
              Description: post.rawDescription,
              PublishedAt: publishedAt,
              NotifiedAt: dayjs().toISOString(),
            };
            await putHistory(item);
          }
        }
      }),
    );

    return 0;
  } catch (error) {
    console.error(error);

    if (error instanceof Error) {
      await notify({
        url: SLACK_INCOMING_WEBHOOK_URL_BLOGS,
        body: buildErrorMessageBody({
          source: "Internal Server Error",
          errorMessage: `[配信エラー] エラーが続く場合管理者へ連絡してください。(高額課金の恐れあり) Error: ${error.message}`,
        }),
      });
    }
    return 1;
  }
};

// For local test.
if (require.main === module) {
  handler();
}
