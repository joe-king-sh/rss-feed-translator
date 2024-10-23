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

type RssFeedTranslatorStackProps = StackProps & {
  stage: "dev" | "prod";
};

export class RssFeedTranslatorStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props?: RssFeedTranslatorStackProps
  ) {
    super(scope, id, props);

    const stage = this.node.tryGetContext("stage") || "dev";

    const notificationHistoryTable = new dynamodb.Table(
      this,
      `NotificationHistoryTable`,
      {
        partitionKey: {
          name: "Id",
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: BillingMode.PAY_PER_REQUEST,
        pointInTimeRecovery: false,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    const rssFeedTranslatorLambda = new nodejs.NodejsFunction(
      this,
      "Function",
      {
        entry: "src/index.ts",
        handler: "handler",
        runtime: lambda.Runtime.NODEJS_20_X,
        environment: {
          SLACK_INCOMING_WEBHOOK_URL_BLOGS:
            ssm.StringParameter.valueForStringParameter(
              this,
              `/${stage}/RSS_FEED_TRANSLATOR/SLACK_INCOMING_WEBHOOK_URL_BLOGS`
            ),
          SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS:
            ssm.StringParameter.valueForStringParameter(
              this,
              `/${stage}/RSS_FEED_TRANSLATOR/SLACK_INCOMING_WEBHOOK_URL_ANNOUNCEMENTS`
            ),
          HISTORY_TABLE_NAME: notificationHistoryTable.tableName,
        },
        description: `[${stage}]AWSのRSS情報を読み取り日本語化してSlackに通知する`,
        timeout: Duration.seconds(900),
        memorySize: 1769,
        architecture: lambda.Architecture.ARM_64,
        bundling: {
          sourceMap: true,
        },
      }
    );

    rssFeedTranslatorLambda.role?.attachInlinePolicy(
      new iam.Policy(this, "TranslateText-policy", {
        statements: [
          new iam.PolicyStatement({
            actions: ["translate:TranslateText"],
            resources: ["*"],
          }),
        ],
      })
    );

    new events.Rule(this, "Rule", {
      schedule: events.Schedule.cron({ minute: "*/30" }),
      targets: [
        new targets.LambdaFunction(rssFeedTranslatorLambda, {
          retryAttempts: 0,
        }),
      ],
    });

    notificationHistoryTable.grantReadData(rssFeedTranslatorLambda);
    notificationHistoryTable.grantWriteData(rssFeedTranslatorLambda);
  }
}
