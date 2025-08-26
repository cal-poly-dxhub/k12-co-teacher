#!/usr/bin/env node
import 'source-map-support/register';
import { App, Environment } from 'aws-cdk-lib';
import { K12CoTeacherStack } from '../lib/k12-coteacher-stack';

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
};

new K12CoTeacherStack(app, 'K12CoTeacherStack', { env });