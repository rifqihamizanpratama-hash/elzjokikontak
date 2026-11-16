const { r, auth, stats } = require("./_db");
module.exports = async (req, res) => {
  if (!auth(req, res)) return;
  try { await r("DEL", "elz:list", "elz:seen", "elz:idx"); res.json({ ok: true, ...(await stats()) }); }
  catch (e) { res.status(500).json({ ok: false, error: "Server error" }); }
};
