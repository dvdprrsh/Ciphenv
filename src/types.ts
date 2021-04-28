import { Arguments as YArguments } from "yargs";

export interface Args {
  secret: string;
  S: string;
  file?: false | string;
  F?: false | string;
  replace: boolean;
  R: boolean;
  value?: string;
  V?: string;
}

export type Arguments = YArguments<Args>;
