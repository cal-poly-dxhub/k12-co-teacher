# K12 Co-Teacher Frontend

This is a [Next.js](https://nextjs.org) project for the K12 Co-Teacher application, providing an AI-powered classroom assistant interface.

## Configuration

### Environment Variables

The application uses dynamic configuration from AWS CDK outputs. **Do not hardcode any AWS resource IDs or URLs.**

#### For Development

1. **Deploy the CDK stack first** (see `/infra` directory)
2. **Generate environment variables** from CDK outputs:
   ```bash
   # From the project root
   ./scripts/generate-env.sh [stack-name]
   ```
3. **Or manually create** `.env.local` using the template:
   ```bash
   cp .env.local.template .env.local
   # Then update with actual CDK output values
   ```

#### Required Environment Variables

- `NEXT_PUBLIC_OIDC_AUTHORITY` - Cognito User Pool authority URL
- `NEXT_PUBLIC_OIDC_CLIENT_ID` - Cognito User Pool Client ID
- `NEXT_PUBLIC_OIDC_REDIRECT_URI` - OAuth redirect URI
- `NEXT_PUBLIC_WS_URL` - WebSocket API Gateway URL
- `NEXT_PUBLIC_CLASSES_API_ENDPOINT` - Classes API endpoint
- `NEXT_PUBLIC_STUDENTS_API_ENDPOINT` - Students API endpoint
- `NEXT_PUBLIC_STUDENT_PROFILE_API_ENDPOINT` - Student profile API endpoint
- `NEXT_PUBLIC_CHAT_HISTORY_API_ENDPOINT` - Chat history API endpoint
- `NEXT_PUBLIC_INFERENCE_API_ENDPOINT` - Inference API endpoint

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables** (see Configuration section above)

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** with your browser

## Architecture

The frontend integrates with:
- **Amazon Cognito** for authentication (via react-oidc-context)
- **API Gateway REST APIs** for data operations
- **API Gateway WebSocket** for real-time chat
- **AWS Amplify** for hosting (in production)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
