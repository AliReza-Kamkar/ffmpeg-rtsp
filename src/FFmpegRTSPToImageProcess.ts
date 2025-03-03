import { FFmpegProcess, type FFmpegProcessOptions } from './FFmpegProcess';

export interface FFmpegRTSPToImageProcessOptions extends FFmpegProcessOptions {
  rate?: number | string;
  resolution?: string;
  quality?: string | number;
}

const defaultOptions: FFmpegRTSPToImageProcessOptions = {
  rate: '2.5',
  quality: 3,
  resolution: undefined,
};

export class FFmpegRTSPToImageProcess extends FFmpegProcess {

  public static processType = 'ffmpeg-img';

  private rate: number | string;
  private resolution?: string;
  private quality: string | number;

  /**
   * Store the entire data image into this variable.
   * This attribute is replaced each time a full image is received from the stream.
   */
  private buffers: Buffer[] = [];

  public constructor(input: string, options?: FFmpegRTSPToImageProcessOptions) {
    super(input, options ?? {});
    if (options == null) {
      options = defaultOptions;
    }
    this.rate = options?.rate || '2.5';
    this.resolution = options?.resolution;
    this.quality = options?.quality === undefined || options.quality === '' ? 0 : options.quality;
  }

  public getArguments(): string[] {
    return (this.arguments ?? []).concat(
      [
        '-loglevel',
        'quiet',
        '-i',
        this.input,
        '-r',
        this.rate.toString(),
      ],
      this.quality ? ['-q:v', this.quality.toString()] : [],
      this.resolution ? ['-s', this.resolution] : [],
      [
        '-f',
        'image2',
        '-update',
        '1',
        ...(this.options.additionalFlags ?? []),
        '-',
      ]
    );
  }

  protected onData(chunk: Buffer): void {
    if (chunk.length <= 1) return;
    this.buffers.push(chunk);
    const offset = chunk[chunk.length - 2].toString(16);
    const offset2 = chunk[chunk.length - 1].toString(16);
    if (offset === 'ff' && offset2 === 'd9') {
      this.emit('data', Buffer.concat(this.buffers as any));
      this.buffers = [];
    }
  }

}
