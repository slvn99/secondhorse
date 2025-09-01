declare module "@neondatabase/serverless" {
  export const neon: (connectionString: string) => <T = unknown>(
    strings: TemplateStringsArray,
    ...values: any[]
  ) => Promise<T[]>;
}

declare module "@vercel/blob" {
  export type PutBlobResult = { url: string };
  export function put(
    pathname: string,
    data: Blob | ArrayBuffer | Buffer | ArrayBufferView | ReadableStream,
    opts?: { access?: "public" | "private"; token?: string; contentType?: string; [key: string]: any }
  ): Promise<PutBlobResult>;
}

declare module "clsx" {
  export default function clsx(...args: any[]): string;
}
