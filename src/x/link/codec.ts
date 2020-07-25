import { Codec } from "@node-a-team/ts-amino";
import { MsgLink } from "./msgs";

export function registerCodec(codec: Codec) {
  codec.registerConcrete("cyber/Link", MsgLink.prototype);
}
