import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
  QueryCommandInput,
  PutCommand,
  PutCommandInput,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: "ap-northeast-1",
});
const ddbClient = DynamoDBDocumentClient.from(client);

export const fetchHistoryByGuid = async (guid: string) => {
  const queryParams: QueryCommandInput = {
    TableName: "RSSNotificationHistory",
    ConsistentRead: false,
    KeyConditionExpression: "Guid = :value",
    ExpressionAttributeValues: { ":value": guid },
  };

  try {
    const queryOutput = await ddbClient.send(new QueryCommand(queryParams));
    return queryOutput.Items || [];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

type PutHistoryInput = {
  Guid: string;
  Type: string;
  Link: string;
  Description: string;
  PublishedAt: string;
  NotifiedAt: string;
};

export const putHistory = async (item: PutHistoryInput) => {
  try {
    await ddbClient.send(
      new PutCommand({
        TableName: "RSSNotificationHistory",
        Item: item,
      })
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};
