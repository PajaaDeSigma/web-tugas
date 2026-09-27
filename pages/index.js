import Head from "next/head";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Data yang bisa langsung Anda sunting                               */
/* ------------------------------------------------------------------ */

const PROFIL = {
  mahasiswa: {
    nama: "Faza Ibni Fitriansyah",
    nim: "NIM. 062640723196",
    prodi: "Teknologi Informatika Multimedia Digital",
    kelas: "Jaringan Komputer - 1TIA",
  },
  dosen: {
    nama: "Dr. Ali Firdaus, S.Kom, M.Kom.",
    nip: "NIP/NIDN. 197010112001121001/0011107004",
    jabatan: "Dosen Pengampu Mata Kuliah Jaringan Komputer",
  },
};

const WIRE = {
  pw: { label: "Putih-Hijau", css: "repeating-linear-gradient(45deg,#fff 0 3px,#22c55e 3px 6px)" },
  hj: { label: "Hijau", css: "#22c55e" },
  po: { label: "Putih-Oranye", css: "repeating-linear-gradient(45deg,#fff 0 3px,#f97316 3px 6px)" },
  bl: { label: "Biru", css: "#2f6fe0" },
  pb: { label: "Putih-Biru", css: "repeating-linear-gradient(45deg,#fff 0 3px,#2f6fe0 3px 6px)" },
  or: { label: "Oranye", css: "#f97316" },
  pc: { label: "Putih-Coklat", css: "repeating-linear-gradient(45deg,#fff 0 3px,#8a5a3b 3px 6px)" },
  co: { label: "Coklat", css: "#8a5a3b" },
};

const STANDARDS = {
  A: ["pw", "hj", "po", "bl", "pb", "or", "pc", "co"],
  B: ["po", "or", "pw", "bl", "pb", "hj", "pc", "co"],
};

const KATEGORI_KABEL = [
  { nama: "Cat5e", kecepatan: "1 Gbps", frekuensi: "100 MHz", pakai: "Jaringan rumah & kantor kecil" },
  { nama: "Cat6", kecepatan: "1-10 Gbps", frekuensi: "250 MHz", pakai: "Kantor, server room jarak pendek" },
  { nama: "Cat6a", kecepatan: "10 Gbps", frekuensi: "500 MHz", pakai: "Data center, backbone gedung" },
  { nama: "Cat7", kecepatan: "10 Gbps+", frekuensi: "600 MHz", pakai: "Instalasi kelas industri" },
];

const LANGKAH = [
  { judul: "Kupas kulit luar", teks: "Kupas ±3 cm bagian luar kabel UTP menggunakan crimping tool atau cutter, hati-hati agar tidak melukai kabel inti." },
  { judul: "Urai dan luruskan", teks: "Pisahkan 4 pasang kabel yang terpilin, luruskan satu per satu agar mudah diurutkan sesuai standar T568A atau T568B." },
  { judul: "Urutkan sesuai standar", teks: "Susun kedelapan kabel sesuai urutan warna standar yang dipilih, lalu ratakan ujungnya dengan gunting agar sejajar." },
  { judul: "Masukkan ke konektor RJ-45", teks: "Dorong kabel yang sudah rapi ke dalam konektor RJ-45 hingga setiap ujung kawat menyentuh bagian pin tembaga di ujung konektor." },
  { judul: "Crimping", teks: "Jepit konektor dengan crimping tool sampai terdengar bunyi klik, memastikan pin menusuk dan mengunci setiap kawat." },
  { judul: "Uji dengan LAN tester", teks: "Sambungkan kedua ujung ke LAN tester untuk memastikan seluruh 8 pin menyala berurutan tanpa short atau kabel terbalik." },
];

const MAX_MB = 300;

/* ------------------------------------------------------------------ */

function formatSize(bytes) {
  if (!bytes) return "0 KB";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [std, setStd] = useState("B");
  const [tab, setTab] = useState("ppt");
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  async function fetchFiles() {
    setLoadingFiles(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      setMessage({ type: "err", text: "Gagal memuat daftar berkas." });
    } finally {
      setLoadingFiles(false);
    }
  }

  function validateFile(file) {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    const isPpt = [".ppt", ".pptx"].includes(ext);
    const isVideo = [".mp4", ".mov", ".mkv", ".webm"].includes(ext);
    if (tab === "ppt" && !isPpt) return "Untuk tab Materi PPT, unggah berkas .ppt atau .pptx.";
    if (tab === "video" && !isVideo) return "Untuk tab Video Pembelajaran, unggah berkas .mp4, .mov, .mkv, atau .webm.";
    if (file.size > MAX_MB * 1024 * 1024) return `Ukuran berkas melebihi ${MAX_MB}MB.`;
    return null;
  }

  async function uploadFile(file) {
    const err = validateFile(file);
    if (err) {
      setMessage({ type: "err", text: err });
      return;
    }
    setMessage(null);
    setUploading(true);
    setProgress(8);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", tab);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.max(10, Math.round((e.loaded / e.total) * 100)));
      };
      const done = new Promise((resolve, reject) => {
        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) resolve(data);
            else reject(new Error(data.error || "Unggah gagal."));
          } catch {
            reject(new Error("Unggah gagal."));
          }
        };
        xhr.onerror = () => reject(new Error("Terjadi kesalahan jaringan."));
      });
      xhr.send(formData);
      await done;
      setProgress(100);
      setMessage({ type: "ok", text: "Berkas berhasil diunggah." });
      fetchFiles();
    } catch (e) {
      setMessage({ type: "err", text: e.message });
    } finally {
      setTimeout(() => setUploading(false), 400);
    }
  }

  async function deleteFile(id) {
    try {
      await fetch(`/api/files?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      setFiles((prev) => prev.filter((f) => f.id !== id));
    } catch {
      setMessage({ type: "err", text: "Gagal menghapus berkas." });
    }
  }

  const visibleFiles = files.filter((f) => f.category === tab);

  return (
    <>
      <Head>
        <title>Belajar Kabel UTP - Jaringan Komputer</title>
        <meta name="description" content="Penjelasan lengkap kabel UTP, urutan warna T568A/T568B, cara crimping, serta materi pembelajaran PPT dan video." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <nav className="nav">
        <div className="wrap nav-inner">
          <div className="brand">
            <span className="brand-mark">UTP</span>
            Jaringan Komputer
          </div>
          <div className={`nav-links ${navOpen ? "open" : ""}`}>
            <a href="#tentang" onClick={() => setNavOpen(false)}>Kabel UTP</a>
            <a href="#warna" onClick={() => setNavOpen(false)}>Urutan Warna</a>
            <a href="#crimping" onClick={() => setNavOpen(false)}>Cara Crimping</a>
            <a href="#materi" onClick={() => setNavOpen(false)}>Materi</a>
            <a href="#profil" onClick={() => setNavOpen(false)}>Profil</a>
          </div>
          <button className="nav-toggle" onClick={() => setNavOpen((v) => !v)} aria-label="Buka menu">
            ☰
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="wrap hero">
        <div>
          <span className="eyebrow"><span className="dot" /> Materi Jaringan Komputer</span>
          <h1>Memahami kabel UTP, dari inti tembaga sampai konektor RJ-45.</h1>
          <p className="lead">
            Rangkuman kabel Unshielded Twisted Pair: kategori, urutan warna standar T568A &amp; T568B,
            langkah crimping yang benar, sampai tempat mengunggah dan mengunduh materi kuliah.
          </p>
          <div className="hero-cta">
            <a href="#warna" className="btn btn-primary">Lihat Urutan Warna</a>
            <a href="#materi" className="btn btn-ghost">Buka Materi Belajar</a>
          </div>
        </div>

        <div className="glass cable-card">
          <p className="mono" style={{ fontSize: 12, color: "var(--ink-500)", marginBottom: 14 }}>4 PASANG KABEL TERPILIN</p>
          <div className="pairs">
            {[["pw", "hj"], ["po", "or"], ["bl", "pb"], ["pc", "co"]].map((pair, i) => (
              <div key={i} className="pair-row">
                <span className="wire-label">Pair {i + 1}</span>
                <div className="wire" style={{ background: WIRE[pair[0]].css }} />
                <div className="wire" style={{ background: WIRE[pair[1]].css }} />
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* TENTANG UTP */}
      <section className="section wrap" id="tentang">
        <div className="section-head">
          <span className="eyebrow">Dasar-dasar</span>
          <h2>Apa itu kabel UTP?</h2>
          <p>
            UTP (Unshielded Twisted Pair) adalah kabel jaringan berisi empat pasang kawat tembaga yang
            dipilin berpasangan tanpa pelindung logam tambahan. Pilinan ini berfungsi mengurangi interferensi
            elektromagnetik antar kabel, sehingga sinyal data tetap stabil pada jarak hingga sekitar 100 meter.
          </p>
        </div>

        <div className="table-wrap glass">
          <table>
            <thead>
              <tr><th>Kategori</th><th>Kecepatan</th><th>Frekuensi</th><th>Umum dipakai untuk</th></tr>
            </thead>
            <tbody>
              {KATEGORI_KABEL.map((k) => (
                <tr key={k.nama}>
                  <td className="mono">{k.nama}</td>
                  <td>{k.kecepatan}</td>
                  <td>{k.frekuensi}</td>
                  <td>{k.pakai}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* WARNA & STANDAR */}
      <section className="section wrap" id="warna">
        <div className="section-head">
          <span className="eyebrow">Standar EIA/TIA-568</span>
          <h2>Urutan warna kabel UTP</h2>
          <p>
            Ada dua standar urutan warna yang diakui: T568A dan T568B. Untuk kabel <em>straight-through</em>
            (menghubungkan PC ke switch/router), gunakan standar yang sama pada kedua ujung — umumnya T568B.
            Untuk kabel <em>crossover</em> (menghubungkan perangkat sejenis, misalnya PC ke PC), satu ujung
            memakai T568A dan ujung lainnya T568B.
          </p>
        </div>

        <div className="std-toggle glass" style={{ display: "inline-flex" }}>
          <button className={std === "A" ? "active" : ""} onClick={() => setStd("A")}>T568A</button>
          <button className={std === "B" ? "active" : ""} onClick={() => setStd("B")}>T568B</button>
        </div>

        <div className="grid-2">
          <div className="glass card">
            <h3>Urutan pin — Standar {std}</h3>
            <div className="rj45">
              {STANDARDS[std].map((key, i) => (
                <div className="pin-slot" key={i}>
                  <div className="bar" style={{ background: WIRE[key].css }} />
                  <span className="num">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th style={{ width: 40 }}>Pin</th><th>Warna kawat</th></tr></thead>
                <tbody>
                  {STANDARDS[std].map((key, i) => (
                    <tr key={i}>
                      <td className="pin">{i + 1}</td>
                      <td>
                        <span className="chip">
                          <span className="swatch" style={{ background: WIRE[key].css }} />
                          {WIRE[key].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass card">
            <h3>Kapan memakai kabel ini?</h3>
            <p style={{ marginBottom: 14 }}>
              {std === "A"
                ? "T568A lebih umum dipakai pada instalasi jaringan pemerintahan di Amerika Serikat dan sebagai ujung kedua pada kabel crossover."
                : "T568B adalah standar yang paling umum dipakai di lapangan untuk kabel straight-through, menghubungkan komputer ke switch, access point, atau router."}
            </p>
            <h3>Straight-through vs Crossover</h3>
            <p>
              <strong>Straight-through:</strong> kedua ujung memakai standar yang sama (A-A atau B-B). Dipakai untuk
              menghubungkan perangkat berbeda jenis, misalnya komputer ke switch.<br /><br />
              <strong>Crossover:</strong> satu ujung T568A, ujung lain T568B. Dipakai untuk menghubungkan perangkat
              sejenis, misalnya PC ke PC atau switch ke switch tanpa fitur auto MDI-X.
            </p>
          </div>
        </div>
      </section>

      {/* CARA CRIMPING */}
      <section className="section wrap" id="crimping">
        <div className="section-head">
          <span className="eyebrow">Praktik</span>
          <h2>Tata cara crimping kabel UTP</h2>
          <p>Enam langkah dasar memasang konektor RJ-45 pada kabel UTP hingga siap digunakan.</p>
        </div>
        <div className="steps">
          {LANGKAH.map((l, i) => (
            <div className="glass step" key={i}>
              <div className="num">{i + 1}</div>
              <div>
                <h4>{l.judul}</h4>
                <p>{l.teks}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MATERI / DASHBOARD */}
      <section className="section wrap" id="materi">
        <div className="section-head">
          <span className="eyebrow">Ruang Belajar</span>
          <h2>Unggah &amp; unduh materi pembelajaran</h2>
          <p>Simpan slide presentasi (PPT/PPTX) dan video pembelajaran (MP4/MOV/MKV/WEBM), maksimal {MAX_MB}MB per berkas.</p>
        </div>

        <div className="glass dashboard">
          <div className="dash-tabs">
            <button className={tab === "ppt" ? "active" : ""} onClick={() => { setTab("ppt"); setMessage(null); }}>Materi PPT</button>
            <button className={tab === "video" ? "active" : ""} onClick={() => { setTab("video"); setMessage(null); }}>Video Pembelajaran</button>
          </div>

          <div
            className={`dropzone ${dragging ? "drag" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) uploadFile(f);
            }}
          >
            <p className="title">Seret berkas ke sini, atau klik untuk memilih</p>
            <p className="hint">
              {tab === "ppt" ? "Format: .ppt, .pptx" : "Format: .mp4, .mov, .mkv, .webm"} — maks {MAX_MB}MB
            </p>
            <input
              ref={inputRef}
              type="file"
              hidden
              accept={tab === "ppt" ? ".ppt,.pptx" : ".mp4,.mov,.mkv,.webm"}
              onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
            />
          </div>

          {uploading && (
            <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>
          )}
          {message && <p className={`status-msg ${message.type}`}>{message.text}</p>}

          <div className="file-list">
            {loadingFiles && <div className="empty-state">Memuat daftar berkas…</div>}
            {!loadingFiles && visibleFiles.length === 0 && (
              <div className="empty-state">Belum ada {tab === "ppt" ? "materi PPT" : "video"} yang diunggah.</div>
            )}
            {!loadingFiles && visibleFiles.map((f) => (
              <div className="file-row" key={f.id}>
                <div className={`file-icon ${f.category}`}>{f.category === "ppt" ? "PPT" : "▶"}</div>
                <div className="file-info">
                  <div className="name">{f.name}</div>
                  <div className="meta">{formatSize(f.size)} · {formatDate(f.uploadedAt)}</div>
                </div>
                <div className="file-actions">
                  <a className="icon-btn" href={f.downloadUrl || f.url} title="Unduh">↓</a>
                  <button className="icon-btn" onClick={() => deleteFile(f.id)} title="Hapus">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-500)" }}>
          Berkas disimpan secara permanen menggunakan <strong>Vercel Blob</strong>, sehingga tetap tersedia
          setelah proyek di-deploy ulang.
        </p>
      </section>

      {/* PROFIL */}
      <section className="section wrap" id="profil">
        <div className="section-head">
          <span className="eyebrow">Identitas</span>
          <h2>Profil</h2>
          <p>Disusun sebagai bagian dari tugas mata kuliah Jaringan Komputer.</p>
        </div>
        <div className="profile-grid">
          <div className="glass profile-card">
            <div className="avatar">{PROFIL.mahasiswa.nama.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
            <div>
              <div className="role">Mahasiswa</div>
              <h4>{PROFIL.mahasiswa.nama}</h4>
              <p className="sub">{PROFIL.mahasiswa.nim} · {PROFIL.mahasiswa.prodi}</p>
              <p className="sub">{PROFIL.mahasiswa.kelas}</p>
            </div>
          </div>
          <div className="glass profile-card">
            <div className="avatar">{PROFIL.dosen.nama.split(" ").map((w) => w[0]).slice(0, 2).join("")}</div>
            <div>
              <div className="role">Dosen Pengampu</div>
              <h4>{PROFIL.dosen.nama}</h4>
              <p className="sub">{PROFIL.dosen.nip}</p>
              <p className="sub">{PROFIL.dosen.jabatan}</p>
            </div>
          </div>
        </div>
      </section>

      <footer>© {new Date().getFullYear()} Materi Jaringan Komputer — Kabel UTP</footer>
    </>
  );
}
