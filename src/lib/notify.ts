import { getEnv } from "../env";

type WebHookMessageBody = {
  text: string;
  blocks: Array<{ type: string; text: { type: string; text: string } }>;
  unfurl_links: boolean;
  username: string;
  icon_emoji: string;
};

// テキストを安全なサイズに切り詰める
const truncateText = (text: string): string => {
  // Slack制限定数
  const maxLength = 1_000; // 各記事のdescriptionの制限
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
};

type BuildMessageBodyOptions = {
  source: string;
  posts: Array<{
    link: string;
    title: string;
    description: string;
  }>;
};
type BuildMessageBodyResponse = WebHookMessageBody;

export const buildMessageBody = ({
  source,
  posts,
}: BuildMessageBodyOptions): BuildMessageBodyResponse => {
  const body: WebHookMessageBody = {
    text: source,
    blocks: posts.map((post) => {
      // descriptionのHTMLタグを除去
      const cleanDescription = post.description.replace(/(<([^>]+)>)/gi, "");

      // descriptionが長すぎる場合は切り詰める
      const truncatedDescription = truncateText(cleanDescription);

      return {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<${post.link}|${post.title}> \n ${truncatedDescription}`,
        },
      };
    }),
    unfurl_links: true,
    username: source,
    icon_emoji: ":aws-logo:",
  };

  return body;
};

// エラーメッセージ用の関数を追加
export const buildErrorMessageBody = ({
  source,
  errorMessage,
}: {
  source: string;
  errorMessage: string;
}): WebHookMessageBody => ({
  text: source,
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: errorMessage,
      },
    },
  ],
  unfurl_links: true,
  username: source,
  icon_emoji: ":aws-logo:",
});

export const notify = async (options: {
  url: string;
  body: WebHookMessageBody;
}) => {
  console.info(JSON.stringify(options.body));

  const { DRY_RUN } = getEnv();

  if (DRY_RUN) {
    console.info("DRY_RUN is true. Skip notification.");
    return;
  }

  const response = await fetch(options.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options.body),
  });
  if (!response.ok) {
    console.error(response);
    throw new Error("Failed to notify");
  }
};
