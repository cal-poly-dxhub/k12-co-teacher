import json
import boto3
import os

def lambda_handler(event, context):
    # Parse request body from API Gateway
    if 'body' in event:
        body = json.loads(event['body'])
        classID = body['classID']
    else:
        classID = event['classID']
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table(os.environ['CLASS_STUDENTS_TABLE'])
    students = table.get_item(Key={'classID': classID})['Item']['students']
    return {
        'statusCode': 200,
        'body': students
    }
