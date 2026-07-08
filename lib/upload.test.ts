import { describe, it, expect } from "vitest"
import { validateImageFile, MAX_UPLOAD_BYTES } from "@/lib/upload"

function makeFile(bytes: number[], type: string, name = "test-file"): File {
  return new File([new Uint8Array(bytes)], name, { type })
}

const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]
const WEBP_BYTES = [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]
const HTML_BYTES = Array.from(Buffer.from("<html><script>alert(1)</script></html>"))

describe("validateImageFile", () => {
  it("rejects when no file is provided", async () => {
    const result = await validateImageFile(null)
    expect(result).toHaveProperty("error")
  })

  it("rejects an unsupported declared MIME type", async () => {
    const file = makeFile(JPEG_BYTES, "application/pdf")
    const result = await validateImageFile(file)
    expect(result).toHaveProperty("error")
  })

  it("rejects files larger than MAX_UPLOAD_BYTES", async () => {
    const bigFile = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], "big.jpg", { type: "image/jpeg" })
    const result = await validateImageFile(bigFile)
    expect(result).toHaveProperty("error")
  })

  it("accepts a genuine JPEG declared as image/jpeg", async () => {
    const file = makeFile(JPEG_BYTES, "image/jpeg")
    const result = await validateImageFile(file)
    expect(result).toHaveProperty("image")
    if ("image" in result) expect(result.image.ext).toBe(".jpg")
  })

  it("accepts a genuine PNG declared as image/png", async () => {
    const file = makeFile(PNG_BYTES, "image/png")
    const result = await validateImageFile(file)
    expect(result).toHaveProperty("image")
    if ("image" in result) expect(result.image.ext).toBe(".png")
  })

  it("accepts a genuine WEBP declared as image/webp", async () => {
    const file = makeFile(WEBP_BYTES, "image/webp")
    const result = await validateImageFile(file)
    expect(result).toHaveProperty("image")
    if ("image" in result) expect(result.image.ext).toBe(".webp")
  })

  it("rejects a file whose content does not match its declared image type (spoofed MIME)", async () => {
    // Content is HTML/script but the client claims it's a PNG — this is the
    // exact spoofing scenario the magic-byte check exists to catch.
    const file = makeFile(HTML_BYTES, "image/png")
    const result = await validateImageFile(file)
    expect(result).toHaveProperty("error")
  })

  it("rejects a genuine JPEG that is mislabeled as a different declared image type", async () => {
    const file = makeFile(JPEG_BYTES, "image/png")
    const result = await validateImageFile(file)
    expect(result).toHaveProperty("error")
  })
})
