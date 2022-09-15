import yrgs from "yargs";
import decryptCommand from "./decrypt";
import encryptCommand from "./encrypt";
import { Arguments } from "./types";

function cli() {
  const yargs = yrgs as yrgs.Argv<Arguments>;
  return yargs
    .scriptName("ciphenv")
    .usage("Usage: $0 <command> [options]")
    .help("help")
    .alias("h", "help")
    .command(encryptCommand)
    .command(decryptCommand)
    .recommendCommands().argv;
}
cli();
