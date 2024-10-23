#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { RssFeedTranslatorStack } from "../lib/rss-feed-translator-stack";

const app = new cdk.App();

const stage = app.node.tryGetContext("stage") || "dev";

new RssFeedTranslatorStack(app, `${stage}-RssFeedTranslator`);
