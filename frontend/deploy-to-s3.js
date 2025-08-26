#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'your-bucket-name';
const REGION = process.env.AWS_REGION || 'us-west-2';
const DISTRIBUTION_ID = process.env.CLOUDFRONT_DISTRIBUTION_ID;

console.log('🚀 Starting S3 deployment process...');

try {
  // Build the static site
  console.log('📦 Building static site...');
  execSync('npm run build', { stdio: 'inherit' });

  // Check if out directory exists
  const outDir = path.join(__dirname, 'out');
  if (!fs.existsSync(outDir)) {
    throw new Error('Build output directory not found. Make sure the build completed successfully.');
  }

  // Create _redirects file for client-side routing
  console.log('📝 Creating redirects configuration...');
  const redirectsContent = `/*    /index.html   200`;
  fs.writeFileSync(path.join(outDir, '_redirects'), redirectsContent);

  // Sync to S3
  console.log(`☁️  Uploading to S3 bucket: ${BUCKET_NAME}...`);
  execSync(`aws s3 sync out/ s3://${BUCKET_NAME}/ --delete --region ${REGION}`, { stdio: 'inherit' });

  // Set proper content types for HTML files
  console.log('🔧 Setting content types...');
  execSync(`aws s3 cp s3://${BUCKET_NAME}/ s3://${BUCKET_NAME}/ --recursive --exclude "*" --include "*.html" --metadata-directive REPLACE --content-type "text/html" --region ${REGION}`, { stdio: 'inherit' });

  // Invalidate CloudFront if distribution ID is provided
  if (DISTRIBUTION_ID) {
    console.log(`🔄 Invalidating CloudFront distribution: ${DISTRIBUTION_ID}...`);
    execSync(`aws cloudfront create-invalidation --distribution-id ${DISTRIBUTION_ID} --paths "/*"`, { stdio: 'inherit' });
  }

  console.log('✅ Deployment completed successfully!');
  console.log(`🌐 Your site should be available at: https://${BUCKET_NAME}.s3-website-${REGION}.amazonaws.com`);

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}