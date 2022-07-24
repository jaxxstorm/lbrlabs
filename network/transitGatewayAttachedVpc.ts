import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as nat from "./natInstance";
import { SubnetCidrReservation } from "@pulumi/aws/ec2";
import { throws } from "assert";

export interface TransitGatewayAttachedVpcArgs {
  cidrBlock: string;
  transitGatewayId: pulumi.Input<string>;
  numberOfNatGateways?: number;
  useNatInstance?: boolean;
}

export class TransitGatewayAttachedVpc extends pulumi.ComponentResource {
  vpc: awsx.ec2.Vpc;
  transitGatewayAttachment: aws.ec2transitgateway.VpcAttachment;

  constructor(
    name: string,
    args: TransitGatewayAttachedVpcArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("jaxxstorm:index:TransitGatewayAttachedVpc", name, {}, opts);

    this.vpc = new awsx.ec2.Vpc(
      name,
      {
        cidrBlock: args.cidrBlock,
        subnetSpecs: [{
          type: "Public",
          cidrMask: 26
        }, {
          type: "Isolated",
          cidrMask: 26
        }, {
          type: "Private",
          cidrMask: 24
        }],
        natGateways: {
          strategy: "OnePerAz"
        },
        tags: {
          Name: name,
        },
      },
      { parent: this }
    );

    

    this.transitGatewayAttachment = new aws.ec2transitgateway.VpcAttachment(
      name,
      {
        transitGatewayId: args.transitGatewayId,
        vpcId: this.vpc.vpcId,
        subnetIds: this.vpc.isolatedSubnetIds,
        tags: {
          Name: name,
        },
      },
      { parent: this, dependsOn: this.vpc.subnets }
    );

    if (args.useNatInstance) {
      const ami = aws.ec2.getAmiOutput({
        mostRecent: true,
        owners: ["amazon"],
        filters: [
          {
            name: "architecture",
            values: ["x86_64"],
          },
          {
            name: "root-device-type",
            values: ["ebs"],
          },
          {
            name: "name",
            values: ["amzn2-ami-hvm-*"],
          },
          {
            name: "virtualization-type",
            values: ["hvm"],
          },
          {
            name: "block-device-mapping.volume-type",
            values: ["gp2"],
          },
        ],
      }, { parent: this });

      // this.vpc.privateSubnetIds.then((subnets) => {
      //   const privateRouteTableIds = aws.ec2.getRouteTablesOutput({
      //       vpcId: this.vpc.id,
      //       filters: [
      //         {
      //           name: "association.subnet-id",
      //           values: subnets,
      //         },
      //       ],
      //     }, { parent: this });

      //     this.vpc.publicSubnets.then((subnets) => {
      //       new nat.NatInstance(name, {
      //         vpcId: this.vpc.id,
      //         publicSubnetId: subnets[0].id,
      //         imageId: ami.id,
      //         routeTableIds: privateRouteTableIds,
      //       }, 
      //       { parent: this }
      //       );
      //     });

      // })
      


    }
  }
}