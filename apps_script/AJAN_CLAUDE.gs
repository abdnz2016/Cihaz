/***** AJAN_CLAUDE 1.1 – YEDEK okuyucu (Claude): Genel okuyucunun (AJAN_GENEL) okuyamadığı sertifikaları PDF'i doğrudan Claude'a göndererek okur
 * AJAN_GENEL'e DOKUNMAZ ve Yönlendirici'ye bağlanmaz (okuma anahtarı yok): yalnızca menüden çalışır.
 * Hedef: GN_BASARISIZ listesindeki (Genel okuyucunun okuyamadığı) cihazlar ya da seçili satırdaki cihaz. Daha önce okunmuş sertifikalar atlanır.
 * Sayılar sertifikada yazıldığı gibi (metin) alınır; hata = ölçülen − referans her noktada yeniden doğrulanır; tutmayan hata uyarı olarak yazılır.
 * Karar varsayılan olarak YAPILMAZ ("—"). Script Properties: CLAUDE_KARAR = "açık" yazılırsa Genel okuyucunun kriter/karar işlevleriyle (gnKriterBul_, gnKarar_) karar verilir.
 * Gerekenler: Script Properties → ANTHROPIC_API_KEY (menüden kaydedilir). İsteğe bağlı: CLAUDE_MODEL (varsayılan claude-sonnet-5-5). *****/
function ajanKimlik_Claude() {
  return { kod: "CLAUDE", ad: "Yedek okuyucu (Claude)", surum: "1.1", sira: 95,
           aciklama: "Genel okuyucunun okuyamadığı sertifikaları Claude ile okur",
           menu: [["Okunamayanları Claude ile oku (arka planda)", "claudeOkunamayanlariOku"], ["Seçili satırdaki cihazı Claude ile oku", "claudeSeciliOku"], ["Arka plan durumunu göster", "claudeDurum"], ["Arka planda okumayı durdur", "claudeDurdur"], ["Claude API anahtarını kaydet", "claudeAnahtarKaydet"]],
           gunluk: null, web: {} };
}
const CL_API = "https://api.anthropic.com/v1/messages", CL_NOT = "Claude okuyucu";

const CL_BUYUKLUK = { "mm": "Uzunluk", "µm": "Uzunluk", "m": "Uzunluk", "°C": "Sıcaklık", "%rh": "Nem", "kV": "Gerilim", "V": "Gerilim", "mV": "Gerilim", "Ω": "Direnç", "mΩ": "Direnç", "µΩ": "Direnç", "kΩ": "Direnç", "MΩ": "Direnç", "g": "Ağırlık", "kg": "Ağırlık", "mg": "Ağırlık", "Pa": "Basınç", "kPa": "Basınç", "bar": "Basınç", "mbar": "Basınç", "A": "Akım", "mA": "Akım", "W": "Güç", "kW": "Güç", "Hz": "Frekans", "s": "Zaman", "sn": "Zaman", "mL": "Hacim", "ml": "Hacim", "N": "Kuvvet", "pH": "pH" };

// ---------- saf işlevler (Apps Script'siz de çalışır; Node'da test edilir) ----------
// "1.234,5" · "3.4038" · "4,9E-01" · "−0,02" · "0,043 kW" → sayı (NaN: sayı değil)
function clSayi_(x) {
  let s = String(x == null ? "" : x).trim().replace(/[−–]/g, "-").replace(/\s/g, "").replace(/[A-Za-zµμΩ°%\/²³]+$/, "");
  if (!/^[-+]?[\d.,]+(?:[eE][-+]?\d+)?$/.test(s)) return NaN;
  const e = /[eE]/.test(s) ? s.slice(s.search(/[eE]/)) : "", m = e ? s.slice(0, s.search(/[eE]/)) : s;
  let t = m;
  if (m.indexOf(",") >= 0 && m.indexOf(".") >= 0) t = m.lastIndexOf(",") > m.lastIndexOf(".") ? m.replace(/\./g, "").replace(",", ".") : m.replace(/,/g, "");
  else if (m.indexOf(",") >= 0) t = m.replace(",", ".");
  return Number(t + e);
}
const clOnd_ = x => { const t = String(x == null ? "" : x).replace(/[eE].*$/, ""), m = /[.,](\d+)\s*[^\d]*$/.exec(t.trim()); return m ? m[1].length : 0; };
const clBirim_ = b => String(b == null ? "" : b).replace(/μ/g, "µ").replace(/\s+/g, "").replace(/^°$/, "°C").replace(/^⁰C$/, "°C").replace(/^º?C$/, "°C").replace(/^%RH$/i, "%rh");
// SI önekli birimleri aynı birime çeviren çarpan (µ, m, k, M); aynı değilse NaN
function clCarpan_(kaynak, hedef) {
  const f = /^([µmkM]?)(Ω|V|A|W|g|m|Pa|s)$/.exec(kaynak), t = /^([µmkM]?)(Ω|V|A|W|g|m|Pa|s)$/.exec(hedef), P = { "µ": 1e-6, "m": 1e-3, "": 1, "k": 1e3, "M": 1e6 };
  if (kaynak === hedef || !kaynak || !hedef) return 1; if (!f || !t || f[2] !== t[2]) return NaN; return P[f[1]] / P[t[1]];
}
// Claude'un döndürdüğü tek noktayı doğrular. Dönüş: { gecerli, ref, olc, hata, hataYazi, u, notlar[], uyari[] }
function clNoktaDogrula_(p) {
  const r = { gecerli: false, notlar: [], uyari: [] }, birim = clBirim_(p.birim);
  const ref = clSayi_(p.referans), olc = clSayi_(p.olculen);
  if (isNaN(ref) || isNaN(olc)) { r.uyari.push("sayı değil: ref=" + p.referans + " ölç=" + p.olculen); return r; }
  const u = p.belirsizlik == null || p.belirsizlik === "" || /^[-–—]$/.test(String(p.belirsizlik).trim()) ? NaN : clSayi_(p.belirsizlik);
  const hy = p.hata == null || String(p.hata).trim() === "" ? NaN : clSayi_(p.hata), hesap = olc - ref, dec = Math.max(clOnd_(p.referans), clOnd_(p.olculen), clOnd_(p.hata));
  const dr = clOnd_(p.referans), dO = clOnd_(p.olculen), hataAdim = 0.5 * Math.pow(10, -clOnd_(p.hata));   // yazılı hatanın yuvarlama payı
  const dar = 0.5 * Math.pow(10, -Math.max(dr, dO)), genis = 0.5 * Math.pow(10, -Math.min(dr, dO));   // aynı birimde: ince basamak; ölçek değişiminde (µm↔mm) yazılı hata yuvarlanmamış değerden hesaplanır: kaba basamak
  r.ref = ref; r.olc = olc; r.u = isNaN(u) ? null : u; r.birim = birim;
  if (!isNaN(hy)) {
    const adaylar = [[hesap, "", 1], [-hesap, "işaret ters (hata = referans − cihaz)", 1], [hesap * 1000, "ölçek ×1000", 1000], [-hesap * 1000, "işaret ters, ×1000", 1000], [hesap / 1000, "ölçek ÷1000", 0.001], [-hesap / 1000, "işaret ters, ÷1000", 0.001]];
    const es = adaylar.find(a => Math.abs(a[0] - hy) <= (a[2] === 1 ? dar : genis * a[2]) + hataAdim + 1e-12);
    if (es) { r.hata = hy; r.hataYazi = String(p.hata).trim(); if (es[1]) r.notlar.push("sertifikada " + es[1]); }
    else {   // yazılı hata hesapla tutmuyor: hesaplanan yazılır, fark işaretlenir (rakamı sessizce değiştirmeyiz)
      r.hata = hesap; r.hataYazi = String(+hesap.toFixed(Math.min(dec + 1, 8))).replace(".", ","); r.uyari.push("sertifikadaki hata (" + p.hata + ") ölçülen − referans (" + r.hataYazi + ") ile tutmuyor");
    }
  } else { r.hata = hesap; r.hataYazi = String(+hesap.toFixed(Math.min(dec + 1, 8))).replace(".", ","); r.notlar.push("hata sertifikada yok, hesaplandı"); }
  if (r.u !== null && r.u < 0) { r.uyari.push("negatif belirsizlik"); r.u = Math.abs(r.u); }
  if (r.u === null) r.notlar.push("U yok");
  r.gecerli = true; return r;
}
// Tüm yanıtı doğrular: { satirlar: [...], uyari: [...] }
function clYanitDogrula_(o) {
  const satir = [], uyari = [];
  (o.noktalar || []).forEach((p, i) => {
    const d = clNoktaDogrula_(p);
    if (!d.gecerli) { d.uyari.forEach(x => uyari.push("nokta " + (i + 1) + ": " + x)); return; }
    d.uyari.forEach(x => uyari.push("nokta " + (i + 1) + ": " + x));
    satir.push({ p: p, d: d, aralik: [p.tablo, p.aralik].filter(x => x && String(x).trim()).join(" | "), buyukluk: String(p.buyukluk || "").trim() || CL_BUYUKLUK[d.birim] || "" });
  });
  if (!satir.length) uyari.push("hiç geçerli nokta yok");
  (o.okunamayan || []).forEach(x => uyari.push("okunamadı: " + x));
  return { satirlar: satir, uyari: uyari };
}

// ---------- Claude çağrısı ----------
const CL_ISTEM = "Bu bir kalibrasyon sertifikasıdır. Ölçüm sonuçları tablolarındaki HER satırı `noktalari_kaydet` aracıyla ver.\n" +
  "KURALLAR:\n" +
  "1. Sayıları sertifikada yazıldığı gibi, metin olarak kopyala (ondalık virgül, sondaki sıfırlar, E-notasyonu aynen). Hiçbir sayıyı hesaplama, yuvarlama, tamamlama, düzeltme.\n" +
  "2. `referans` = referans/standart/uygulanan/set/nominal değer. `olculen` = test edilen cihazın okuması (ya da sertifikada 'ölçülen/okunan/gösterge' sütunu). Etüv/kabin gibi cihazlarda referans = set değeri, ölçülen = kabin ortalaması.\n" +
  "3. `hata`: sertifikada yazılı hata/sapma sütunu; yoksa null. `belirsizlik`: genişletilmiş belirsizlik (U) o satır için; yoksa null. Birim sütun başlığında ya da hücrede olabilir; her noktaya yaz (µΩ, mΩ, kV, mm, °C …).\n" +
  "4. `tablo`: satırın ait olduğu tablonun/testin adı (ör. 'Doğrusallık', 'DC Direnç Doğruluk Testi'). `aralik`: ölçüm aralığı ya da kademe (ör. '0-200 mΩ'), yoksa boş.\n" +
  "5. Tekrarlanabilirlik, köşe yükü, histerezis gibi testlerin satırlarını da ver ama `tablo` alanında test adını belirt; birden çok ölçüm sütunu varsa (ön/arka, artan/azalan) her sütun için ayrı nokta ver ve `not` alanına sütunu yaz.\n" +
  "6. Okuyamadığın ya da emin olmadığın bir yer varsa uydurma: o noktayı atla ve `okunamayan` listesine nerede olduğunu yaz.\n" +
  "7. Sertifika no, kalibrasyon tarihi (GG.AA.YYYY) ve cihaz adını da doldur.";
const CL_ARAC = { name: "noktalari_kaydet", description: "Kalibrasyon sertifikasındaki ölçüm noktalarını kaydeder.",
  input_schema: { type: "object", properties: {
    sertifika_no: { type: "string" }, kalibrasyon_tarihi: { type: "string" }, cihaz: { type: "string" },
    noktalar: { type: "array", items: { type: "object", properties: {
      tablo: { type: "string" }, aralik: { type: "string" }, buyukluk: { type: "string" }, birim: { type: "string" },
      referans: { type: "string" }, olculen: { type: "string" }, hata: { type: ["string", "null"] }, belirsizlik: { type: ["string", "null"] }, not: { type: "string" } },
      required: ["referans", "olculen", "birim"] } },
    okunamayan: { type: "array", items: { type: "string" } }, notlar: { type: "string" } }, required: ["noktalar"] } };
function clApi_(dosya) {
  const P = PropertiesService.getScriptProperties(), anahtar = P.getProperty("ANTHROPIC_API_KEY");
  if (!anahtar) throw new Error("API anahtarı kayıtlı değil (menü: Claude API anahtarını kaydet)");
  const baytlar = dosya.getBlob().getBytes(); if (baytlar.length > 30 * 1024 * 1024) throw new Error("PDF 30 MB'tan büyük");
  const govde = { model: P.getProperty("CLAUDE_MODEL") || "claude-sonnet-5-5", max_tokens: 16000, tools: [CL_ARAC], tool_choice: { type: "tool", name: CL_ARAC.name },
    messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: Utilities.base64Encode(baytlar) } }, { type: "text", text: CL_ISTEM }] }] };
  for (let deneme = 0; deneme < 3; deneme++) {
    const yanit = UrlFetchApp.fetch(CL_API, { method: "post", contentType: "application/json", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(govde), muteHttpExceptions: true });
    const kod = yanit.getResponseCode();
    if (kod === 429 || kod === 529 || kod >= 500) { Utilities.sleep(4000 * (deneme + 1)); continue; }
    if (kod !== 200) throw new Error("API " + kod + ": " + yanit.getContentText().slice(0, 200));
    const j = JSON.parse(yanit.getContentText()), arac = (j.content || []).find(c => c.type === "tool_use");
    if (!arac) throw new Error("API araç çağrısı döndürmedi");
    if (j.stop_reason === "max_tokens") arac.input.okunamayan = (arac.input.okunamayan || []).concat(["yanıt uzunluk sınırına takıldı – nokta listesi eksik olabilir"]);
    return arac.input;
  }
  throw new Error("API yoğun, sonra tekrar deneyin");
}

// ---------- ana işlev ----------
const clCertDosyadan_ = ad => (String(ad).replace(/\.pdf$/i, "").match(/_([^_]+)$/) || [])[1] || "";
// sadece: { "KK-05": 1 } verilirse yalnız o cihazlar (daha önce okunmuş olsa da yeniden); verilmezse GN_BASARISIZ listesindeki ve henüz okunmamış cihazlar. Döner: rapor metni
function claudeOku(sadece) {
  if (sadece && typeof sadece !== "object") sadece = null;
  const ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]), iKt = bul_(h, ["Kalibrasyon Tarihi"]);
  let ns = ss.getSheetByName(NOKTA_SEKME); if (!ns) { ns = ss.insertSheet(NOKTA_SEKME); ns.getRange(1, 1, 1, NOKTA_BASLIK.length).setValues([NOKTA_BASLIK]).setFontWeight("bold"); ns.setFrozenRows(1); }
  const P = PropertiesService.getScriptProperties(), karar = /a[çc][ıi]k/i.test(P.getProperty("CLAUDE_KARAR") || ""), bas = Date.now(), model = P.getProperty("CLAUDE_MODEL") || "claude-sonnet-5-5";
  const basarisiz = JSON.parse(P.getProperty("GN_BASARISIZ") || "{}");   // "KK-05|sertNo" → neden/tarih  (Genel okuyucunun okuyamadıkları)
  let tum = ns.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "").map(r => { const s = r.slice(0, NOKTA_BASLIK.length); while (s.length < NOKTA_BASLIK.length) s.push(""); return s; });
  const okunmus = {}; tum.forEach(r => { okunmus[anahtar_(r[0]) + "|" + String(r[1]).trim()] = 1; });
  const rapor = [], sorunlu = []; let yapilan = 0, kaldi = 0, atlandi = 0;
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId]; if (!id) continue; const k = anahtar_(id), d = idx[k]; if (!d) continue;
    const cert = clCertDosyadan_(d.ad), anah = k + "|" + cert;
    if (sadece ? !sadece[k] : !basarisiz[anah]) continue;
    if (!sadece && okunmus[anah]) { delete basarisiz[anah]; atlandi++; continue; }   // bu arada başka biri okumuş
    if (Date.now() - bas > 170000) { kaldi++; continue; }
    let sonuc; const dosyaId = (/\/d\/([\w-]+)/.exec(d.url) || [0, ""])[1];
    try { sonuc = clApi_(DriveApp.getFileById(dosyaId)); } catch (e) { sorunlu.push(id + ": " + e.message); continue; }
    const dog = clYanitDogrula_(sonuc), certYaz = String(sonuc.sertifika_no || cert || "").trim() || cert, ad = String(v[r][iAd]);
    if (!dog.satirlar.length) { sorunlu.push(id + ": nokta okunamadı" + (dog.uyari.length ? " (" + dog.uyari.slice(0, 2).join("; ") + ")" : "")); continue; }
    const kr = karar ? gnKriterBul_(ss, ad, iMa >= 0 ? v[r][iMa] : "", iMo >= 0 ? v[r][iMo] : "") : null;
    const yeni = dog.satirlar.map(x => {
      const d2 = x.d, top = Math.abs(d2.hata) + (d2.u || 0), kk = karar ? (kr ? gnKarar_(d2.ref, d2.hata, d2.u, kr, d2.birim, null) : { lim: null, karar: "KRİTER YOK" }) : { lim: null, karar: "—" };
      const not = [CL_NOT + " (" + model + ")"].concat(x.p.not ? [String(x.p.not)] : [], d2.notlar, d2.uyari).join("; ");
      return [id, certYaz, iKt >= 0 ? v[r][iKt] : (sonuc.kalibrasyon_tarihi || ""), x.buyukluk, x.aralik, String(x.p.referans).trim(), String(x.p.olculen).trim(), d2.hataYazi, d2.u === null ? "" : String(x.p.belirsizlik).trim(), d2.birim,
        kk.lim === null || kk.lim === undefined ? "" : String(+kk.lim.toPrecision(4)).replace(".", ","), String(+top.toPrecision(5)).replace(".", ","), kk.karar, not, new Date()];
    });
    tum = tum.filter(x => anahtar_(x[0]) !== k).concat(yeni);   // bu cihazın eski satırları yenileriyle değişir
    const son = ns.getLastRow(); if (son > 1) ns.getRange(2, 1, son - 1, Math.max(ns.getLastColumn(), NOKTA_BASLIK.length)).clearContent();
    ns.getRange(2, 6, tum.length, 7).setNumberFormat("@"); ns.getRange(2, 1, tum.length, NOKTA_BASLIK.length).setValues(tum);   // her cihazdan sonra yazılır; süre dolsa da kayıp olmaz
    okunmus[k + "|" + certYaz] = 1; okunmus[anah] = 1; delete basarisiz[anah]; yapilan++;
    rapor.push(id + " (" + certYaz + "): " + yeni.length + " nokta" + (dog.uyari.length ? " · ⚠ " + dog.uyari.length + " uyarı: " + dog.uyari.slice(0, 3).join("; ") : " · uyarı yok"));
  }
  P.setProperty("GN_BASARISIZ", JSON.stringify(basarisiz));   // Claude'un okuduğu cihazlar Genel okuyucunun "okunamayan" listesinden çıkar
  const metin = "Yedek okuyucu (Claude):\n" + (rapor.join("\n") || "okunan cihaz yok") + (sorunlu.length ? "\n\nOkunamadı (" + sorunlu.length + "):\n" + sorunlu.join("\n") : "") + (atlandi ? "\n\nBu arada okunmuş (atlandı): " + atlandi : "") + (kaldi ? "\n⏱ Süre doldu, kalan " + kaldi + " cihaz – sonraki tur okur." : "");
  P.setProperty("CL_SON", JSON.stringify({ zaman: new Date().toISOString(), yapilan: yapilan, kaldi: kaldi, hata: sorunlu.length, mesaj: metin.slice(0, 8000) }));
  if (!sadece && !claudeOku.arka) bildir_(metin);
  return metin;
}
function claudeOkunamayanlariOku() {
  claudeDurdur(true);
  const n = Object.keys(JSON.parse(PropertiesService.getScriptProperties().getProperty("GN_BASARISIZ") || "{}")).length;
  if (!n) return bildir_("Genel okuyucunun okuyamadığı (kayıtlı) sertifika yok. Önce Genel okuyucuyu çalıştırın.");
  ScriptApp.newTrigger("claudeArkaTur").timeBased().everyMinutes(5).create();
  bildir_(n + " okunamayan sertifika Claude ile arka planda okunacak (5 dakikada bir tur, bitince durur).\nİlerleme: Ajanlar → Yedek okuyucu (Claude) → Arka plan durumunu göster.\nSonra \"Okuma denetimi: başlat\" ile sonuçlar PDF ile karşılaştırılır.");
}
function claudeArkaTur() {
  const lk = LockService.getScriptLock(); if (!lk.tryLock(1000)) return;
  try { claudeOku.arka = true; claudeOku(null); } finally { claudeOku.arka = false; lk.releaseLock(); }
  const d = JSON.parse(PropertiesService.getScriptProperties().getProperty("CL_SON") || "{}");
  if (d.kaldi === 0) claudeDurdur(true);
}
function claudeDurdur(sessiz) {
  let n = 0; ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "claudeArkaTur") { ScriptApp.deleteTrigger(t); n++; } });
  if (sessiz !== true) bildir_(n ? "Claude ile okuma durduruldu." : "Çalışan arka plan okuması yok.");
}
function claudeDurum() {
  const d = JSON.parse(PropertiesService.getScriptProperties().getProperty("CL_SON") || "{}"), cal = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "claudeArkaTur");
  bildir_(!d.zaman ? (cal ? "Başladı, ilk tur 5 dakika içinde." : "Henüz çalışmadı.") : (cal ? "🔄 Sürüyor." : (d.kaldi === 0 ? "✓ Tamamlandı." : "⏸ Durdu.")) + "\nSon tur: " + new Date(d.zaman).toLocaleString("tr-TR") + " · bu turda " + d.yapilan + " cihaz · kalan " + d.kaldi + " · okunamayan " + d.hata + "\n\n" + d.mesaj);
}
function claudeSeciliOku() {   // Cihazlar sekmesinde seçili satırın cihazını (okunmuş olsa da) Claude ile yeniden okur
  const sh = SpreadsheetApp.getActiveSheet(), r = sh.getActiveRange().getRow(); if (r < 2) return bildir_("Cihazlar sekmesinde bir cihaz satırı seçin.");
  const h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], id = sh.getRange(r, sutun_(h, AYAR.KAYIT_BASLIK) + 1).getValue(), o = {}; o[anahtar_(id)] = 1;
  bildir_(claudeOku(o));
}
function claudeAnahtarKaydet() {
  const ui = SpreadsheetApp.getUi(), y = ui.prompt("Claude API anahtarı", "sk-ant-… anahtarınızı yapıştırın (yalnızca Script Properties'te saklanır).", ui.ButtonSet.OK_CANCEL);
  if (y.getSelectedButton() !== ui.Button.OK || !y.getResponseText().trim()) return;
  PropertiesService.getScriptProperties().setProperty("ANTHROPIC_API_KEY", y.getResponseText().trim()); bildir_("API anahtarı kaydedildi.");
}
if (typeof module !== "undefined") module.exports = { clSayi_, clOnd_, clBirim_, clCarpan_, clNoktaDogrula_, clYanitDogrula_ };
