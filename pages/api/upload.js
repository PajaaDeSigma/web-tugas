import fs from "fs";
import os from "os";
import path from "path";
import formidable from "formidable";
import { put } from "@vercel/blob";

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_EXT = [".ppt", ".pptx", ".mp4", ".mov", ".mkv", ".webm"];
const MAX_SIZE = 300 * 1024 * 1024; // 300MB

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metode tidak diizinkan" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error:
        "Vercel Blob belum terhubung. Tambahkan Blob Store pada proyek Vercel Anda (env BLOB_READ_WRITE_TOKEN belum tersedia).",
    });
  }

  // formidable perlu direktori sementara untuk menampung file sebelum dikirim ke Blob.
  // os.tmpdir() aman dipakai di lingkungan serverless Vercel (folder /tmp).
  const form = formidable({
    multiples: false,
    maxFileSize: MAX_SIZE,
    uploadDir: os.tmpdir(),
    keepExtensions: true,
  });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Gagal mengunggah file. Pastikan ukuran file di bawah 300MB." });
    }

    const file = files.file?.[0] || files.file;
    if (!file) {
      return res.status(400).json({ error: "Tidak ada file yang dikirim." });
    }

    const originalName = file.originalFilename || "berkas";
    const ext = path.extname(originalName).toLowerCase();

    if (!ALLOWED_EXT.includes(ext)) {
      fs.unlink(file.filepath, () => {});
      return res.status(400).json({ error: "Tipe file tidak didukung. Gunakan PPT/PPTX atau MP4/MOV/MKV/WEBM." });
    }

    const category = fields.category?.[0] || fields.category || (ext.includes("pp") ? "ppt" : "video");
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `${category}/${Date.now()}__${safeName}`;

    try {
      const buffer = fs.readFileSync(file.filepath);
      const blob = await put(pathname, buffer, {
        access: "public",
        addRandomSuffix: false,
        contentType: file.mimetype || undefined,
      });

      fs.unlink(file.filepath, () => {});

      return res.status(200).json({
        success: true,
        file: {
          id: blob.url,
          name: originalName,
          category,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          url: blob.url,
          downloadUrl: blob.downloadUrl,
        },
      });
    } catch (e) {
      fs.unlink(file.filepath, () => {});
      return res.status(500).json({ error: "Gagal mengunggah ke Vercel Blob: " + e.message });
    }
  });
}
