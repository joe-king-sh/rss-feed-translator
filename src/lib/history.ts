import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { getEnv } from "../env";

const client = new DynamoDBClient({
  region: "ap-northeast-1",
});
const ddbClient = DynamoDBDocumentClient.from(client);

const { HISTORY_TABLE_NAME } = getEnv();

export const fetchHistoryById = async (id: string) => {
  try {
    const { Item: historyItem } = await ddbClient.send(
      new GetCommand({
        TableName: HISTORY_TABLE_NAME,
        Key: {
          Id: id,
        },
      })
    );

    if (historyItem == null) {
      return null;
    }

    return historyItem;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

type PutHistoryInput = {
  Id: string;
  Title: string;
  Type: string;
  Link: string;
  Description: string;
  PublishedAt: string;
  NotifiedAt: string;
};

export const putHistory = async (item: PutHistoryInput) => {
  const { DRY_RUN } = getEnv();

  if (DRY_RUN) {
    console.info("DRY_RUN is true. Skip pushing history.");
    return;
  }

  try {
    await ddbClient.send(
      new PutCommand({
        TableName: HISTORY_TABLE_NAME,
        Item: item,
      })
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};
