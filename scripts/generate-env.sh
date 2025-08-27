#!/bin/bash

# Script to generate .env.local from CDK outputs
# Usage: ./scripts/generate-env.sh [stack-name]

STACK_NAME=${1:-K12CoTeacherStack}
ENV_FILE="frontend/.env.local"

echo "Generating environment variables from CDK stack: $STACK_NAME"

# Get CDK outputs
USER_POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)
COGNITO_AUTH_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CognitoAuthUrl'].OutputValue" --output text)
REST_API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='RestApiUrl'].OutputValue" --output text)
WS_API_URL=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='WebSocketApiUrl'].OutputValue" --output text)
AMPLIFY_APP_ID=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='AmplifyAppId'].OutputValue" --output text)

# Get AWS region
REGION=$(aws configure get region)

# Generate .env.local file
cat > $ENV_FILE << EOF
# Generated automatically from CDK stack: $STACK_NAME
# Generated on: $(date)

# Lambda API Endpoints
NEXT_PUBLIC_CLASSES_API_ENDPOINT=${REST_API_URL}getClassesForDashboard
NEXT_PUBLIC_STUDENTS_API_ENDPOINT=${REST_API_URL}getStudentsForClass
NEXT_PUBLIC_STUDENT_PROFILE_API_ENDPOINT=${REST_API_URL}getStudentProfile
NEXT_PUBLIC_CHAT_HISTORY_API_ENDPOINT=${REST_API_URL}getHistory
NEXT_PUBLIC_INFERENCE_API_ENDPOINT=${REST_API_URL}inference

# WebSocket URL
NEXT_PUBLIC_WS_URL=$WS_API_URL

# OIDC Configuration (Dynamic from CDK)
NEXT_PUBLIC_OIDC_AUTHORITY=https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}
NEXT_PUBLIC_OIDC_CLIENT_ID=$CLIENT_ID
NEXT_PUBLIC_OIDC_REDIRECT_URI=https://localhost:3000

# Enable detailed logging for debugging
NEXT_PUBLIC_DEBUG_MODE=true
EOF

echo "Environment file generated: $ENV_FILE"
echo ""
echo "CDK Outputs:"
echo "  User Pool ID: $USER_POOL_ID"
echo "  Client ID: $CLIENT_ID"
echo "  Cognito Auth URL: $COGNITO_AUTH_URL"
echo "  REST API URL: $REST_API_URL"
echo "  WebSocket URL: $WS_API_URL"
echo "  Amplify App ID: $AMPLIFY_APP_ID"
echo ""
echo "Note: Update NEXT_PUBLIC_OIDC_REDIRECT_URI with your actual Amplify domain after deployment"