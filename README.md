# AWS CDK Lacework Config Integration

An example of how to create the necessary AWS resources for integrating with Lacework for configuration compliance using the AWS CDK.

## Build

To build this app, you need to be in this example's root folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

This will install the AWS CDK, then this example's dependencies, and then build your TypeScript files and your CloudFormation template.

## Setup

In order to deploy this Stack, you'll need to create the following parameters in the AWS Systems Manager -> Parameter Store:

| Name                                   | Type         | Description                                                      | Required |
| -------------------------------------- | ------------ | ---------------------------------------------------------------- | -------- |
| <nobr>`/lacework/EXTERNAL_ID`</nobr>   | String       | A unique string used as an External ID for the Lacework IAM Role | Y        |
| <nobr>`/lacework/LW_ACCOUNT`</nobr>    | String       | Lacework account/organization domain (i.e. `xxxxx`.lacework.net) | Y        |
| <nobr>`/lacework/LW_SUBACCOUNT`</nobr> | String       | Lacework sub-account domain (i.e. `xxxxx`.lacework.net)          | N        |
| <nobr>`/lacework/LW_API_KEY`</nobr>    | SecureString | Lacework API Access Key                                          | Y        |
| <nobr>`/lacework/LW_API_SECRET`</nobr> | SecureString | Lacework API Access Secret                                       | Y        |

## Deploy

Run `cdk deploy`. This will deploy / redeploy your Stack to your AWS Account.

This will also deploy a Lambda function to notify a Lacework account when the integration has been completed.
