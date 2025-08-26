# S3 Static Website Setup

## Prerequisites
- AWS CLI configured with appropriate permissions
- S3 bucket created and configured for static website hosting

## S3 Bucket Configuration

### 1. Create S3 Bucket
```bash
aws s3 mb s3://your-bucket-name --region us-west-2
```

### 2. Enable Static Website Hosting
```bash
aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
```

### 3. Set Bucket Policy for Public Read Access
Create a bucket policy file `bucket-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Apply the policy:
```bash
aws s3api put-bucket-policy --bucket your-bucket-name --policy file://bucket-policy.json
```

### 4. Configure CORS (if needed for API calls)
Create `cors-config.json`:
```json
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
      "AllowedOrigins": ["*"],
      "ExposeHeaders": []
    }
  ]
}
```

Apply CORS:
```bash
aws s3api put-bucket-cors --bucket your-bucket-name --cors-configuration file://cors-config.json
```

## CloudFront Setup (Recommended)

### 1. Create CloudFront Distribution
```bash
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 2. CloudFront Configuration Template
Create `cloudfront-config.json`:
```json
{
  "CallerReference": "your-unique-reference",
  "Comment": "K12 Co-Teacher Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-your-bucket-name",
        "DomainName": "your-bucket-name.s3-website-us-west-2.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-your-bucket-name",
    "ViewerProtocolPolicy": "redirect-to-https",
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
```

## Environment Variables

Set these environment variables for deployment:
```bash
export S3_BUCKET_NAME=your-bucket-name
export AWS_REGION=us-west-2
export CLOUDFRONT_DISTRIBUTION_ID=your-distribution-id
```

## Deployment

1. Build and deploy:
```bash
npm run deploy
```

2. Or manually:
```bash
npm run build
aws s3 sync out/ s3://your-bucket-name/ --delete
```

## Important Notes

- The error document is set to `index.html` to enable client-side routing
- All API calls now go directly to Lambda functions instead of through Next.js API routes
- Environment variables must be prefixed with `NEXT_PUBLIC_` to be available in the browser
- CORS must be configured on your Lambda functions to allow requests from your S3 domain