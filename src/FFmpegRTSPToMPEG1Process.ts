import { FFmpegProcess, type FFmpegProcessOptions } from './FFmpegProcess';

export interface FFmpegRTSPToMPEG1Options extends FFmpegProcessOptions {
  transport?: FFMPEGTransport;
}

export type FFMPEGTransport = 'udp' | 'tcp' | 'udp_multicast' | 'http';

export class FFmpegRTSPToMPEG1Process extends FFmpegProcess {

  public static processType = 'ffmpeg-mpeg1';

  private transport: FFMPEGTransport | undefined;

  public constructor(input: string, options?: FFmpegRTSPToMPEG1Options) {
    super(input, options ?? {});
    options = options ?? {};
  }

  public getArguments(): string[] {

    return (this.arguments ?? []).concat(
      ...(this.transport ? ['-rtsp_transport', this.transport] : []),
      '-r',
      '30',
      '-i',
      this.input,
      '-f',
      'mpegts',
      '-codec:v',
      'mpeg1video',
      ...(this.options.additionalFlags ?? []),
      '-',
    );

  }

  protected onData(chunk: Buffer) {
    this.emit('data', chunk);
  };

}
