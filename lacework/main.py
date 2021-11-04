from laceworksdk import LaceworkClient
import boto3
import os

# Integration Types (https://<myaccount>.lacework.net/api/v1/external/docs)
#   AWS_CFG - Amazon Web Services (AWS) Compliance


def handler(event, context):
    ssm_client = boto3.client('ssm')
    lacework_client = get_lacework_client(ssm_client)

    request_type = event['RequestType']
    role_arn = event['ResourceProperties']['RoleArn']
    external_id = event['ResourceProperties']['ExternalId']

    if request_type == 'Create':
        return on_create(lacework_client, role_arn, external_id)
    elif request_type == 'Update':
        return on_update(lacework_client, role_arn, external_id)
    elif request_type == 'Delete':
        return on_delete(lacework_client, role_arn)
    else:
        raise Exception("Invalid request type: %s" % request_type)


def on_create(lacework_client, role_arn, external_id):
    environment = os.environ['ENVIRONMENT']

    print("Started creating AWS Config integration")
    lacework_client.integrations.create(
        name=f"{environment}-Config",
        type='AWS_CFG',
        enabled=1,
        data={
            "CROSS_ACCOUNT_CREDENTIALS": {
                "EXTERNAL_ID": external_id,
                "ROLE_ARN": role_arn
            }
        }
    )
    print("Finished creating AWS Config integration")


def on_update(lacework_client, role_arn, external_id):
    integration = find_integration(lacework_client, role_arn)

    print("Started updating AWS Config integration")
    lacework_client.integrations.update(
        guid=integration['INTG_GUID'],
        name=integration['NAME'],
        type='AWS_CFG',
        enabled=integration['ENABLED'],
        data={
            "CROSS_ACCOUNT_CREDENTIALS": {
                "EXTERNAL_ID": external_id,
                "ROLE_ARN": role_arn
            }
        }
    )
    print("Finished updating AWS Config integration")


def on_delete(lacework_client, role_arn):
    integration = find_integration(lacework_client, role_arn)

    print(f"Started deleting integration {integration['NAME']}")
    lacework_client.integrations.delete(guid=integration['INTG_GUID'])
    print(f"Finished deleting integration {integration['NAME']}")


def find_integration(lacework_client, role_arn):
    integrations = lacework_client.integrations.get()['data']

    for integration in integrations:
        if integration['TYPE'] in ('AWS_CFG'):
            if (integration['DATA']['CROSS_ACCOUNT_CREDENTIALS']['ROLE_ARN']
                    == role_arn):
                return integration

    raise Exception(
        f"No existing integration found for role arn: {role_arn}"
    )


def get_lacework_client(ssm_client):
    os.environ['LW_ACCOUNT'] = ssm_client.get_parameter(
      Name='/lacework/LW_ACCOUNT'
    )['Parameter']['Value']

    os.environ['LW_SUBACCOUNT'] = ssm_client.get_parameter(
      Name='/lacework/LW_SUBACCOUNT'
    )['Parameter']['Value']

    os.environ['LW_API_KEY'] = ssm_client.get_parameter(
        Name='/lacework/LW_API_KEY',
        WithDecryption=True
    )['Parameter']['Value']

    os.environ['LW_API_SECRET'] = ssm_client.get_parameter(
        Name='/lacework/LW_API_SECRET',
        WithDecryption=True
    )['Parameter']['Value']

    return LaceworkClient()
