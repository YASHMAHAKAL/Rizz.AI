module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "rizz-cluster"
  cluster_version = "1.29"

  cluster_endpoint_public_access = true

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    default = {
      min_size     = 1
      max_size     = 2
      desired_size = 1

      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  enable_cluster_creator_admin_permissions = true

  # Enable KMS Key creation by the module
  create_kms_key = true
  enable_kms_key_rotation = true
  kms_key_aliases = ["alias/eks/rizz-cluster-v2"]
  
  cluster_encryption_config = {
    resources = ["secrets"]
  }

  tags = {
    Environment = "dev"
    Terraform   = "true"
  }
}
