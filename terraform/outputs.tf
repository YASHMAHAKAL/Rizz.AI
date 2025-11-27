output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ids attached to the cluster control plane"
  value       = module.eks.cluster_security_group_id
}

output "region" {
  description = "AWS region"
  value       = "us-east-1"
}

output "cluster_name" {
  description = "Kubernetes Cluster Name"
  value       = module.eks.cluster_name
}

output "ecr_repository_app_url" {
  description = "The URL of the App ECR repository"
  value       = aws_ecr_repository.rizz_app.repository_url
}

output "ecr_repository_backend_url" {
  description = "The URL of the Backend ECR repository"
  value       = aws_ecr_repository.rizz_backend.repository_url
}
