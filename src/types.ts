import { Arguments as YArguments } from "yargs";

export interface Args {
  secret: string;
  S: string;
  file: string;
  F: string;
  overwrite: string;
  O: boolean;
}

export type Arguments = YArguments<Args>;
