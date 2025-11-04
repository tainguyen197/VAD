declare module "node-record-lpcm16" {
    import {Readable} from "stream";

    interface RecordOptions {
        sampleRate: number;
        channels: number;
        audioType: string;
    }

    interface Recording {
        stream(): Readable;
        start(): void;
        stop(): void;
    }

    function record(options?: RecordOptions): Recording;

    export default record;
}