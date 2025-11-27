resource "aws_ecr_repository" "rizz_app" {
  name                 = "rizz-app"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository" "rizz_backend" {
  name                 = "rizz-backend"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}
