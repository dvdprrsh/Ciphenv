const Logger = {
  error(...logs: any[]): void {
    return console.error(...logs.map((log) => `\x1b[31m${log}\x1b[89m`), "\x1b[0m");
  },
  info(...logs: any[]): void {
    return console.info(...logs.map((log) => `\x1b[34m${log}\x1b[89m`), "\x1b[0m");
  },
  success(...logs: any[]): void {
    return console.log(...logs.map((log) => `\x1b[32m${log}\x1b[89m`), "\x1b[0m");
  },
};

export default Logger;
