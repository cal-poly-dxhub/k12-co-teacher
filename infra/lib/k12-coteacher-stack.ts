import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import { Construct } from 'constructs';

export class K12CoTeacherStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'K12CoTeacherUserPool', {
      userPoolName: 'k12-coteacher-users',
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'K12CoTeacherUserPoolClient', {
      userPool,
      userPoolClientName: 'k12-coteacher-client',
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [
          'http://localhost:3000',
          'https://localhost:3000',
          // Amplify domain will be added after deployment
        ],
        logoutUrls: [
          'http://localhost:3000/login',
          'https://localhost:3000/login',
          // Amplify domain will be added after deployment
        ],
      },
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO],
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, 'K12CoTeacherUserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: `k12-coteacher-${cdk.Aws.ACCOUNT_ID}`,
      },
    });

    // DynamoDB Tables
    const chatHistoryTable = new dynamodb.Table(this, 'ChatHistoryTable', {
      tableName: 'k12-coteacher-chat-history',
      partitionKey: { name: 'TeacherId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sortId', type: dynamodb.AttributeType.STRING },
      timeToLiveAttribute: 'expires_at',
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const studentProfilesTable = new dynamodb.Table(this, 'StudentProfilesTable', {
      tableName: 'k12-coteacher-student-profiles',
      partitionKey: { name: 'studentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const classAttributesTable = new dynamodb.Table(this, 'ClassAttributesTable', {
      tableName: 'k12-coteacher-class-attributes',
      partitionKey: { name: 'classId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const classToStudentsTable = new dynamodb.Table(this, 'ClassToStudentsTable', {
      tableName: 'k12-coteacher-class-to-students',
      partitionKey: { name: 'classId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const teacherToClassesTable = new dynamodb.Table(this, 'TeacherToClassesTable', {
      tableName: 'k12-coteacher-teacher-to-classes',
      partitionKey: { name: 'teacherId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Role for Lambda functions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
      inlinePolicies: {
        DynamoDBAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:BatchGetItem',
                'dynamodb:BatchWriteItem',
              ],
              resources: [
                chatHistoryTable.tableArn,
                studentProfilesTable.tableArn,
                classAttributesTable.tableArn,
                classToStudentsTable.tableArn,
                teacherToClassesTable.tableArn,
              ],
            }),
          ],
        }),
        BedrockAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'bedrock:InvokeModel',
                'bedrock:InvokeModelWithResponseStream',
              ],
              resources: ['*'],
            }),
          ],
        }),
        ApiGatewayAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'execute-api:ManageConnections',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Lambda Functions
    const getClassesLambda = new lambda.Function(this, 'GetClassesLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/getClassesForDashboard'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        TEACHER_CLASSES_TABLE: teacherToClassesTable.tableName,
        CLASS_ATTRIBUTES_TABLE: classAttributesTable.tableName,
      },
    });

    const getStudentsLambda = new lambda.Function(this, 'GetStudentsLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/getStudentsForClass'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        CLASS_STUDENTS_TABLE: classToStudentsTable.tableName,
      },
    });

    const getStudentProfileLambda = new lambda.Function(this, 'GetStudentProfileLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/getStudentProfile'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        STUDENT_PROFILES_TABLE: studentProfilesTable.tableName,
      },
    });

    const getChatHistoryLambda = new lambda.Function(this, 'GetChatHistoryLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/getChatHistory'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        CHAT_HISTORY_TABLE: chatHistoryTable.tableName,
      },
    });

    const editStudentProfileLambda = new lambda.Function(this, 'EditStudentProfileLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/editStudentProfile'),
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30),
      environment: {
        STUDENT_PROFILES_TABLE: studentProfilesTable.tableName,
      },
    });

    const inferenceLambda = new lambda.Function(this, 'InferenceLambda', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset('../lambdas/inference'),
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        CHAT_HISTORY_TABLE: chatHistoryTable.tableName,
        STUDENT_PROFILES_TABLE: studentProfilesTable.tableName,
        CLASS_ATTRIBUTES_TABLE: classAttributesTable.tableName,
        CLASS_STUDENTS_TABLE: classToStudentsTable.tableName,
        TEACHER_CLASSES_TABLE: teacherToClassesTable.tableName,
        STUDENT_PROFILE_API_ENDPOINT: `${restApi.url}getStudentProfile`,
        EDIT_STUDENT_PROFILE_API_ENDPOINT: `${restApi.url}editStudentProfile`,
      },
    });

    // REST API Gateway
    const restApi = new apigateway.RestApi(this, 'K12CoTeacherRestApi', {
      restApiName: 'K12 Co-Teacher REST API',
      description: 'REST API for K-12 Co-Teacher application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // REST API Routes
    const getClassesIntegration = new apigateway.LambdaIntegration(getClassesLambda);
    restApi.root.addResource('getClassesForDashboard').addMethod('POST', getClassesIntegration);

    const getStudentsIntegration = new apigateway.LambdaIntegration(getStudentsLambda);
    restApi.root.addResource('getStudentsForClass').addMethod('POST', getStudentsIntegration);

    const getStudentProfileIntegration = new apigateway.LambdaIntegration(getStudentProfileLambda);
    restApi.root.addResource('getStudentProfile').addMethod('POST', getStudentProfileIntegration);

    const getChatHistoryIntegration = new apigateway.LambdaIntegration(getChatHistoryLambda);
    restApi.root.addResource('getHistory').addMethod('POST', getChatHistoryIntegration);

    const editStudentProfileIntegration = new apigateway.LambdaIntegration(editStudentProfileLambda);
    restApi.root.addResource('editStudentProfile').addMethod('POST', editStudentProfileIntegration);

    // WebSocket API Gateway
    const webSocketApi = new apigatewayv2.WebSocketApi(this, 'K12CoTeacherWebSocketApi', {
      apiName: 'K12 Co-Teacher WebSocket API',
      description: 'WebSocket API for real-time chat functionality',
    });

    const webSocketStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi,
      stageName: 'dev',
      autoDeploy: true,
    });

    // WebSocket Routes
    const lambdaIntegration = new integrations.WebSocketLambdaIntegration('InferenceIntegration', inferenceLambda);

    webSocketApi.addRoute('$connect', {
      integration: lambdaIntegration,
    });

    webSocketApi.addRoute('$disconnect', {
      integration: lambdaIntegration,
    });

    webSocketApi.addRoute('$default', {
      integration: lambdaIntegration,
    });

    // AWS Amplify App
    const amplifyApp = new amplify.CfnApp(this, 'K12CoTeacherAmplifyApp', {
      name: 'k12-coteacher-app',
      description: 'K-12 Co-Teacher Next.js Application',
      platform: 'WEB_COMPUTE',
      environmentVariables: [
        {
          name: 'NEXT_PUBLIC_WS_URL',
          value: webSocketStage.url,
        },
        {
          name: 'NEXT_PUBLIC_COGNITO_USER_POOL_ID',
          value: userPool.userPoolId,
        },
        {
          name: 'NEXT_PUBLIC_COGNITO_CLIENT_ID',
          value: userPoolClient.userPoolClientId,
        },
        {
          name: 'NEXT_PUBLIC_COGNITO_DOMAIN',
          value: userPoolDomain.domainName,
        },
        {
          name: 'CLASSES_API_ENDPOINT',
          value: `${restApi.url}getClassesForDashboard`,
        },
        {
          name: 'STUDENTS_API_ENDPOINT',
          value: `${restApi.url}getStudentsForClass`,
        },
        {
          name: 'STUDENT_PROFILE_API_ENDPOINT',
          value: `${restApi.url}getStudentProfile`,
        },
        {
          name: 'NEXT_PUBLIC_CHAT_HISTORY_API',
          value: `${restApi.url}getHistory`,
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
    });

    new cdk.CfnOutput(this, 'UserPoolDomain', {
      value: userPoolDomain.domainName,
      description: 'Cognito User Pool Domain',
    });

    new cdk.CfnOutput(this, 'CognitoAuthUrl', {
      value: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com`,
      description: 'Cognito Authentication URL',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.attrAppId,
      description: 'Amplify App ID',
    });

    new cdk.CfnOutput(this, 'AmplifyAppName', {
      value: amplifyApp.name!,
      description: 'Amplify App Name',
    });
    new cdk.CfnOutput(this, 'RestApiUrl', {
      value: restApi.url,
      description: 'REST API Gateway URL',
    });

    new cdk.CfnOutput(this, 'WebSocketApiUrl', {
      value: webSocketStage.url,
      description: 'WebSocket API Gateway URL',
    });

    new cdk.CfnOutput(this, 'ChatHistoryTableName', {
      value: chatHistoryTable.tableName,
      description: 'DynamoDB Chat History Table Name',
    });
  }
}