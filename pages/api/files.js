import { list, del } from "@vercel/blob";

function decodeName(rest) {
  const idx = rest.indexOf("__");
  return idx >= 0 ? rest.slice(idx + 2) : rest;
}

export default async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({
      error: "Vercel Blob belum terhubung. Tambahkan Blob Store pada proyek Vercel Anda.",
    });
  }

  if (req.method === "GET") {
    try {
      const { blobs } = await list();
      const files = blobs
        .map((b) => {
          const [category, ...restParts] = b.pathname.split("/");
          const rest = restParts.join("/");
          return {
            id: b.url,
            name: rest ? decodeName(rest) : b.pathname,
            category: category === "video" ? "video" : "ppt",
            size: b.size,
            uploadedAt: b.uploadedAt,
            url: b.url,
            downloadUrl: b.downloadUrl,
          };
        })
        .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

      return res.status(200).json({ files });
    } catch (e) {
      return res.status(500).json({ error: "Gagal mengambil daftar berkas: " + e.message });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query; // id = URL blob
    if (!id) return res.status(400).json({ error: "ID berkas tidak ditemukan." });
    try {
      await del(id);
      return res.status(200).json({ success: true });
    } catch (e) {
      return res.status(500).json({ error: "Gagal menghapus berkas: " + e.message });
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).json({ error: "Metode tidak diizinkan" });
}
