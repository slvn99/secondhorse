import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@vercel/blob', () => {
  return {
    put: vi.fn(async (_key: string, _buf: any, _opts: any) => ({ url: 'https://blob.example/unit-test.jpg' })),
  };
});

function fakeFile(bytes: Uint8Array, name: string, type: string) {
  return {
    name,
    size: bytes.length,
    type,
    arrayBuffer: async () => bytes,
  } as unknown as File;
}

describe('saveImageAndGetUrl', () => {
  beforeEach(() => {
    // Reset env between tests
    (process as any).env.BLOB_READ_WRITE_TOKEN = '';
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('rejects unsupported mime type', async () => {
    const { saveImageAndGetUrl } = await import('@/app/_lib/uploads');
    const f = new File([new Uint8Array([1,2,3])], 'x.bin', { type: 'application/octet-stream' });
    await expect(saveImageAndGetUrl(f as any)).rejects.toThrow('Unsupported file type');
  });

  it('rejects when dimensions are below minimums', async () => {
    vi.doMock('image-size', () => ({ default: () => ({ width: 200, height: 100 }) } as any));
    const { saveImageAndGetUrl } = await import('@/app/_lib/uploads');
    const bytes = new Uint8Array(16);
    const f = fakeFile(bytes, 'small.jpg', 'image/jpeg');
    await expect(saveImageAndGetUrl(f)).rejects.toThrow(/Image must be at least/);
  });

  it('uploads to blob storage when token is set', async () => {
    (process as any).env.BLOB_READ_WRITE_TOKEN = 'test-token';
    vi.doMock('image-size', () => ({ default: () => ({ width: 1024, height: 768 }) } as any));
    const { saveImageAndGetUrl } = await import('@/app/_lib/uploads');
    const bytes = new Uint8Array(32);
    const f = fakeFile(bytes, 'ok.jpg', 'image/jpeg');
    const url = await saveImageAndGetUrl(f);
    expect(url).toMatch(/^https:\/\/blob\.example\//);
  });
});
