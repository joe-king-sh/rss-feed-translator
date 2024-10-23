import * as Parser from "rss-parser";
import { fetchHistoryById } from "./history";
import dayjs from "dayjs";

export const isNewItem = async (options: {
  pubDate: dayjs.Dayjs;
  nowDate: dayjs.Dayjs;
  guid: string;
}) => {
  const { pubDate, nowDate, guid } = options;

  if (pubDate.isBefore(nowDate.subtract(1, "week"))) {
    return false;
  }

  const historyItem = await fetchHistoryById(guid);
  return historyItem == null;
};

export const isValidItem = (
  feedItem: {
    description: any;
  } & Parser.Item
) => {
  if (
    !feedItem.guid ||
    !feedItem.title ||
    !feedItem.link ||
    !feedItem.description ||
    !feedItem.pubDate
  ) {
    console.warn("Invalid feed item:", feedItem);
    return false;
  }
  return true;
};
