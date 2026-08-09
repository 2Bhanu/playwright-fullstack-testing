import { testLogContext } from "./test_logging_context";

class Logger {

  debug(message: string): void {
    this.write('DEBUG', message);
  }

  info(message: string): void {
    this.write('INFO', message);
  }

  warn(message: string): void {
    this.write('WARN', message);
  }

  error(message: string): void {
    this.write('ERROR', message);
  }

  private write(
    level: string,
    message: string,
  ): void {

    const entry =
      `${new Date().toISOString()} [${level}] ${message}`;

    const context = testLogContext.getStore();

    if (context) {
      context.logs.push(entry);
    }

    console.log(entry);
  }
}
 
   
export const logger = new Logger();