# AWS Migration Guide — Looplic

This guide walks through setting up all AWS services to replace Supabase.

---

## Prerequisites

1. Install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
2. Configure AWS CLI with the looplic-developer IAM user:
   ```bash
   aws configure
   # AWS Access Key ID: (get from AWS IAM console)
   # AWS Secret Access Key: (get from AWS IAM console)
   # Default region: ap-south-1
   # Default output format: json
   ```

---

## Phase 1: Amazon RDS PostgreSQL (Database)

### 1a. Create RDS Instance (via AWS Console)

1. Go to **RDS → Create Database**
2. Settings:
   - Engine: **PostgreSQL 16**
   - Template: **Free tier** (dev) or **Production** (prod)
   - DB instance identifier: `looplic-db`
   - Master username: `looplic_admin`
   - Master password: (choose a strong password)
   - DB instance class: `db.t3.micro` (free tier) or `db.t3.medium` (production)
   - Storage: 20 GB gp3
   - **Enable storage autoscaling**: Yes
   - VPC: Default VPC
   - Public access: **Yes** (for initial setup; restrict later)
   - VPC security group: Create new → `looplic-rds-sg`
   - Initial database name: `looplic`
   - Enable automated backups: Yes (7 days)

3. After creation, note the **Endpoint** URL

### 1b. Configure Security Group

Allow inbound PostgreSQL (port 5432) from:
- Your Amplify/EC2 security group (for production)
- Your IP (for initial migration)

```bash
# Get your current IP
curl ifconfig.me

# Add your IP to the security group (replace sg-xxxxx with your SG ID)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 5432 \
  --cidr YOUR_IP/32
```

### 1c. Run the Database Schema

```bash
# Connect to RDS
psql postgresql://looplic_admin:PASSWORD@ENDPOINT:5432/looplic

# Run the schema migration
\i rds-schema.sql
```

### 1d. Export Data from Supabase

1. Go to Supabase Dashboard → Settings → Database → Connection string
2. Run:
```bash
# Export from Supabase (get connection string from Supabase dashboard)
pg_dump "postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-acl \
  -t public.brands \
  -t public.series \
  -t public.models \
  -t public.repair_categories \
  -t public.repair_subcategories \
  -t public.model_repair_services \
  -t public.model_screen_guards \
  -t public.screen_guard_types \
  -t public.screen_guard_categories \
  -t public.app_settings \
  -t public.model_repair_subcategory_prices \
  -t public.bookings \
  -t public.service_bills \
  -t public.booking_inspections \
  -t public.technician_applications \
  > supabase-data-export.sql

# Import into RDS
psql postgresql://looplic_admin:PASSWORD@ENDPOINT:5432/looplic < supabase-data-export.sql
```

### 1e. Set DATABASE_URL

```
DATABASE_URL=postgresql://looplic_admin:PASSWORD@ENDPOINT.ap-south-1.rds.amazonaws.com:5432/looplic
DATABASE_SSL=true
```

---

## Phase 2: Amazon Cognito (Authentication)

### 2a. Create Cognito User Pool

```bash
aws cognito-idp create-user-pool \
  --pool-name "looplic-users" \
  --policies '{"PasswordPolicy":{"MinimumLength":8,"RequireUppercase":false,"RequireLowercase":false,"RequireNumbers":false,"RequireSymbols":false}}' \
  --auto-verified-attributes email \
  --username-attributes email \
  --schema '[{"Name":"email","Required":true,"Mutable":true},{"Name":"name","Required":false,"Mutable":true}]' \
  --email-configuration '{"EmailSendingAccount":"COGNITO_DEFAULT"}' \
  --region ap-south-1
```

Note the **UserPoolId** from the response.

### 2b. Create App Client

```bash
aws cognito-idp create-user-pool-client \
  --user-pool-id YOUR_USER_POOL_ID \
  --client-name "looplic-web" \
  --generate-secret \
  --explicit-auth-flows ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_SRP_AUTH \
  --supported-identity-providers COGNITO Google \
  --callback-urls "https://www.looplic.com/auth/callback" "http://localhost:3000/auth/callback" \
  --logout-urls "https://www.looplic.com/" "http://localhost:3000/" \
  --allowed-o-auth-flows code \
  --allowed-o-auth-scopes email openid profile \
  --allowed-o-auth-flows-user-pool-client \
  --region ap-south-1
```

Note the **ClientId** from the response.

### 2c. Set Up Google OAuth Provider

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URIs: `https://YOUR_COGNITO_DOMAIN/oauth2/idpresponse`
4. Note the Client ID and Secret

```bash
aws cognito-idp create-identity-provider \
  --user-pool-id YOUR_USER_POOL_ID \
  --provider-name Google \
  --provider-type Google \
  --provider-details '{"client_id":"GOOGLE_CLIENT_ID","client_secret":"GOOGLE_CLIENT_SECRET","authorize_scopes":"email openid profile"}' \
  --attribute-mapping '{"email":"email","name":"name"}' \
  --region ap-south-1
```

### 2d. Create Cognito Domain

```bash
aws cognito-idp create-user-pool-domain \
  --domain "looplic-auth" \
  --user-pool-id YOUR_USER_POOL_ID \
  --region ap-south-1
```

Your domain will be: `https://looplic-auth.auth.ap-south-1.amazoncognito.com`

### 2e. Create Admin User (for existing admin accounts)

After setup, re-create your admin users in Cognito:
```bash
# Create admin user in Cognito
aws cognito-idp admin-create-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@looplic.com \
  --user-attributes Name=email,Value=admin@looplic.com Name=name,Value="Admin" Name=email_verified,Value=true \
  --message-action SUPPRESS \
  --region ap-south-1

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@looplic.com \
  --password "YourStrongPassword123!" \
  --permanent \
  --region ap-south-1

# Get the Cognito sub (user ID) for this user
aws cognito-idp admin-get-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username admin@looplic.com \
  --region ap-south-1
```

Then insert the role into RDS:
```sql
INSERT INTO user_roles (user_id, role) VALUES ('COGNITO_SUB_ID', 'admin');
```

### 2f. Set Environment Variables

```
NEXT_PUBLIC_COGNITO_USER_POOL_ID=ap-south-1_XXXXXXXXX
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_COGNITO_DOMAIN=looplic-auth.auth.ap-south-1.amazoncognito.com
NEXT_PUBLIC_AWS_REGION=ap-south-1
NEXT_PUBLIC_APP_URL=https://www.looplic.com
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Phase 3: Amazon S3 (File Storage)

### 3a. Create S3 Bucket

```bash
aws s3api create-bucket \
  --bucket looplic-assets \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket looplic-assets \
  --versioning-configuration Status=Enabled

# Allow public read for image assets
aws s3api put-bucket-policy \
  --bucket looplic-assets \
  --policy '{
    "Version":"2012-10-17",
    "Statement":[{
      "Sid":"PublicReadGetObject",
      "Effect":"Allow",
      "Principal":"*",
      "Action":"s3:GetObject",
      "Resource":"arn:aws:s3:::looplic-assets/public/*"
    }]
  }'

# Set CORS for browser uploads
aws s3api put-bucket-cors \
  --bucket looplic-assets \
  --cors-configuration '{
    "CORSRules":[{
      "AllowedHeaders":["*"],
      "AllowedMethods":["GET","PUT","POST","DELETE"],
      "AllowedOrigins":["https://www.looplic.com","http://localhost:3000"],
      "ExposeHeaders":["ETag"],
      "MaxAgeSeconds":3600
    }]
  }'
```

### 3b. Set Environment Variables

```
NEXT_PUBLIC_S3_BUCKET=looplic-assets
NEXT_PUBLIC_S3_REGION=ap-south-1
```

---

## Phase 4: AWS Amplify (Hosting)

### 4a. Connect Repository

1. Go to **AWS Amplify Console → New App → Host Web App**
2. Connect your GitHub/GitLab repository
3. Select branch: `main`

### 4b. Build Settings

Amplify will auto-detect Next.js. Use these settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: .next
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
      - .next/cache/**/*
```

### 4c. Environment Variables in Amplify

Go to **Amplify → App Settings → Environment Variables** and add all variables from `.env.example`.

### 4d. Custom Domain

1. Amplify Console → Domain Management → Add domain
2. Add `looplic.com` and `www.looplic.com`
3. Follow the DNS verification steps

---

## Phase 5: Migrate Existing Users

Since Cognito has separate user IDs from Supabase, admin/technician users need to:
1. Create account via the new Cognito login page
2. Admin then assigns their role in the `user_roles` table

For automated migration (optional):
```bash
# Export Supabase user emails
# Then bulk create in Cognito and insert roles in RDS
```

---

## Final Checklist

- [ ] RDS PostgreSQL created and schema applied
- [ ] Data exported from Supabase and imported to RDS
- [ ] Cognito User Pool created with Google OAuth
- [ ] Cognito domain configured
- [ ] S3 bucket created with CORS rules
- [ ] Admin users re-created in Cognito with roles in RDS
- [ ] All environment variables set in Amplify
- [ ] Custom domain configured in Amplify
- [ ] DNS records updated to point to Amplify
- [ ] Test all auth flows (login, signup, Google OAuth)
- [ ] Test admin/technician/operation dashboards
- [ ] Test booking creation and catalog display
- [ ] Deactivate Supabase project (after confirming everything works)
