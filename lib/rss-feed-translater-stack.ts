import { Duration, Stack, StackProps, RemovalPolicy } from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import { BillingMode } from "aws-cdk-lib/aws-dynamodb";

export class RssFeedTranslaterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const rssFeedTranslaterLambda = new nodejs.NodejsFunction(
      this,
      "rssFeedTranslater",
      {
        entry: "src/index.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_18_X,
        environment: {
          SLACK_INCOMING_WEBHOOK_URL_BLOGS:
            ssm.StringParameter.valueForStringParameter(
              this,
              `/RSS_FEED_TRANSLATER/SLACK_INCOMING_WEBHOOK-URL-BLOGS`
            ),
          SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS:
            ssm.StringParameter.valueForStringParameter(
              this,
              `/RSS_FEED_TRANSLATER/SLACK_INCOMING-WEBHOOK-URL-ANNOUNCEMENTS`
            ),
        },
        functionName: "RssFeedTranslater",
        description: "AWSのRSS情報を読み取り日本語化してSlackに通知する",
        timeout: Duration.seconds(900),
        memorySize: 1024,
      }
    );

    rssFeedTranslaterLambda.role?.attachInlinePolicy(
      new iam.Policy(this, "translateText-policy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["translate:TranslateText"],
            resources: ["*"],
          }),
        ],
      })
    );

    new events.Rule(this, "sampleRule", {
      schedule: events.Schedule.cron({ minute: "*/20" }),
      targets: [
        new targets.LambdaFunction(rssFeedTranslaterLambda, {
          retryAttempts: 3,
        }),
      ],
    );

    const notificationHistoryTable = new dynamodb.Table(
      this,
      `notificationHistory`,
      {
        partitionKey: {
          name: "Guid",
          type: dynamodb.AttributeType.STRING,
        },
        tableName: "RSSNotificationHistory",
        billingMode: BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: false,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    notificationHistoryTable.grantReadData(rssFeedTranslaterLambda);
    notificationHistoryTable.grantWriteData(rssFeedTranslaterLambda);
  }
}
