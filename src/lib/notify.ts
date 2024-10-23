import { getEnv } from "../env";

type WebHookMessageBody = {
  text: string;
  blocks: Array<{ type: string; text: { type: string; text: string } }>;
  unfurl_links: boolean;
  username: string;
  icon_emoji: string;
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
}: BuildMessageBodyOptions): BuildMessageBodyResponse => ({
  text: source,
  blocks: posts.map((post) => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `<${post.link}|${post.title}> \n ${post.description.replace(
        /(<([^>]+)>)/gi,
        ""
      )}`,
    },
  })),
  unfurl_links: true,
  username: source,
  icon_emoji: ":aws-logo:",
});

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
