import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

vi.mock("@/lib/db", () => ({ db: { mediaFile: { create: vi.fn() } } }));

import { db } from "@/lib/db";
import { mediaIdFromFileName, mediaUrl } from "@/lib/media";
import { MediaError, storeUploadedImage } from "@/server/services/media";

const create = db.mediaFile.create as unknown as ReturnType<typeof vi.fn>;

describe("media addresses", () => {
  it("round-trips an id through its /media address", () => {
    const id = "cmgs7x2k40000qz8l3v1a9b2c";
    expect(mediaUrl(id)).toBe(`/media/${id}.webp`);
    expect(mediaIdFromFileName(`${id}.webp`)).toBe(id);
  });

  it("refuses anything that isn't <id>.webp", () => {
    expect(mediaIdFromFileName("cmgs7x2k40000qz8l3v1a9b2c.png")).toBeNull();
    expect(mediaIdFromFileName("..%2F..%2Fetc.webp")).toBeNull();
    expect(mediaIdFromFileName("short.webp")).toBeNull();
  });
});

describe("storeUploadedImage", () => {
  beforeEach(() => {
    create.mockReset();
    create.mockImplementation(async ({ data }: { data: { width: number; height: number } }) => ({ id: "cmgs7x2k40000qz8l3v1a9b2c", width: data.width, height: data.height }));
  });

  it("stores a phone-sized photo as WebP, longest side shrunk to 2000 px", async () => {
    const photo = await sharp({ create: { width: 4000, height: 3000, channels: 3, background: "#888" } }).jpeg().toBuffer();
    const stored = await storeUploadedImage(photo, { originalName: "IMG_1234.jpg", userId: "u1" });

    expect(stored).toEqual({ url: "/media/cmgs7x2k40000qz8l3v1a9b2c.webp", width: 2000, height: 1500 });
    const saved = create.mock.calls[0][0].data;
    expect(saved.contentType).toBe("image/webp");
    expect((await sharp(Buffer.from(saved.data)).metadata()).format).toBe("webp");
    expect(saved).toMatchObject({ originalName: "IMG_1234.jpg", uploadedById: "u1" });
  });

  it("keeps a small photo at its size", async () => {
    const photo = await sharp({ create: { width: 800, height: 600, channels: 4, background: "#ff5a1f80" } }).png().toBuffer();
    expect(await storeUploadedImage(photo, {})).toMatchObject({ width: 800, height: 600 });
  });

  it("rejects a file that isn't an image, without storing anything", async () => {
    await expect(storeUploadedImage(Buffer.from("%PDF-1.7 not a photo"), {})).rejects.toBeInstanceOf(MediaError);
    expect(create).not.toHaveBeenCalled();
  });
});
