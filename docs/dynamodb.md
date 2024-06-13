# DynamoDB 設計

## DynamoDB 導入の理由

RSS 側の更新日時と、バッチ実行時間を比較して、更新差分を検知している。
RSS 側の更新日時が、後から更新されるパターンで、更新差分を検知できない問題がある。

RSS 側の記事を識別するキー(記事名が現実的か)を特定し、通知済みの記事を DB 保存し、未通知の記事のみを通知するように通知処理を改善する。

## テーブル設計

テーブル名: NotificationHistory
| Attribute | Type | Key | Example |
| :---------- | :----- | :-- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guid | String | PK | 123e4567-e89b-12d3-a456-426614174000 |
| Type | String | | "blogs" or "announcements" |
| Link | String | | https://aws.amazon.com/jp/blogs/apn/building-a-visual-quality-control-solution-with-amazon-lookout-for-vision-and-advanced-video-preprocessing/ |
| Description | String | | Conveyor belts are an essential material handling tool for various industrial processes, but high throughput rates make it difficult for operators to detect defective products and remove them from the production line. Learn how Grid Dynamics built an advanced video preprocessor and integrated it with Amazon Lookout for Vision, using a food processing use case as an example. Amazon Lookout for Vision is an AutoML service for detecting anomalies in images. |
| PublishedAt | String | | 2014-10-10T13:50:40+09:00 |
| NotifiedAt | String | | 2014-10-10T13:50:40+09:00 |
