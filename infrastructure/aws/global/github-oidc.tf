# GitHub Actions OIDC — allows GitHub Actions to authenticate with AWS without stored credentials

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd",
  ]
}

resource "aws_iam_role" "github_actions_terraform" {
  name = "${var.project_name}-github-actions-terraform"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:kofc94/lantern-lounge:*"
        }
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
      }
    }]
  })

  tags = {
    Environment = var.environment
    Project     = var.project_name
  }
}

# Managed policies for each AWS service Terraform manages
locals {
  github_actions_managed_policies = [
    "arn:aws:iam::aws:policy/AmazonCognitoPowerUser",
    "arn:aws:iam::aws:policy/CloudFrontFullAccess",
    "arn:aws:iam::aws:policy/AmazonRoute53FullAccess",
    "arn:aws:iam::aws:policy/AWSCertificateManagerFullAccess",
    "arn:aws:iam::aws:policy/AWSLambda_FullAccess",
    "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
    "arn:aws:iam::aws:policy/AmazonAPIGatewayAdministrator",
    "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess",
    "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess",
  ]
}

resource "aws_iam_role_policy_attachment" "github_actions_terraform" {
  for_each   = toset(local.github_actions_managed_policies)
  role       = aws_iam_role.github_actions_terraform.name
  policy_arn = each.value
}

# Inline policy for all Terraform-managed resources (S3, IAM, Organizations, SSO)
resource "aws_iam_role_policy" "github_actions_terraform" {
  name = "terraform-management-policy"
  role = aws_iam_role.github_actions_terraform.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "StateAndWebsiteBuckets"
        Effect = "Allow"
        Action = "s3:*"
        Resource = [
          "arn:aws:s3:::lanternlounge-tfstate",
          "arn:aws:s3:::lanternlounge-tfstate/*",
          "arn:aws:s3:::www.lanternlounge.org",
          "arn:aws:s3:::www.lanternlounge.org/*",
          "arn:aws:s3:::lanternlounge.org",
          "arn:aws:s3:::lanternlounge.org/*",
        ]
      },
      {
        Sid    = "IAMManagement"
        Effect = "Allow"
        Action = [
          "iam:*Role*",
          "iam:*Policy*",
          "iam:*OpenIDConnectProvider*",
          "iam:PassRole"
        ]
        Resource = "*"
      },
      {
        Sid    = "OrganizationsManagement"
        Effect = "Allow"
        Action = "organizations:*"
        Resource = "*"
      },
      {
        Sid    = "SSOAndIdentityStore"
        Effect = "Allow"
        Action = [
          "sso:*",
          "sso-directory:*",
          "identitystore:*"
        ]
        Resource = "*"
      },
      {
        Sid    = "AssumeRoleInChildAccounts"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Resource = "arn:aws:iam::*:role/OrganizationAccountAccessRole"
      },
      {
        Sid    = "ServiceLinkedRoles"
        Effect = "Allow"
        Action = "iam:CreateServiceLinkedRole"
        Resource = "*"
        Condition = {
          StringEquals = {
            "iam:AWSServiceName" = [
              "organizations.amazonaws.com",
              "sso.amazonaws.com"
            ]
          }
        }
      }
    ]
  })
}