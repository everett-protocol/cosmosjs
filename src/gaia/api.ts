import { Api, ApiConfig, CoreConfig } from "../core/api";
import { GaiaRest } from "./rest";
import * as CmnCdc from "../common/codec";
import * as Bank from "../x/bank";
import * as Distribution from "../x/distribution";
import * as Gov from "../x/gov";
import * as Slashing from "../x/slashing";
import * as Staking from "../x/staking";
import * as Link from "../x/link";
import { defaultTxEncoder } from "../common/stdTx";
import { stdTxBuilder } from "../common/stdTxBuilder";
import { Context } from "../core/context";
import { Account } from "../core/account";
import { BIP44 } from "../core/bip44";
import { defaultBech32Config } from "../core/bech32Config";
import { Codec } from "@node-a-team/ts-amino";
import { queryAccount } from "../core/query";
import * as Crypto from "../crypto";

export class GaiaApi extends Api<GaiaRest> {
  constructor(
    config: ApiConfig,
    coreConfig: Partial<CoreConfig<GaiaRest>> = {}
  ) {
    super(config, {
      ...{
        txEncoder: defaultTxEncoder,
        txBuilder: stdTxBuilder,
        restFactory: (context: Context) => {
          return new GaiaRest(context);
        },
        queryAccount: (
          context: Context,
          address: string | Uint8Array
        ): Promise<Account> => {
          return queryAccount(
            context.get("rpcInstance"),
            address,
            coreConfig.bech32Config
              ? coreConfig.bech32Config.bech32PrefixAccAddr
              : "cosmos"
          );
        },
        bech32Config: defaultBech32Config("cosmos"),
        bip44: new BIP44(44, 118, 0),
        registerCodec: (codec: Codec) => {
          CmnCdc.registerCodec(codec);
          Crypto.registerCodec(codec);
          Bank.registerCodec(codec);
          Distribution.registerCodec(codec);
          Gov.registerCodec(codec);
          Slashing.registerCodec(codec);
          Staking.registerCodec(codec);
          Link.registerCodec(codec);
        }
      },
      ...coreConfig
    });
  }
}
