# Render.com Deployment Guide

This guide provides step-by-step instructions for deploying the RMQ NestJS backend to Render.com with Supabase integration.

## Prerequisites

- GitHub repository with your code pushed
- Supabase project with the following information:
  - Project URL (e.g., `https://msjzaofoazznvcdsjeby.supabase.co`)
  - PostgreSQL connection string (`postgresql://postgres.msjzaofoazznvcdsjeby:YourPassword@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`)
  - Supabase Anon Key (from Project Settings → API)
- Secret keys for JWT authentication (for both access and refresh tokens)

## Deployment Steps

### 1. Sign Up for Render.com

Create an account at [render.com](https://render.com/) if you don't already have one.

### 2. Create a New Web Service

1. Click the "New+" button in the top right corner
2. Select "Web Service"
3. Connect your GitHub repository
4. Grant Render.com permission to access your repository

### 3. Configure Your Service

Enter the following details for your service:

- **Name**: Choose a descriptive name (e.g., `rmq-api`)
- **Environment**: `Node`
- **Region**: Choose the region closest to your users
- **Branch**: The branch you want to deploy (usually `main` or `master`)
- **Root Directory**: `server` (VERY IMPORTANT - this must be set for monorepo deployments)
- **Build Command**: `node fix-build.js && pnpm build`
- **Start Command**: `node dist/main.js`

### 4. Add Environment Variables

In the "Environment" section, add these variables:

- `NODE_ENV`: `production`
- `DATABASE_URL`: Your Supabase PostgreSQL connection string (format: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`)
- `SUPABASE_PROJECT_URL`: Your Supabase project URL (format: `https://[project-ref].supabase.co`)
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `JWT_SECRET`: A secure random string (e.g., use a password generator)
- `JWT_REFRESH_SECRET`: Another secure random string (different from JWT_SECRET)
- `JWT_EXPIRATION_TIME`: `3600` (1 hour in seconds)
- `JWT_REFRESH_EXPIRATION_TIME`: `86400` (24 hours in seconds)
- `PORT`: `3002`
- `CORS_ORIGIN`: Your frontend URL or `*` for development

Optional RabbitMQ variables (if you're using RabbitMQ):
- `RABBITMQ_URL`: Your RabbitMQ connection string
- `RABBITMQ_QUEUE`: `assessment`
- `RABBITMQ_EXCHANGE`: `assessments`
- `RABBITMQ_ROUTING_KEY`: `assessment.new`

### 5. Deploy Your Service

Click the "Create Web Service" button to start the deployment. Render will:

1. Clone your repository
2. Run the build command (which includes our custom fix-build.js script)
3. Start your service

Deployment typically takes 5-10 minutes for the first build.

### 6. Monitor Deployment Progress

You can monitor the deployment progress in the "Logs" tab. If you encounter any issues, you can debug them here.

## How Our Fix-Build.js Script Works

The `fix-build.js` script automatically handles common build issues:

1. Installs dependencies missing from package.json:
   - prom-client
   - @nlpjs/similarity
   - amqplib
   - amqp-connection-manager

2. Creates compatibility modules for features when dependencies aren't available
3. Updates path aliases in tsconfig.json
4. Fixes import paths in TypeScript files
5. Handles createHybridResponse parameter issues
6. Adds confidenceScore to recommendations.service.ts

This script runs automatically during the build process, requiring no manual intervention.

## Accessing Your Deployed API

Once deployed, your API will be available at:
`https://your-service-name.onrender.com`

## Updating Your Deployment

When you push changes to your GitHub repository, Render.com will automatically redeploy your service.

## Troubleshooting

### Build Failures

If your build fails, check the logs for errors. Common issues include:

- Missing environment variables (JWT_SECRET, JWT_REFRESH_SECRET, DATABASE_URL)
- Incorrect Supabase connection strings
- Incorrect root directory setting (should be `server`)
- Build command errors

### Runtime Errors

If your service starts but encounters runtime errors:

1. Check the logs in the "Logs" tab
2. Ensure all environment variables are correctly set
3. Verify your Supabase connection is working
4. Look for RabbitMQ-related errors if you're using it

### Common Error: "JWT_REFRESH_SECRET is required"

This error indicates the environment variable wasn't set in Render:
1. Go to your service dashboard
2. Click "Environment"
3. Add JWT_REFRESH_SECRET with a secure value
4. Redeploy by clicking "Manual Deploy" → "Deploy latest commit"

### Common Error: "Cannot connect to database"

1. Check your DATABASE_URL formatting
2. Verify that your Supabase project is active
3. Make sure IP restrictions in Supabase aren't blocking Render.com IPs

### Scaling Issues

The free tier of Render.com has some limitations:

- Services spin down after 15 minutes of inactivity
- Limited resources may affect performance under load

For production use, consider upgrading to a paid plan. 