import { TxBuilder, TxBuilderConfig } from "../core/txBuilder";
import { Tx, Msg } from "../core/tx";
import { StdTx, StdFee, StdSignature, StdSignDoc } from "./stdTx";
import { Context } from "../core/context";
import { AccAddress, useBech32ConfigPromise } from "./address";
import bigInteger from "big-integer";
import { PubKey, PubKeySecp256k1 } from "../crypto";

function nullableBnToBI(
  bn: bigInteger.BigNumber | undefined
): bigInteger.BigInteger {
  let result = bigInteger(-1);
  if (bn) {
    if (typeof bn === "string") {
      result = bigInteger(bn);
    } else if (typeof bn === "number") {
      result = bigInteger(bn);
    } else {
      result = bigInteger(bn);
    }
  }
  return result;
}

export const stdTxBuilder: TxBuilder = (
  context: Context,
  msgs: Msg[],
  config: TxBuilderConfig
): Promise<Tx> => {
  return useBech32ConfigPromise(
    context.get("bech32Config"),
    async (): Promise<Tx> => {
      const stdFee = new StdFee([config.fee], config.gas);

      const seenSigners: any = {};
      const signers: AccAddress[] = [];
      for (const msg of msgs) {
        msg.validateBasic();
        for (const signer of msg.getSigners()) {
          if (!seenSigners[signer.toBytes().toString()]) {
            signers.push(signer);

            seenSigners[signer.toBytes().toString()] = true;
          }
        }
      }

      const keys = await context.get("walletProvider").getKeys(context);

      const signatures: StdSignature[] = [];
      for (const signer of signers) {
        let accountNumber = nullableBnToBI(config.accountNumber);
        let sequence = nullableBnToBI(config.sequence);

        if (accountNumber.lt(bigInteger(0)) || sequence.lt(bigInteger(0))) {
          const account = await context.get("queryAccount")(
            context,
            signers[0].toBech32()
          );
          if (accountNumber.lt(bigInteger(0))) {
            accountNumber = account.getAccountNumber();
          }
          if (sequence.lt(bigInteger(0))) {
            sequence = account.getSequence();
          }
        }

        const signDoc = new StdSignDoc(
          context.get("codec"),
          accountNumber,
          context.get("chainId"),
          stdFee,
          config.memo,
          msgs,
          sequence
        );

        const sig = await context
          .get("walletProvider")
          .sign(context, signer.toBech32(), signDoc.getSignBytes());

        let pubKey: PubKey | undefined;
        for (const key of keys) {
          if (key.bech32Address === signer.toBech32()) {
            if (key.algo === "secp256k1") {
              pubKey = new PubKeySecp256k1(key.pubKey);
            } else {
              throw new Error(`Unsupported algo: ${key.algo}`);
            }
          }
        }

        const signature = new StdSignature(pubKey!, sig);

        signatures.push(signature);
      }

      const stdTx = new StdTx(msgs, stdFee, signatures, config.memo);
      stdTx.validateBasic();
      return stdTx;
    }
  );
};
