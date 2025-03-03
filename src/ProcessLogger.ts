export interface ProcessLoggerOption {
  key: string;
}

export class ProcessLogger {

  protected options: Partial<ProcessLoggerOption>;
  protected enable: boolean;

  public constructor(enable: boolean, options?: ProcessLoggerOption) {
    this.enable = enable;
    this.options = options ?? {};
    if (this.options.key) {
      this.options.key = '[ffmpeg-rtsp]:';
    }
  }

  public log(...args: any[]) {
    if (!this.enable) return;
    console.log(this.options.key, ...args);
  }

  public warn(...args: any[]) {
    if (!this.enable) return;
    console.warn(this.options.key, ...args);
  }

  public error(...args: any[]) {
    if (!this.enable) return;
    console.error(this.options.key, ...args);
  }

}
