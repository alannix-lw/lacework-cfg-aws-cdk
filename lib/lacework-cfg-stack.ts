import { CfnOutput, Construct, CustomResource, Duration, Stack, StackProps} from '@aws-cdk/core';
import { ArnPrincipal, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role } from '@aws-cdk/aws-iam';
import { StringParameter } from '@aws-cdk/aws-ssm'
import { RetentionDays } from '@aws-cdk/aws-logs';
import { Provider } from '@aws-cdk/custom-resources';
import { PythonFunction } from '@aws-cdk/aws-lambda-python'


export interface LaceworkStackProps extends StackProps {
  envName?: string
  externalId?: string
  laceworkAwsAccount?: number
}

export class LaceworkCfgStack extends Stack {
  constructor(scope: Construct, id: string, props: LaceworkStackProps) {
    super(scope, id, props);

    const LACEWORK_AWS_ACCOUNT = props?.laceworkAwsAccount || 434813966438
    const externalId = props?.externalId ||
      StringParameter.valueForStringParameter(this, '/lacework/EXTERNAL_ID')

    // IAM Role
    const role = new Role(this, 'LaceworkCfgRole', {
      roleName: 'Lacework-Cross-Acct-Config',
      assumedBy: new ArnPrincipal(`arn:aws:iam::${LACEWORK_AWS_ACCOUNT}:root`),
      externalIds: [externalId],
    });
    role.addManagedPolicy(ManagedPolicy.fromAwsManagedPolicyName('SecurityAudit'))

    // IAM Policy Document
    const laceworkAuditPolicyJson = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "GetEbsEncryptionByDefault",
          "Effect": "Allow",
          "Action": "ec2:GetEbsEncryptionByDefault",
          "Resource": "*"
        }
      ]
    }
    const laceworkAuditPolicyDocument = PolicyDocument.fromJson(laceworkAuditPolicyJson);

    // IAM Policy
    const laceworkAuditPolicy = new Policy(this, 'LaceworkPolicy', {
      document: laceworkAuditPolicyDocument,
    })
    laceworkAuditPolicy.attachToRole(role)

    // Setup API Integrations (Custom Resource lambda)
    const onEvent = new PythonFunction(this, 'LaceworkApiFn', {
      entry: 'lacework',
      index: 'main.py',
      functionName: 'LaceworkApiHandler',
      timeout: Duration.minutes(2),
      initialPolicy: [
        new PolicyStatement({
          sid: 'GetLaceworkParameters',
          actions: [ 'ssm:Get*' ],
          resources: [
            `arn:aws:ssm:${this.region}:${this.account}:parameter/lacework/*`
          ]
        })
      ],
      environment: {
        ENVIRONMENT: props?.envName || process.env.ENVIRONMENT || 'development'
      }
    });

    const laceworkApi = new Provider(this, 'LaceworkApiProvider', {
      onEventHandler: onEvent,
      logRetention: RetentionDays.ONE_DAY // default is INFINITE
    });

    new CustomResource(this, 'LaceworkApi', {
      serviceToken: laceworkApi.serviceToken,
      properties: {
        "RoleArn": role.roleArn,
        "ExternalId": externalId
      }
    });

    // Lacework Output
    new CfnOutput(this, 'IAM Role ARN', { value: role.roleArn });
    new CfnOutput(this, 'IAM Role External ID', { value: externalId });
  }
}
