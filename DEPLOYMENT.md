# Deployment Guide

## 1. Provision Infrastructure (Terraform)
Run the following commands in your terminal to create the AWS EKS cluster, ECR repositories, and VPC.

```bash
cd terraform
terraform init
terraform apply
```
*Type `yes` when prompted.*
**Note**: This process will take ~15-20 minutes.

## 2. Configure GitHub Secrets
Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.

Add the following secrets:
1.  `AWS_ACCESS_KEY_ID`: Your AWS Access Key.
2.  `AWS_SECRET_ACCESS_KEY`: Your AWS Secret Key.
3.  `GEN_AI_KEY`: Your Google Gemini API Key.

## 3. Deploy Application
Once infrastructure is ready and secrets are set:
1.  Commit and push your changes to the `main` branch.
    ```bash
    git add .
    git commit -m "Setup AWS deployment"
    git push origin main
    ```
2.  Go to the **Actions** tab in GitHub to watch the deployment.

## 4. Access the App
After the GitHub Action completes:
1.  Get the Load Balancer URL:
    ```bash
    kubectl get services
    ```
2.  Open the `EXTERNAL-IP` in your browser.
