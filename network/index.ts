import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as tgw from "./sharedTransitGateway";
import * as vpc from "./transitGatewayAttachedVpc";

// ensure we don't create resources in the wrong account
let devConfig: aws.ProviderArgs = {
  allowedAccountIds: ["565485516070"],
};
let transitConfig: aws.ProviderArgs = {
  allowedAccountIds: ["587571862190"],
};
let prodConfig: aws.ProviderArgs = {
  allowedAccountIds: ["780219548054"],
};

const isInCi = process.env.CI;

if (isInCi === "true") {
  let assumeRole: aws.types.input.ProviderAssumeRole = {
    duration: "1h",
    sessionName: "lbrlabs",
  };
  devConfig = Object.assign({
    assumeRole: (assumeRole = Object.assign({
      roleArn: "arn:aws:iam::565485516070:role/infrastructure",
    })),
  });
  transitConfig = Object.assign({
    assumeRole: (assumeRole = Object.assign({
      roleArn: "arn:aws:iam::587571862190:role/infrastructure",
    })),
  });
  prodConfig = Object.assign({
    assumeRole: (assumeRole = Object.assign({
      roleArn: "arn:aws:iam::780219548054:role/infrastructure",
    })),
  });
} else {
  devConfig = Object.assign({
    profile: "personal-development",
  });
  transitConfig = Object.assign({
    profile: "personal-shared_services",
  });
  prodConfig = Object.assign({
    profile: "personal-production",
  });
}

const devProvider = new aws.Provider("dev", devConfig);
const transitProvider = new aws.Provider("shared_services", transitConfig);
const prodProvider = new aws.Provider("prod", prodConfig);

const transitGw = new tgw.SharedTransitGateway(
  "tgw",
  {
    sharePrincipal:
      "arn:aws:organizations::609316800003:organization/o-fjlzoklj5f",
  },
  { provider: transitProvider, parent: transitProvider }
);

const transitVpc = new vpc.TransitGatewayAttachedVpc(
  "transit",
  {
    cidrBlock: "172.20.0.0/22",
    numberOfNatGateways: 1,
    transitGatewayId: transitGw.transitGateway.id,
  },
  { provider: transitProvider, parent: transitProvider, dependsOn: transitGw }
);

const devVpc = new vpc.TransitGatewayAttachedVpc(
  "dev",
  {
    cidrBlock: "172.19.0.0/22",
    transitGatewayId: transitGw.transitGateway.id,
  },
  { provider: devProvider, parent: devProvider, dependsOn: transitGw }
);

const prodVpc = new vpc.TransitGatewayAttachedVpc(
  "prod",
  {
    cidrBlock: "172.18.0.0/22",
    transitGatewayId: transitGw.transitGateway.id,
  },
  { provider: prodProvider, parent: prodProvider, dependsOn: transitGw }
);
