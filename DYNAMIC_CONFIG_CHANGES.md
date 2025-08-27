# Dynamic Configuration Implementation

This document summarizes the changes made to ensure the frontend uses dynamically generated Cognito User Pool and other AWS resource configurations instead of hardcoded values.

## Changes Made

### 1. Frontend Authentication Configuration

**File:** `frontend/src/components/AuthProviderWrapper.tsx`
- **Before:** Hardcoded Cognito User Pool ID and Client ID
- **After:** Uses environment variables `NEXT_PUBLIC_OIDC_AUTHORITY` and `NEXT_PUBLIC_OIDC_CLIENT_ID`

### 2. API Route Environment Variables

Updated all API routes to use consistent `NEXT_PUBLIC_*` environment variables:

**Files Updated:**
- `frontend/src/app/api/chat-history/route.ts`
- `frontend/src/app/api/classes/route.ts` 
- `frontend/src/app/api/student-profile/route.ts`
- `frontend/src/app/api/students/route.ts`

**Changes:**
- Standardized environment variable names with `NEXT_PUBLIC_` prefix
- Removed hardcoded API Gateway URLs
- Added placeholder fallback values for development

### 3. WebSocket Configuration

**Files Updated:**
- `frontend/src/app/chat/[classId]/page.tsx`
- `frontend/src/app/chat/[classId]/student/[studentId]/page.tsx`

**Changes:**
- Removed hardcoded WebSocket API Gateway URLs
- Uses `NEXT_PUBLIC_WS_URL` environment variable

### 4. CDK Stack Configuration

**File:** `infra/lib/k12-coteacher-stack.ts`

**Changes:**
- Updated Amplify environment variables to use proper naming convention
- Added `NEXT_PUBLIC_OIDC_AUTHORITY` with dynamic Cognito URL construction
- Ensured all API endpoints are properly exposed to frontend

### 5. Environment Configuration Files

**Files Updated:**
- `frontend/.env.example` - Updated with new variable names and placeholders
- `frontend/.env.local.template` - Created template with instructions

### 6. Automation Script

**File:** `scripts/generate-env.sh`
- Created script to automatically generate `.env.local` from CDK outputs
- Extracts all necessary values from CloudFormation stack
- Provides clear instructions for developers

### 7. Documentation Updates

**Files Updated:**
- `frontend/README.md` - Added comprehensive configuration instructions
- `DYNAMIC_CONFIG_CHANGES.md` - This summary document

## Environment Variables Mapping

| Variable Name | CDK Output | Purpose |
|---------------|------------|---------|
| `NEXT_PUBLIC_OIDC_AUTHORITY` | `UserPoolId` + Region | Cognito authentication authority |
| `NEXT_PUBLIC_OIDC_CLIENT_ID` | `UserPoolClientId` | Cognito client ID |
| `NEXT_PUBLIC_WS_URL` | `WebSocketApiUrl` | WebSocket API Gateway URL |
| `NEXT_PUBLIC_CLASSES_API_ENDPOINT` | `RestApiUrl` + path | Classes API endpoint |
| `NEXT_PUBLIC_STUDENTS_API_ENDPOINT` | `RestApiUrl` + path | Students API endpoint |
| `NEXT_PUBLIC_STUDENT_PROFILE_API_ENDPOINT` | `RestApiUrl` + path | Student profile API endpoint |
| `NEXT_PUBLIC_CHAT_HISTORY_API_ENDPOINT` | `RestApiUrl` + path | Chat history API endpoint |
| `NEXT_PUBLIC_INFERENCE_API_ENDPOINT` | `RestApiUrl` + path | Inference API endpoint |

## Deployment Process

### For Development:
1. Deploy CDK stack: `cd infra && cdk deploy`
2. Generate environment variables: `./scripts/generate-env.sh`
3. Start frontend: `cd frontend && npm run dev`

### For Production (Amplify):
- Environment variables are automatically set by CDK during Amplify app creation
- No manual configuration needed

## Benefits

1. **No Hardcoded Values:** All AWS resource references are dynamic
2. **Environment Isolation:** Different environments can have different configurations
3. **Automated Setup:** Script reduces manual configuration errors
4. **CDK Integration:** Seamless integration with infrastructure as code
5. **Security:** No sensitive values committed to version control

## Verification

To verify the configuration is working:

1. Check that no hardcoded AWS URLs exist in the codebase:
   ```bash
   grep -r "amazonaws.com" frontend/src/
   ```

2. Ensure environment variables are properly loaded:
   ```bash
   # In browser console
   console.log(process.env.NEXT_PUBLIC_OIDC_AUTHORITY);
   ```

3. Test authentication flow with dynamic Cognito configuration

## Migration Notes

- Existing `.env.local` files should be regenerated using the new script
- Any deployment pipelines should be updated to use the new environment variable names
- The CDK stack must be deployed before the frontend can be configured