const U = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const T = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const DEFAULT = "ASSALAMU’ALAIKUM MAS / MBAK SV ELZ STR DI NOMOR 082357163061 TERIMA KASIH";

async function r(...cmd) {
  const x = await fetch(U, { method: "POST", headers: { Authorization: "Bearer " + T }, body: JSON.stringify(cmd) });
  const j = await x.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function norm(s) {
  let n = String(s).replace(/\D/g, "");
  if (!n) return "";
  if (n[0] === "0") n = "62" + n.slice(1);
  else if (n[0] === "8") n = "62" + n;
  return n.length >= 9 ? n : "";
}

async function stats() {
  const [total, idx, msg] = await Promise.all([r("LLEN", "elz:list"), r("GET", "elz:idx"), r("GET", "elz:msg")]);
  const sent = Math.min(Number(idx) || 0, total);
  return { total, sent, left: total - sent, msg: msg || DEFAULT };
}

module.exports = async (req, res) => {
  const a = req.query.a;
  const body = req.body || {};
  try {
    if (a === "status") {
      const s = await stats();
      return res.json({ total: s.total, left: s.left, msg: s.msg });
    }
    if (a === "next") {
      const gap = await r("SET", "elz:gap", "1", "NX", "EX", "3");
      if (!gap) return res.json({ ok: false, error: "Tunggu beberapa detik." });
      const i = (await r("INCR", "elz:idx")) - 1;
      const n = await r("LINDEX", "elz:list", i);
      if (!n) { await r("DECR", "elz:idx"); return res.json({ ok: false, error: "Semua nomor sudah selesai." }); }
      const msg = (await r("GET", "elz:msg")) || DEFAULT;
      return res.json({ ok: true, url: "https://wa.me/" + n + "?text=" + encodeURIComponent(msg) });
    }

    if (!process.env.PANEL_PASS || body.pass !== process.env.PANEL_PASS)
      return res.status(401).json({ ok: false, error: "Password salah." });

    if (a === "admin") return res.json({ ok: true, ...(await stats()) });
    if (a === "add") {
      let added = 0;
      for (const line of String(body.numbers || "").split(/\r?\n/)) {
        const n = norm(line);
        if (n && (await r("SADD", "elz:seen", n)) === 1) { await r("RPUSH", "elz:list", n); added++; }
      }
      return res.json({ ok: true, added, ...(await stats()) });
    }
    if (a === "setmsg") { await r("SET", "elz:msg", String(body.msg || "").trim()); return res.json({ ok: true, ...(await stats()) }); }
    if (a === "restart") { await r("SET", "elz:idx", "0"); return res.json({ ok: true, ...(await stats()) }); }
    if (a === "clear") { await r("DEL", "elz:list", "elz:seen", "elz:idx"); return res.json({ ok: true, ...(await stats()) }); }

    res.status(404).json({ ok: false, error: "Aksi tidak dikenal." });
  } catch (e) {
    res.status(500).json({ ok: false, error: "Server error" });
  }
};
