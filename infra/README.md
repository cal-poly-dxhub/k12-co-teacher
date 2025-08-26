# K-12 Co-Teacher CDK Infrastructure

This CDK project deploys the complete AWS infrastructure for the K-12 Co-Teacher application.

## Architecture

- **5 DynamoDB Tables**: Chat history, student profiles, class attributes, class-to-students mapping, teacher-to-classes mapping
- **6 Lambda Functions**: Data retrieval functions + inference function for chat
- **REST API Gateway**: 5 endpoints for data operations
- **WebSocket API Gateway**: Real-time chat functionality
- **IAM Roles**: Proper permissions for DynamoDB, Bedrock, and API Gateway access

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. Node.js 18+ installed
3. AWS CDK CLI installed: `npm install -g aws-cdk`
4. Bedrock model access enabled (Claude 3.7 Sonnet)

## Deployment

1. Install dependencies:
   ```bash
   cd infra
   npm install
   ```

2. Bootstrap CDK (first time only):
   ```bash
   cdk bootstrap
   ```

3. Deploy the stack:
   ```bash
   cdk deploy
   ```

4. Note the output URLs for REST API and WebSocket API

## Post-Deployment Setup

1. **Populate DynamoDB Tables**: Use the sample data script:
   ```bash
   cd ../sample_data
   python add_to_dynamo.py
   ```

2. **Update Frontend Environment**: Update the API URLs and Cognito config in your frontend `.env.local`:
   ```
   NEXT_PUBLIC_REST_API_URL=<REST_API_URL_FROM_OUTPUT>
   NEXT_PUBLIC_WS_URL=<WEBSOCKET_URL_FROM_OUTPUT>
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=<USER_POOL_ID_FROM_OUTPUT>
   NEXT_PUBLIC_COGNITO_CLIENT_ID=<USER_POOL_CLIENT_ID_FROM_OUTPUT>
   NEXT_PUBLIC_COGNITO_DOMAIN=<USER_POOL_DOMAIN_FROM_OUTPUT>
   ```

3. **Update Callback URLs**: After deploying your frontend to production, update the Cognito callback URLs in the CDK stack and redeploy.

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

## Stack Resources

### DynamoDB Tables
- `k12-coteacher-chat-history` - Stores conversation history and messages
- `k12-coteacher-student-profiles` - Student IEP data and profiles
- `k12-coteacher-class-attributes` - Class metadata
- `k12-coteacher-class-to-students` - Class roster mappings
- `k12-coteacher-teacher-to-classes` - Teacher class assignments

### Authentication
- `Cognito User Pool` - Teacher authentication and user management
- `User Pool Client` - OAuth configuration with callback URLs
- `User Pool Domain` - Hosted UI for authentication

### Lambda Functions
- `GetClassesLambda` - Retrieves classes for teacher dashboard
- `GetStudentsLambda` - Gets student roster for a class
- `GetStudentProfileLambda` - Fetches individual student profiles
- `GetChatHistoryLambda` - Retrieves conversation history
- `EditStudentProfileLambda` - Updates student profile data
- `InferenceLambda` - Handles WebSocket chat with Bedrock integration

### API Endpoints
**REST API:**
- `POST /getClassesForDashboard` - Get teacher's classes
- `POST /getStudentsForClass` - Get class roster
- `POST /getStudentProfile` - Get student profile
- `POST /getHistory` - Get chat history
- `POST /editStudentProfile` - Update student profile

**WebSocket API:**
- `$connect` - WebSocket connection
- `$disconnect` - WebSocket disconnection  
- `$default` - Chat message handling