import { Amino, Type } from "@node-a-team/ts-amino";
const { Field, DefineStruct } = Amino;
import { Msg } from "../../core/tx";
import { AccAddress } from "../../common/address";

@DefineStruct()
export class Link {
  @Field.String(0)
  public from: string;

  @Field.String(1)
  public to: string;

  constructor(from: string, to: string) {
    this.from = from;
    this.to = to;
  }
}

@DefineStruct()
export class MsgLink extends Msg {
  @Field.Defined(0, {
    jsonName: "address"
  })
  public address: AccAddress;

  @Field.Slice(
    1,
    { type: Type.Defined },
    {
      jsonName: "links"
    }
  )
  public links: Link[];

  constructor(address: AccAddress, links: Link[]) {
    super();
    this.address = address;
    this.links = links;
  }

  public getSigners(): AccAddress[] {
    return [this.address];
  }

  public validateBasic(): void {
    for (const link of this.links) {
      // TODO improve validation
      if (link.from.length == 0 || link.to.length == 0) {
        throw new Error("CID is empty");
      }
    }
  }
}
