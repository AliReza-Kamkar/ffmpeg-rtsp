import type { FFmpegProcess } from './FFmpegProcess';
import { ProcessLogger } from './ProcessLogger';

export interface FFmpegProcessItem {
  process: FFmpegProcess | null;
  count: number;
}

export type FFmpegOptionsInfer<T> = T extends { new(input: string, options?: infer O): any } ? O : never;

export type FFmpegProcessConstructor<T extends FFmpegProcess, O = FFmpegOptionsInfer<T>> = {
  new(url: string, options?: O): T;
  processType: string;
};

export class FFmpegRTSP {

  private static logger = new ProcessLogger(true, { key: 'FFmpegRTSP' });
  private static processMap = new Map<string, FFmpegProcessItem>();

  public static stream<T extends FFmpegProcess, O = FFmpegOptionsInfer<T>>(
    Clazz: FFmpegProcessConstructor<T, O>,
    input: string,
    options?: O
  ): T {

    const key = this.getKey(Clazz.processType, input);
    const item = this.processMap.get(key);
    if (item) {
      item.count += 1;
      this.logger.log('attach new client to stream. current attached count:', item.count);
      return item?.process as T;
    }

    const process = new (Clazz)(input, options);
    this.logger.log('create new ffmpeg stream. current attached count:', 1);
    this.processMap.set(key, {
      count: 1,
      process: process,
    });

    process.start();

    // Remove process from map
    process.on('exit', () => {
      const item = this.processMap.get(key);
      if (!item) return;
      item.count = 0;
      item.process = null;
      this.processMap.delete(key);
    });

    return process;
  }

  public static detachStream(process: FFmpegProcess) {
    if (!process) return;
    const key = this.getKey(process.getProcessType(), process.getInput());
    const item = this.processMap.get(key);
    if (item == null) return;
    item.count -= 1;
    if (item.count === 0) {
      this.logger.log('detachProcess => current attached count: 0, destroying process ', item.count);
      item.process?.stop();
      item.process = null;
      this.processMap.delete(key);
    }
    else {
      this.logger.log('detachProcess => current attached count:', item.count);
    }
  }

  public static kill(process: FFmpegProcess) {
    if (!process) return;
    const key = this.getKey(process.getProcessType(), process.getInput());
    if (!this.processMap.has(key)) return;
    const item = this.processMap.get(key);
    if (item == null) return;
    item.process?.stop();
    item.process = null;
    this.processMap.delete(key);
  }

  public static killAll() {
    for (const item of this.processMap.values()) {
      item.count = 0;
      item.process?.stop();
      item.process = null;
    }
    this.processMap.clear();
  }

  private static getKey(type: string, url: string) {
    return `${type}-${url}`;
  }

}

export default FFmpegRTSP;
