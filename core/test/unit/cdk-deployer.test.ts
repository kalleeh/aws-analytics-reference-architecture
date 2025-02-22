// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

/**
 * Tests CDK deployer
 *
 * @group unit/cdk-deployer
 */

 import { App } from 'aws-cdk-lib';
 import { CdkDeployer, DeploymentType } from '../../src/common/cdk-deployer';
 
 import { Match, Template } from 'aws-cdk-lib/assertions';
 
 
 describe ('CdkDeployer test', () => {
 
  const app = new App();
  const CdkDeployerStack = new CdkDeployer(app, {
    deploymentType: DeploymentType.CLICK_TO_DEPLOY,
    githubRepository: 'aws-samples/aws-analytics-reference-architecture',
    cdkAppLocation: 'refarch/aws-native',
    cdkParameters: {
      Foo: {
        default: 'no-value',
        type: 'String',
      },
      Bar: {
        default: 'some-value',
        type: 'String',
      },
    },
  });
 
  const template = Template.fromStack(CdkDeployerStack);

  // console.log(JSON.stringify(template.toJSON(), null, 2))

  test('CdkDeployer creates the proper Cfn parameters', () => {

    template.hasParameter('Foo',{
      Default: 'no-value',
      Type: 'String',
    });

    template.hasParameter('Bar',{
      Default: 'some-value',
      Type: 'String',
    });
  });

  test('CdkDeployer creates the proper IAM Policy for the codebuild project', () => {
    template.hasResourceProperties('AWS::IAM::Policy',
      Match.objectLike({
        "PolicyDocument": Match.objectLike({
          "Statement": Match.arrayWith([
            {
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Effect": "Allow",
              "Resource": [
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        "Ref": "AWS::Partition"
                      },
                      ":logs:",
                      {
                        "Ref": "AWS::Region"
                      },
                      ":",
                      {
                        "Ref": "AWS::AccountId"
                      },
                      ":log-group:/aws/codebuild/",
                      {
                        "Ref": Match.anyValue(),
                      }
                    ]
                  ]
                },
                {
                  "Fn::Join": [
                    "",
                    [
                      "arn:",
                      {
                        "Ref": "AWS::Partition"
                      },
                      ":logs:",
                      {
                        "Ref": "AWS::Region"
                      },
                      ":",
                      {
                        "Ref": "AWS::AccountId"
                      },
                      ":log-group:/aws/codebuild/",
                      {
                        "Ref": Match.anyValue(),
                      },
                      ":*"
                    ]
                  ]
                }
              ]
            },
            {
              "Action": [
                "codebuild:CreateReportGroup",
                "codebuild:CreateReport",
                "codebuild:UpdateReport",
                "codebuild:BatchPutTestCases",
                "codebuild:BatchPutCodeCoverages"
              ],
              "Effect": "Allow",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:",
                    {
                      "Ref": "AWS::Partition"
                    },
                    ":codebuild:",
                    {
                      "Ref": "AWS::Region"
                    },
                    ":",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    ":report-group/",
                    {
                      "Ref": Match.anyValue(),
                    },
                    "-*"
                  ]
                ]
              }
            }
          ]),
        }),
      }),
    );
  });

  test('CdkDeployer creates the proper codebuild project', () => {
    template.hasResourceProperties('AWS::CodeBuild::Project',
      Match.objectLike({
        "Artifacts": {
          "Type": "NO_ARTIFACTS"
        },
        "Environment": {
          "ComputeType": "BUILD_GENERAL1_SMALL",
          "EnvironmentVariables": [
            {
              "Name": "PARAMETERS",
              "Type": "PLAINTEXT",
              "Value": {
                "Fn::Join": [
                  "",
                  [
                    " -c Foo=",
                    {
                      "Ref": "Foo"
                    },
                    " -c Bar=",
                    {
                      "Ref": "Bar"
                    }
                  ]
                ]
              }
            },
            {
              "Name": "STACKNAME",
              "Type": "PLAINTEXT",
              "Value": ""
            },
            {
              "Name": "CDK_APP_LOCATION",
              "Type": "PLAINTEXT",
              "Value": "refarch/aws-native"
            },
          ],
          "Image": "aws/codebuild/standard:5.0",
          "ImagePullCredentialsType": "CODEBUILD",
          "Type": "LINUX_CONTAINER"
        },
        "ServiceRole": {
          "Fn::GetAtt": [
            Match.anyValue(),
            "Arn"
          ]
        },
        "Source": {
          "Type": "GITHUB"
        },
      }),
    );
  });

  test('CdkDeployer creates the proper IAM Managed Policy for CodeBuild', () => {
    template.hasResourceProperties('AWS::IAM::ManagedPolicy',
      Match.objectLike({
        "PolicyDocument": {
          "Statement": [
            {
              "Action": [
                "kms:CreateKey",
                "kms:DisableKey",
                "kms:EnableKeyRotation",
                "kms:TagResource",
                "kms:DescribeKey",
                "kms:ScheduleKeyDeletion",
                "kms:CreateAlias",
                "kms:DeleteAlias",
                "kms:CreateGrant",
                "kms:RetireGrant"
              ],
              "Effect": "Allow",
              "Resource": "*"
            },
            {
              "Action": [
                "s3:CreateBucket",
                "s3:PutBucketAcl",
                "s3:PutEncryptionConfiguration",
                "s3:PutBucketPublicAccessBlock",
                "s3:PutBucketVersioning",
                "s3:DeleteBucket",
                "s3:PutBucketPolicy"
              ],
              "Effect": "Allow",
              "Resource": "*"
            },
            {
              "Action": [
                "cloudformation:DescribeStacks",
                "cloudformation:DeleteStack",
                "cloudformation:DeleteChangeSet",
                "cloudformation:CreateChangeSet",
                "cloudformation:DescribeChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:DescribeStackEvents",
                "cloudformation:GetTemplate"
              ],
              "Effect": "Allow",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:cloudformation:",
                    {
                      "Ref": "AWS::Region"
                    },
                    ":",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    ":stack/CDKToolkit*"
                  ]
                ]
              }
            },
            {
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Resource": [
                {
                  "Fn::Sub": [
                    "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-deploy-role-${AWS::AccountId}-${AWS::Region}",
                    {
                      "Qualifier": Match.anyValue(),
                    }
                  ]
                },
                {
                  "Fn::Sub": [
                    "arn:${AWS::Partition}:iam::${AWS::AccountId}:role/cdk-${Qualifier}-file-publishing-role-${AWS::AccountId}-${AWS::Region}",
                    {
                      "Qualifier": Match.anyValue(),
                    }
                  ]
                }
              ]
            },
            {
              "Action": [
                "ssm:PutParameter",
                "ssm:GetParameters"
              ],
              "Effect": "Allow",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:ssm:",
                    {
                      "Ref": "AWS::Region"
                    },
                    ":",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    ":parameter/cdk-bootstrap/*/*"
                  ]
                ]
              }
            },
            {
              "Action": [
                "ecr:SetRepositoryPolicy",
                "ecr:GetLifecyclePolicy",
                "ecr:PutImageTagMutability",
                "ecr:DescribeRepositories",
                "ecr:ListTagsForResource",
                "ecr:PutImageScanningConfiguration",
                "ecr:CreateRepository",
                "ecr:PutLifecyclePolicy",
                "ecr:DeleteRepository",
                "ecr:TagResource"
              ],
              "Effect": "Allow",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:ecr:",
                    {
                      "Ref": "AWS::Region"
                    },
                    ":",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    ":repository/cdk*"
                  ]
                ]
              }
            },
            {
              "Action": [
                "iam:GetRole",
                "iam:CreateRole",
                "iam:TagRole",
                "iam:DeleteRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:GetRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy"
              ],
              "Effect": "Allow",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:iam::",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    ":role/cdk*"
                  ]
                ]
              }
            },
            {
              "Action": "logs:PutLogEvents",
              "Effect": "Allow",
              "Resource": {
                "Fn::Join": [
                  "",
                  [
                    "arn:aws:logs:",
                    {
                      "Ref": "AWS::Region"
                    },
                    ":",
                    {
                      "Ref": "AWS::AccountId"
                    },
                    ":log-group:/aws/codebuild/*"
                  ]
                ]
              }
            }
          ],
        }
      }),
    );
  });

  test('CdkDeployer creates the proper IAM role for the StartBuild role', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              }
            }
          ],
        },
        "ManagedPolicyArns": [
          {
            "Fn::Join": [
              "",
              [
                "arn:",
                {
                  "Ref": "AWS::Partition"
                },
                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
              ]
            ]
          },
        ],
        "Policies": [
          {
            "PolicyDocument": {
              "Statement": [
                {
                  "Action": "codebuild:StartBuild",
                  "Effect": "Allow",
                  "Resource": Match.anyValue(),
                }
              ],
            },
          }
        ]
      }),
    );
  });

  test('CdkDeployer creates the proper IAM role for the ReportBuild role', () => {
    template.hasResourceProperties('AWS::IAM::Role',
      Match.objectLike({
        "AssumeRolePolicyDocument": {
          "Statement": [
            {
              "Action": "sts:AssumeRole",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              }
            }
          ],
        },
        "ManagedPolicyArns": [
          {
            "Fn::Join": [
              "",
              [
                "arn:",
                {
                  "Ref": "AWS::Partition"
                },
                ":iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
              ]
            ]
          }
        ],
        "Policies": [
          {
            "PolicyDocument": {
              "Statement": [
                {
                  "Action": [
                    "codebuild:BatchGetBuilds",
                    "codebuild:ListBuildsForProject"
                  ],
                  "Effect": "Allow",
                  "Resource": Match.anyValue(),
                }
              ],
            },
          }
        ]
      }),
    );
  });

  test('CdkDeployer creates the proper StartBuild function', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        "Code": {
          "ZipFile": Match.anyValue(),
        },
        "Role": Match.anyValue(),
        "Handler": "index.handler",
        "Runtime": "nodejs16.x",
        "Timeout": 60
      }),
    );
  });

  test('CdkDeployer creates the proper ReportBuild function', () => {
    template.hasResourceProperties('AWS::Lambda::Function',
      Match.objectLike({
        "Code": {
          "ZipFile": Match.anyValue(),
        },
        "Role": Match.anyValue(),
        "Handler": "index.handler",
        "Runtime": "nodejs16.x",
        "Timeout": 60,
      }),
    );
  });

  test('CdkDeployer creates the proper Custom Resource', () => {
    template.hasResourceProperties('AWS::CloudFormation::CustomResource',
      Match.objectLike({
        "ProjectName": Match.anyValue(),
        "BuildRoleArn": Match.anyValue(),
        "ServiceToken": Match.anyValue(),
      }),
    );
  });
});