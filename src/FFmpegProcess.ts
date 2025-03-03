import which from 'which';
import { EventEmitter } from 'events';
import { ProcessLogger } from './ProcessLogger';
import { type ChildProcessWithoutNullStreams, spawn } from 'child_process';

export type PorcessStream = ChildProcessWithoutNullStreams;

export interface FFmpegProcessOptions {
  verbose?: boolean;
  additionalFlags?: string[];
  restartOnError?: boolean;
  restartOnErrorTimeout?: number;
}

export abstract class FFmpegProcess extends EventEmitter {

  public static processType: string;

  protected input: string;
  protected options: FFmpegProcessOptions;
  protected stream: PorcessStream | null = null;
  protected clients = 0;
  protected arguments: string[] | null = null;
  protected logger: ProcessLogger;

  private executable?: string;

  constructor(input: string, options: FFmpegProcessOptions) {
    super();
    this.input = input;
    this.options = options ?? ({} as FFmpegProcessOptions);

    if (options.verbose === undefined) {
      options.verbose = false;
    }

    if (typeof options.restartOnError !== 'boolean') {
      options.restartOnError = false;
    }

    if (typeof options.restartOnErrorTimeout !== 'boolean') {
      options.restartOnErrorTimeout = 3000;
    }

    this.logger = new ProcessLogger(!!options.verbose);

  }

  public getInput(): string {
    return this.input;
  }

  public getStream(): PorcessStream | null {
    return this.stream;
  }

  public setArgs(args: string[]) {
    this.arguments = args;
    return this;
  }

  public setExecutable(executable: string) {
    this.executable = executable;
    return this;
  }

  public getProcessType(): string {
    return (this.constructor as typeof FFmpegProcess).processType;
  }

  public start() {

    console.log('ffmpeg-path', which.sync('ffmpeg'));

    const cmd = this.executable ?? which.sync('ffmpeg');
    const args = this.getArguments() ?? [];
    this.stream = spawn(cmd, args, { detached: false, windowsHide: true });

    this.logger.log('Start Process');

    this.stream.on('exit', (code, signal) => {
      this.emit('exit', code);
      if (code === 0 || signal === 'SIGTERM') {
        if (this.options.restartOnError) {
          setTimeout(() => this.start(), this.options.restartOnErrorTimeout);
        }
      }
      else {
        this.logger.log(
          `Stream died with code ${code} - will recreate when the next client connects`,
        );
        this.stream = null;
      }
    });

    this.stream.on('error', (err) => this.logger.error(`Internal Error: ${err.message}`));
    this.stream.stdout.on('data', this.onData.bind(this));
    this.stream.stderr.on('error', (e) => this.logger.error('process.stderr.onError', e.toString()));
    this.stream.stderr.on('data', () => { });

    this.emit('start');

    this.stream.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        throw new Error(
          'FFMpeg executable wasn\'t found. Install this package or try to set FFmpegProcess.executable path directly',
        );
      }
      throw err;
    });
  }

  public stop(): void {
    this.logger.log('Trying to stop stream');
    if (this.stream) {
      this.stream.stdin.write('q\r\n');
      this.stream.stdin.end();
      this.stream.kill('SIGTERM');
    }
    this.stream = null;
    this.emit('stop');
  }

  public restart(): void {
    this.logger.log('Trying to restart stream');
    if (this.stream) {
      this.stop();
      this.start();
    }
  }

  public abstract getArguments(): string[];

  protected abstract onData(chunk: Buffer): void;
}
