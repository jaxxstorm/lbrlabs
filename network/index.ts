import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as tgw from "./sharedTransitGateway";
import * as vpc from "./transitGatewayAttachedVpc";

// const ci = process.env.CI;

// pulumi.log.debug(`ci detected: ${ci}`)

// let devConfig: aws.ProviderArgs = {
//   allowedAccountIds: ["565485516070"],
// };
// let transitConfig: aws.ProviderArgs = {
//   allowedAccountIds: ["587571862190"],
// };
// let prodConfig: aws.ProviderArgs = {
//   allowedAccountIds: ["780219548054"],
// };

// if (ci === "true" ) {

//   devConfig = Object.assign({
//     assumeRole: {
//       duration: "1h",
//       roleArn: "arn:aws:iam::565485516070:role/infrastructure",
//       sessionName: "lbrlabs",
//     },
//   });

//   transitConfig = Object.assign({
//     assumeRole: {
//       duration: "1h",
//       roleArn: "arn:aws:iam::587571862190:role/infrastructure",
//       sessionName: "lbrlabs",
//     },
//   });

//   prodConfig = Object.assign({
//     assumeRole: {
//       duration: "1h",
//       roleArn: "arn:aws:iam::780219548054:role/infrastructure",
//       sessionName: "lbrlabs",
//     },
//   });

// } else {
//   devConfig = Object.assign({
//     profile: "personal-development",
//   });

//   transitConfig = Object.assign({
//     profile: "personal-shared_services",
//   });

//   prodConfig = Object.assign({
//     profile: "personal-production",
//   });
// }

// const devProvider = new aws.Provider("dev", {
//   allowedAccountIds: ["565485516070"],
//   profile: "personal-development"
// });
const transitProvider = new aws.Provider("shared_services", {
  allowedAccountIds: ["587571862190"],
  profile: "personal-shared_services",
});

// const prodProvider = new aws.Provider("prod", {
//   allowedAccountIds: ["780219548054"],
//   profile: "personal-production",
// } );

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
    cidrBlock: "172.20.0.0/20",
    transitGatewayId: transitGw.transitGateway.id,
    useNatInstance: true,
  },
  { provider: transitProvider, parent: transitProvider, dependsOn: transitGw }
);

// const devVpc = new vpc.TransitGatewayAttachedVpc(
//   "dev",
//   {
//     cidrBlock: "172.19.0.0/20",
//     transitGatewayId: transitGw.transitGateway.id,
//   },
//   { provider: devProvider, parent: devProvider, dependsOn: transitGw }
// );

// const prodVpc = new vpc.TransitGatewayAttachedVpc(
//   "prod",
//   {
//     cidrBlock: "172.18.0.0/20",
//     transitGatewayId: transitGw.transitGateway.id,
//   },
//   { provider: prodProvider, parent: prodProvider, dependsOn: transitGw }
// );
