# K12 Co-Teacher Frontend - Static Hosting

This frontend has been restructured to work as a static site that can be hosted on Amazon S3, eliminating the need for a server.

## Key Changes Made

### 1. Static Export Configuration
- Updated `next.config.ts` to enable static export
- Configured for S3 hosting with proper asset handling

### 2. API Route Elimination
- Removed all `/api` routes from the Next.js app
- Updated API calls to directly target AWS Lambda functions
- All API endpoints now use `NEXT_PUBLIC_` environment variables

### 3. Client-Side Routing
- Added `ClientRouter` component to handle dynamic routes
- Configured error handling for 404s to redirect to index.html

### 4. Environment Variables
- All environment variables now use `NEXT_PUBLIC_` prefix
- Configuration is now browser-accessible for static hosting

## Deployment Options

### Option 1: S3 + CloudFront (Recommended)
```bash
# Set environment variables
export S3_BUCKET_NAME=your-bucket-name
export AWS_REGION=us-west-2
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id

# Deploy
npm run deploy
```

### Option 2: Manual S3 Deployment
```bash
# Build
npm run build

# Upload to S3
aws s3 sync out/ s3://your-bucket-name/ --delete
```

## Required AWS Configuration

### Lambda Functions
Ensure your Lambda functions have CORS configured to allow requests from your S3 domain:

```javascript
const headers = {
  'Access-Control-Allow-Origin': '*', // Or your specific domain
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
};
```

### S3 Bucket
- Enable static website hosting
- Set index document to `index.html`
- Set error document to `index.html` (for client-side routing)
- Configure public read access

### CloudFront (Optional but Recommended)
- Custom error pages: 404 → /index.html (200 status)
- HTTPS redirect
- Caching optimization

## Environment Variables

Create a `.env.local` file with:

```bash
# Lambda API Endpoints
NEXT_PUBLIC_CLASSES_API_ENDPOINT=https://your-api-gateway.amazonaws.com/dev/getClassesForDashboard
NEXT_PUBLIC_STUDENTS_API_ENDPOINT=https://your-api-gateway.amazonaws.com/dev/getStudentsForClass
NEXT_PUBLIC_STUDENT_PROFILE_API_ENDPOINT=https://your-api-gateway.amazonaws.com/dev/getStudentProfile
NEXT_PUBLIC_CHAT_HISTORY_API_ENDPOINT=https://your-api-gateway.amazonaws.com/dev/getChatHistory
NEXT_PUBLIC_INFERENCE_API_ENDPOINT=https://your-api-gateway.amazonaws.com/dev/inference

# WebSocket URL
NEXT_PUBLIC_WS_URL=wss://your-websocket-api.amazonaws.com/dev

# OIDC Configuration
NEXT_PUBLIC_OIDC_AUTHORITY=https://cognito-idp.region.amazonaws.com/user-pool-id
NEXT_PUBLIC_OIDC_CLIENT_ID=your-client-id
NEXT_PUBLIC_OIDC_REDIRECT_URI=https://your-domain.com
```

## Benefits of Static Hosting

1. **Cost Reduction**: No server costs, only S3 storage and data transfer
2. **Scalability**: Automatic scaling with S3 and CloudFront
3. **Performance**: Global CDN distribution with CloudFront
4. **Reliability**: High availability with AWS infrastructure
5. **Security**: Reduced attack surface with no server-side code

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to S3
npm run deploy
```

## Troubleshooting

### Common Issues

1. **404 Errors on Refresh**: Ensure S3 error document is set to `index.html`
2. **CORS Errors**: Check Lambda function CORS configuration
3. **Environment Variables Not Working**: Ensure they have `NEXT_PUBLIC_` prefix
4. **Dynamic Routes Not Working**: Verify ClientRouter is properly configured

### Debug Mode
Set `NEXT_PUBLIC_DEBUG_MODE=true` to enable detailed logging.

## Migration Checklist

- [x] Configure Next.js for static export
- [x] Remove API routes
- [x] Update API calls to use direct Lambda endpoints
- [x] Add client-side routing support
- [x] Update environment variables with NEXT_PUBLIC_ prefix
- [x] Create deployment scripts
- [x] Update OIDC configuration
- [x] Create S3 setup documentation
- [ ] Configure S3 bucket
- [ ] Set up CloudFront distribution
- [ ] Update Lambda CORS settings
- [ ] Test deployment
- [ ] Update DNS records (if using custom domain)