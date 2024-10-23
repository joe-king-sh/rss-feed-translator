# RSS Feed Translator

## これは何？

AWS から英語で提供されている RSS を Amazon Translate で日本語化して Slack へ通知します。

対象の RSS は[AWS Blogs](https://aws.amazon.com/blogs/)と[What's New with AWS](https://aws.amazon.com/about-aws/whats-new/2022)です。  
詳細は[src/feeds.ts](./src/feeds.ts)をご確認ください

### アーキテクチャ

![](./docs/architecture.drawio.png)

### 実行イメージ

| 翻訳前                       | 翻訳後                       |
| ---------------------------- | ---------------------------- |
| ![](./docs/aws-blogs-en.png) | ![](./docs/aws-blogs-ja.png) |

## デプロイ

### 1.パラメーターストアの設定

デプロイ前に以下をパラメーターストアに登録する必要があります

- `/<dev|prod>/RSS_FEED_TRANSLATOR/SLACK_INCOMING_WEBHOOK_URL_BLOGS`
  - AWS Blogs の通知先となる Slack の WebhookURL
- `/<dev|prod>/RSS_FEED_TRANSLATOR/SLACK_INCOMING-WEBHOOK_URL_ANNOUNCEMENTS`
  - What's New と AWS API Changes の通知先となる Slack の WebhookURL

```zsh
STAGE=<dev|prod>
SLACK_INCOMING_WEBHOOK_URL_BLOGS=https://hooks.slack.com/services/xxxxxx/
SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS=https://hooks.slack.com/services/xxxxx/

aws ssm put-parameter --name "/$STAGE/RSS_FEED_TRANSLATOR/SLACK_INCOMING_WEBHOOK_URL_BLOGS" --type "String" --value $RSS_FEED_TRANSLATOR_SLACK_INCOMING_WEBHOOK_URL_BLOGS
aws ssm put-parameter --name "/$STAGE/RSS_FEED_TRANSLATOR/SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS" --type "String" --value $RSS_FEED_TRANSLATOR_SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS
```

### 2. デプロイ

```bash
$ npx cdk deploy -c stage=<dev|prod>
```

## ローカル実行

.env で DRY_RUN=true にすると翻訳、通知、履歴登録をスキップする

```
$ npx ts-node src/index.ts
```
