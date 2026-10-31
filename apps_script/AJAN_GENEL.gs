/***** AJAN_GENEL 1.9 (1.9: genel U ancak nokta birimiyle aynı büyüklükteyse kullanılır (± 5 °C ortam şartı bar noktasına yazılmaz) · 1.8: yazmadan önce sekme yeniden okunur, başka ajanların satırları korunur · 1.7: kriter birim çevriminde Ω/mΩ/µΩ/kΩ/MΩ, W, ml · 1.6: çözünürlük aramasında ölçüm aralığı "0-10 l/min" çözünürlük sayılmaz; aralık üst sınırına eşit/büyük çözünürlük düzeltilir · 1.5: bilimsel gösterim, standart direnç; ölçüm aralığı + çözünürlük sertifikadan; noktalı ondalık, sütun dökümü tablolar (METKAL vb.), debimetre; okunamayanlar atlanır, birim cihaz türünden, arka planda okuma; F7.10-02 Rev 1 kriterleri; tipler: mutlak, % okuma, % okuma + sabit, en büyüğü, OIML R35, % tam skala) – Genel kalibrasyon sertifikası okuyucu (özel ajanı olmayan TÜM cihaz türleri: kumpas, mikrometre, YG, sparktester, terazi, manometre…)
 * Birimden bağımsız: 1) "Referans · Ölçülen · Hata (· U)" tablolarını sütun/satır düzeniyle  2) olmazsa ardışık "referans ölçülen hata" üçlülerini arar.
 * Her nokta hata = ölçülen − referans ile doğrulanır (hata farklı birimde olabilir: mm ↔ µm, ×1000). Tutmayan tablo KABUL EDİLMEZ → tanı dosyası.
 * Kriter: Kabul_Kriterleri (Birim sütunu ile, ölçüm raporunun kriterleriyle başlar). Karar: belirsizlik dahil üç durum. Öncelik 99: özel ajanlardan sonra. *****/
function ajanKimlik_Genel() {
  return { kod: "GENEL", ad: "Genel okuyucu", surum: "1.9", aciklama: "Özel ajanı olmayan sertifikaları birimden bağımsız okur",
           menu: [["Arka planda oku (otomatik, önerilen)", "genelArkaPlanBaslat"], ["Arka plan durumunu göster", "genelArkaPlanDurum"], ["Arka planda okumayı durdur", "genelArkaPlanDurdur"], ["Diğer tüm sertifikaları oku (bir tur)", "genelOku"], ["Genel okuyucu satırlarını temizle (yeniden okuma)", "gnSatirlariTemizle"], ["Genel kabul kriterlerini ekle (eksikler)", "gnKriterleriEkle"], ["Kabul kriterlerini F7.10-02 Rev 1'e güncelle", "kriterRev1Uygula"]], gunluk: null, web: {},
           okuma: { desen: ".", islev: "genelOku", oncelik: 99 } };
}
// [Cihaz Adı, Marka, Model, Tip, Değer, Sabit, Birim, Kaynak] – F7.10-02 Rev 1 (P7.10 Rev 1 Bölüm 9)
// Tipler: "en büyüğü" = max(Sabit, %Değer·okuma) · "OIML R35" = Sabit + Değer·L (L metre) · "% tam skala" = %Değer·tam skala (Ölçüm Aralığı)
const GN_KRITER = [
  ["Komparatör", "", "", "mutlak", "0,005", "", "mm", "F7.10-02 Rev 1"],
  ["Kalibrasyon Set", "", "", "mutlak", "0,002", "", "mm", "F7.10-02 Rev 1"],
  ["Kumpas", "", "", "mutlak", "0,05", "", "mm", "F7.10-02 Rev 1"],
  ["Mikrometre", "", "", "mutlak", "0,005", "", "mm", "F7.10-02 Rev 1"],
  ["Cam Skala", "", "", "mutlak", "0,003", "", "mm", "F7.10-02 Rev 1"],
  ["Mikroskop", "", "", "mutlak", "0,003", "", "mm", "F7.10-02 Rev 1"],
  ["Çap Mastar", "", "", "mutlak", "0,002", "", "mm", "F7.10-02 Rev 1"],
  ["Çap Ölçer", "", "", "en büyüğü", "0,3", "0,03", "mm", "F7.10-02 Rev 1"],
  ["Profil Proj", "", "", "mutlak", "0,005", "", "mm", "F7.10-02 Rev 1"],
  ["Şerit Metre", "", "", "OIML R35", "0,4", "0,6", "mm", "F7.10-02 Rev 1"],
  ["Çelik Metre", "", "", "OIML R35", "0,2", "0,3", "mm", "F7.10-02 Rev 1"],
  ["Metre Sayacı", "", "", "% okuma", "0,3", "", "", "F7.10-02 Rev 1"],
  ["Metre Diski", "", "", "% okuma", "0,3", "", "", "F7.10-02 Rev 1"],
  ["Yazı Makinası", "", "", "% okuma", "0,3", "", "", "F7.10-02 Rev 1"],
  ["Yüksek Gerilim Probu", "", "", "% okuma", "3", "", "", "F7.10-02 Rev 1"],
  ["Yüksek Gerilim", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Oto Trafo", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Orta Gerilim", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Sparktester", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Çekme Kopma", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Kronometre", "", "", "mutlak", "0,4", "", "s", "F7.10-02 Rev 1"],
  ["Megaohmmetre", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Miliohmmetre", "", "", "mutlak", "0,06", "", "Ω", "F7.10-02 Rev 1"],
  ["Standart Direnç", "", "", "mutlak", "0,03", "", "mΩ", "F7.10-02 Rev 1"],
  ["Resistomat", "AESA", "", "% okuma", "2", "", "", "F7.10-02 Rev 1"],
  ["Direnç Ölçüm Sehpası", "", "1 M", "% okuma", "0,5", "", "", "F7.10-02 Rev 1"],
  ["Direnç Ölçüm Sehpası", "", "2 M", "% okuma", "2", "", "", "F7.10-02 Rev 1"],
  ["Hassas Terazi", "", "", "mutlak", "0,003", "", "g", "F7.10-02 Rev 1"],
  ["Terazi", "", "", "mutlak", "0,1", "", "kg", "F7.10-02 Rev 1"],
  ["Kantar", "", "", "mutlak", "5", "", "kg", "F7.10-02 Rev 1"],
  ["Manometre", "", "", "% tam skala", "1,6", "", "bar", "F7.10-02 Rev 1"],
  ["pH Metre", "", "", "mutlak", "0,05", "", "pH", "F7.10-02 Rev 1"],
  ["İletkenlik", "", "", "% okuma", "3", "", "", "F7.10-02 Rev 1"],
  ["Anemometre", "", "", "mutlak", "0,5", "", "m/s", "F7.10-02 Rev 1"],
  ["Flowmetre", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"],
  ["Ses Seviye", "", "", "mutlak", "1,4", "", "dB", "F7.10-02 Rev 1"],
  ["Gürültü", "", "", "mutlak", "1,4", "", "dB", "F7.10-02 Rev 1"],
  ["Mezur", "", "", "mutlak", "0,1", "", "ml", "F7.10-02 Rev 1"],
  ["Wattmetre", "", "", "mutlak", "0,2", "", "W", "F7.10-02 Rev 1"],
  ["Multimetre", "", "", "mutlak", "0,5", "", "V", "F7.10-02 Rev 1"],
  ["Sertlik Ölçer", "", "", "mutlak", "0,1", "", "mm", "F7.10-02 Rev 1"],
  ["Akım Gösterge", "", "", "mutlak", "2", "", "A", "F7.10-02 Rev 1"],
  ["CPR Basınç", "", "", "mutlak", "5", "", "Pa", "F7.10-02 Rev 1"],
  ["Duman Yoğunluğu", "", "", "% okuma", "5", "", "", "F7.10-02 Rev 1"]
];
function gnKriterleriEkle(sessiz) {
  const s = kriterSekmesi_(SpreadsheetApp.openById(SHEET_ID));
  ["Sabit", "Birim"].forEach(n => { const b = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(norm_); if (b.indexOf(norm_(n)) < 0) s.getRange(1, b.length + 1).setValue(n).setFontWeight("bold"); });
  const v = s.getDataRange().getValues(), h = v[0].map(norm_), c = n => h.indexOf(norm_(n)), var_ = {};
  v.slice(1).forEach(r => { var_[[r[c("Cihaz Adı")], r[c("Marka")], r[c("Model")]].map(norm_).join("|")] = 1; });
  const ek = GN_KRITER.filter(x => !var_[[x[0], x[1], x[2]].map(norm_).join("|")]).map(x => { const r = new Array(h.length).fill("");
    r[c("Cihaz Adı")] = x[0]; r[c("Marka")] = x[1]; r[c("Model")] = x[2]; r[c("Tip")] = x[3]; r[c("Değer")] = x[4]; r[c("Sabit")] = x[5]; r[c("Birim")] = x[6]; r[c("Kaynak")] = x[7]; r[c("Not")] = "Başlangıç değeri – üretici değeriyle değiştirilebilir"; if (c("Dijit") >= 0) r[c("Dijit")] = "0"; return r; });
  if (ek.length) { const b = s.getLastRow() + 1; s.getRange(b, 1, ek.length, h.length).setNumberFormat("@"); s.getRange(b, 1, ek.length, h.length).setValues(ek); }
  if (sessiz !== true) bildir_("Eklenen genel kriter satırı: " + ek.length);
  return ek.length;
}
// ===== F7.10-02 Rev 1: genel satırların ÜZERİNE yazar, eksikleri ekler; modele özgü üretici satırlarına (Marka/Model dolu ve listede olmayan) dokunmaz =====
function kriterRev1Uygula() {
  const s = kriterSekmesi_(SpreadsheetApp.openById(SHEET_ID));
  ["Sabit", "Birim", "Büyüklük"].forEach(n => { const b = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].map(norm_); if (b.indexOf(norm_(n)) < 0) s.getRange(1, b.length + 1).setValue(n).setFontWeight("bold"); });
  const v = s.getDataRange().getValues(), h = v[0].map(norm_), c = n => h.indexOf(norm_(n)), yer = {};
  v.slice(1).forEach((r, i) => { yer[[r[c("Cihaz Adı")], r[c("Marka")], r[c("Model")]].map(norm_).join("|")] = i + 1; });
  const liste = GN_KRITER.map(x => ({ ad: x[0], ma: x[1], mo: x[2], tip: x[3], deg: x[4], sab: x[5], bir: x[6], bu: "" }));
  if (typeof SIC_KRITER !== "undefined") SIC_KRITER.forEach(x => liste.push({ ad: x[0], ma: "", mo: "", tip: x[2] || "mutlak", deg: String(x[1]).replace(".", ","), sab: x[3] !== undefined ? String(x[3]).replace(".", ",") : "", bir: "°C", bu: "Sıcaklık" }));
  let gun = 0; const ek = [];
  liste.forEach(x => {
    const k = [x.ad, x.ma, x.mo].map(norm_).join("|"), r = yer[k];
    const yaz = (row, set) => { set("Tip", x.tip); set("Değer", x.deg); set("Sabit", x.sab); if (c("Birim") >= 0) set("Birim", x.bir); if (x.bu) set("Büyüklük", x.bu); set("Kaynak", "F7.10-02 Rev 1"); set("Not", "P7.10 Rev 1 Bölüm 9"); };
    if (r) { const row = v[r].slice(); yaz(row, (n, val) => { if (c(n) >= 0) row[c(n)] = val; }); s.getRange(r + 1, 1, 1, h.length).setNumberFormat("@").setValues([row]); gun++; }
    else { const row = new Array(h.length).fill(""); row[c("Cihaz Adı")] = x.ad; row[c("Marka")] = x.ma; row[c("Model")] = x.mo; yaz(row, (n, val) => { if (c(n) >= 0) row[c(n)] = val; }); ek.push(row); }
  });
  if (ek.length) { const b = s.getLastRow() + 1; s.getRange(b, 1, ek.length, h.length).setNumberFormat("@").setValues(ek); }
  bildir_("F7.10-02 Rev 1 uygulandı.\nGüncellenen satır: " + gun + "\nEklenen satır: " + ek.length + "\n\nModele özgü üretici satırları (ör. Burster 2316, Cem DT-172) değiştirilmedi; bunlar genel satırın önüne geçer.");
}
// ===== GENEL OKUYUCU: birimden bağımsız "referans · ölçülen · hata (· U)" =====
const GN_BIRIM = { "nm": 1e-9, "µm": 1e-6, "um": 1e-6, "mm": 1e-3, "cm": 1e-2, "m": 1, "mV": 1e-3, "V": 1, "kV": 1e3, "µA": 1e-6, "mA": 1e-3, "A": 1, "mN": 1e-3, "N": 1, "kN": 1e3, "mg": 1e-6, "g": 1e-3, "kg": 1, "mbar": 1e-3, "bar": 1, "Pa": 1e-5, "kPa": 1e-2, "MPa": 10, "°C": 1, "%": 1, "%rh": 1, "pC": 1, "Hz": 1, "s": 1, "dk": 60,
  "µΩ": 1e-6, "μΩ": 1e-6, "mΩ": 1e-3, "Ω": 1, "kΩ": 1e3, "MΩ": 1e6, "GΩ": 1e9, "mW": 1e-3, "W": 1, "kW": 1e3, "ml": 1e-3, "mL": 1e-3, "l": 1, "L": 1, "ml/min": 1e-3, "l/min": 1 };   // 1.7: direnç, güç, hacim (kriter Ω iken noktalar mΩ: 0,06 Ω = 60 mΩ)
const gnSayi_ = s => parseFloat(String(s).replace(",", "."));
const gnDec_ = s => (String(s).split(/[.,]/)[1] || "").replace(/E.*/i, "").length;
function gnTemizle_(m) {
  return String(m || "").replace(/\\/g, "").replace(/[−–]/g, "-").replace(/\r/g, "")
    .replace(/(-?\d+(?:[.,]\d+)?)\s*[eE]\s*([-+]?\d{1,2})(?![\d])/g, (t, a, e) => { if (!/[.,]/.test(a) && !/^[-+]/.test(e)) return t; const v = Number(a.replace(",", ".")) * Math.pow(10, Number(e)); return isNaN(v) ? t : String(+v.toPrecision(6)).replace(".", ","); })   // 1.5: bilimsel gösterim (3,2E-03 / 1.5e-4) → ondalık
    .replace(/\b\d{4}K\s*-\s*\d{4}\s*-\s*\d{5}\b/g, " ").replace(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/g, " ").replace(/\bK\d{6}\b/g, " ")
    .replace(/\bAB-\d{4}-K\b/g, " ").replace(/\bT-\d{2}-\d+\b/g, " ").replace(/Sayfa\s+\d+\s*\/\s*\d+/gi, " ").replace(/\bk\s*=\s*2\b/gi, " ").replace(/%\s*95/g, " ")
    .replace(/(^|[^\d.,])(-?\d{1,6})\.(\d{1,2}|\d{4,6})(?![\d.,])/g, "$1$2,$3")   // 1.3: OCR noktalı ondalık → virgül (tam 3 hane binlik olabilir, dokunulmaz)
    .replace(/(^|[\s(])[1lIV|]\s*\/\s*min\b/g, "$1l/min");   // OCR: V/min, 1/min → l/min
}
// Metindeki sayılar (konumlarıyla) – virgüllü ondalık ya da tam sayı; harf/rakamla bitişik kodlar (0111020983 gibi uzunlar) dışarıda
function gnSayilar_(t) {
  const L = [], re = /(^|[^\w,.])(-?\d+(?:,\d+)?)(?![\w.,]*\d)/g; let m;
  while ((m = re.exec(t)) !== null) { const s = m[2]; if (s.replace("-", "").replace(",", "").length > 9) continue; L.push({ s: s, v: gnSayi_(s), i: m.index + m[1].length }); }
  return L;
}
// Hata ölçeği: hata, (ölçülen − referans) ile hangi çarpanla tutuyor (1, 1000, 0,001, 1e6)
function gnOlcek_(a, b, c) {
  const fark = gnSayi_(b) - gnSayi_(a), tolAB = 0.5 * Math.pow(10, -gnDec_(a)) + 0.5 * Math.pow(10, -gnDec_(b)), tolC = 0.5 * Math.pow(10, -gnDec_(c));
  const C = gnSayi_(c);
  if (Math.abs(fark) < 1e-12) return Math.abs(C) < 1e-12 ? 1 : 0;              // fark sıfırsa hata da sıfır olmalı
  for (const k of [1, 1000]) {
    if (Math.abs(C / k - fark) > tolAB + tolC / k + 1e-12) continue;
    if (Math.abs(C) > 1e-12 && Math.sign(C) !== Math.sign(fark) && Math.abs(fark) > tolAB) continue;   // işaret uyumu
    return k;
  }
  return 0;
}
// 1) Tablo: "Referans … Ölçülen/Measured/Test" başlığından sonra k sütunlu blok (satır ya da sütun düzeni), ref·ölç·hata ardışık, varsa U
function gnTablo_(t) {
  const N = [], re = /Refer[ae]n[cs]e?\w*[\s\S]{0,160}?(?:Ölçülen|Olculen|Measured|Test\s+Value|Okunan|Cihaz\s+Okuma)/gi; let m; const baslar = [];
  while ((m = re.exec(t)) !== null) baslar.push(m.index);
  baslar.forEach((b, bi) => {
    let par = t.slice(b, bi + 1 < baslar.length ? baslar[bi + 1] : undefined);
    const u = par.search(/Uncertaint\w*|Belirsizli\w*/i); if (u > 0) par = par.slice(u);
    const dur = par.search(/Beyan\s+edilen|The\s+reported|Görüş|Opinions/i); if (dur > 0) par = par.slice(0, dur);
    const tok = gnSayilar_(par).map(x => x.s); let sec = null;
    for (const k of [4, 5, 3, 6]) {
      if (tok.length < 2 * k || tok.length % k) continue;
      const n = tok.length / k;
      for (const duzen of ["satir", "sutun"]) {
        for (let o = 0; o + 2 < k && !sec; o++) {
          const al = (r, c) => duzen === "satir" ? tok[r * k + c] : tok[c * n + r], S = [];
          for (let r = 0; r < n; r++) { const a = al(r, o), bb = al(r, o + 1), c = al(r, o + 2), ol = gnOlcek_(a, bb, c); if (!ol) break; S.push({ reft: a, olct: bb, hatat: c, ut: o + 3 < k ? al(r, o + 3) : "", olcek: ol }); }
          if (S.length === n && S.every(x => x.olcek === S[0].olcek)) sec = S;
        }
        if (sec) break;
      }
      if (sec) break;
    }
    if (sec) sec.forEach(x => N.push(x));
  });
  return N;
}
// 2) Üçlü arama: ardışık "referans ölçülen hata"; en az 2 tutarlı üçlü ve |ölçülen − referans| okumanın %20'sinden küçük
function gnUclu_(t) {
  const T = gnSayilar_(t), N = [], kul = {};
  for (let i = 0; i + 2 < T.length; i++) {
    if (kul[i] || kul[i + 1] || kul[i + 2]) continue;
    const a = T[i].s, b = T[i + 1].s, c = T[i + 2].s, A = gnSayi_(a), B = gnSayi_(b);
    if (!(gnDec_(a) || gnDec_(b))) continue;                                    // ölçüm değeri: en az biri ondalıklı
    if (Math.abs(B - A) > 0.1 * Math.max(Math.abs(A), Math.abs(B), 1e-9) && !(A === 0 && B === 0)) continue;
    if (T[i + 2].i - T[i].i > 60) continue;                                      // üçü yakın olmalı
    const ol = gnOlcek_(a, b, c); if (!ol) continue;
    N.push({ reft: a, olct: b, hatat: c, ut: "", olcek: ol }); kul[i] = kul[i + 1] = kul[i + 2] = 1; i += 2;
  }
  const say = {}; N.forEach(x => say[x.olcek] = (say[x.olcek] || 0) + 1);
  const bask = Object.keys(say).sort((p, q) => say[q] - say[p])[0], S = N.filter(x => String(x.olcek) === bask || (+x.hatat === 0 && +bask));
  return S.filter(x => !(+gnSayi_(x.reft) === 0 && +gnSayi_(x.olct) === 0)).length >= 2 ? S : [];
}
// Genel U: "± sayı birim" (belirsizlik ifadesinin yakınında ya da ilk geçen)
function gnGenelU_(t) {
  const m = /(?:Belirsizli\w*|Uncertaint\w*)[\s\S]{0,400}?±\s*(\d+(?:,\d+)?)\s*(µm|um|mm|°C|kV|mV|V|mA|A|kN|N|mbar|bar|mg|kg|g|%)/i.exec(t) || /±\s*(\d+(?:,\d+)?)\s*(µm|um|mm|kV|mV|V|mA|A|kN|N|mbar|bar|mg|kg|g|°C|%)/.exec(t);
  return m ? { s: m[1], v: gnSayi_(m[1]), birim: m[2] } : null;
}
// Ana okuyucu: noktalar (tekrarlar ayıklanır) + birim/ölçek tahmini
// 1.4: Sertifika metninden ÖLÇÜM ARALIĞI ve ÇÖZÜNÜRLÜK – Cihazlar'da ilgili hücre BOŞSA yazılır (dolu hücreye dokunulmaz; 1.6: açıkça yanlış çözünürlük hariç)
function aralikCozBul_(metin) {
  const t = gnTemizle_(String(metin || "")), tek = t.replace(/[ \t]+/g, " "), BR = "(?:°C|℃|mm|µm|um|m|kV|V|mV|A|mA|kΩ|MΩ|mΩ|Ω|bar|mbar|kPa|MPa|Pa|kg|mg|g|N|kN|l\/min|ml\/min|m³\/h|m\/s|dB|pH|%|mS\/cm|µS\/cm|s|sn)";
  const ARL = new RegExp("(-?\\d+(?:,\\d+)?)\\s*(?:-|–|…|\\.\\.\\.|÷|to|ile)\\s*(\\+?-?\\d+(?:,\\d+)?)\\s*(" + BR.slice(3, -1) + ")(?![\\w/])", "i");
  const SAY = new RegExp("(\\d+(?:,\\d+)?)\\s*(" + BR.slice(3, -1) + ")(?![\\w/])", "i");
  let aralik = "", coz = "";
  // 1) "Ölçme Sahası / Çözünürlük : 0-100 l/min  0,1 l/min" (birleşik etiket: önce aralık sonra çözünürlük)
  const bir = /(?:Ölçme|Ölçüm)\s*(?:Sahası|Aralığı|Alanı)\s*\/\s*Çözünürlük[\s\S]{0,80}?:\s*([\s\S]{0,80})/i.exec(t);
  if (bir) { const a = ARL.exec(bir[1]); if (a) { aralik = a[1] + "–" + a[2].replace("+", "") + " " + a[3]; const kal = bir[1].slice(a.index + a[0].length), c = SAY.exec(kal); if (c) coz = c[1] + " " + c[2]; } }
  // 2) ayrı etiketler
  if (!aralik) { const e = /(?:Ölçme|Ölçüm)\s*(?:Sahası|Aralığı|Alanı)|Measuring\s*Range|Measurement\s*Range|Kapasite|Capacity|\bRange\b/i.exec(tek); if (e) { const a = ARL.exec(tek.slice(e.index, e.index + 120)); if (a) aralik = a[1] + "–" + a[2].replace("+", "") + " " + a[3]; } }
  if (!aralik || !coz) {   // etiketler ve değerler ayrı sütunlarda: ": 220g" ardından ": 0,0001g" (ilk büyük = aralık üstü, sonraki küçük = çözünürlük)
    const r2 = new RegExp(":\\s*(\\d+(?:,\\d+)?)\\s*(" + BR.slice(3, -1) + ")\\s*\\n+\\s*:\\s*(\\d+(?:,\\d+)?)\\s*(" + BR.slice(3, -1) + ")(?![\\w/])", "i").exec(t);
    if (r2 && gnSayi_(r2[3]) < gnSayi_(r2[1])) { if (!aralik) aralik = "0–" + r2[1] + " " + r2[2]; if (!coz) coz = r2[3] + " " + r2[4]; }
  }
  if (!aralik) { const m = /\bMax\.?\s*[:=]?\s*(\d+(?:,\d+)?)\s*(kg|g|mg)\b/i.exec(tek); if (m) aralik = "0–" + m[1] + " " + m[2]; }
  // 1.6: "Ölçme Sahası Çözünürlük … 0-10 l/min 0,01 l/min": aralık ifadeleri çözünürlük sayılmaz; aralığın üst sınırına eşit/büyük değer çözünürlük olamaz
  if (!coz) { const e = /Çözünürlük|Cozunurluk|Resolution|Okunabilirlik|Readability|Hassasiyet|Taksimat|\bd\s*=/i.exec(tek); if (e) { const parca = tek.slice(e.index, e.index + 160).replace(new RegExp(ARL.source, "gi"), " "), c = SAY.exec(parca), ust = aralik ? Math.max(0, ...(aralik.match(/\d+(?:,\d+)?/g) || ["0"]).map(gnSayi_)) : 0; if (c && !(ust && gnSayi_(c[1]) >= ust)) coz = c[1] + " " + c[2]; } }
  // 1.5: birim sayıdan ÖNCE yazılmış biçim: "Ölçüm Aralığı: mm 0 - 1500", "Çözünürlük: mm 1"
  const BU = BR.slice(3, -1);
  if (!aralik) { const m = new RegExp("(?:Ölçme|Ölçüm)\\s*(?:Sahası|Aralığı|Alanı)\\s*:?\\s*(" + BU + ")\\s+(-?\\d+(?:,\\d+)?)\\s*[-–]\\s*(\\d+(?:,\\d+)?)", "i").exec(tek); if (m) aralik = m[2] + "–" + m[3] + " " + m[1]; }
  if (!coz) { const m = new RegExp("(?:Çözünürlük|Resolution)\\s*:?\\s*(" + BU + ")\\s+(\\d+(?:,\\d+)?)(?![\\d,])", "i").exec(tek); if (m) coz = m[2] + " " + m[1]; }
  const temiz = s => s.replace(/℃/g, "°C").replace(/\bum\b/g, "µm").replace(/\bsn\b/g, "s");
  return { aralik: temiz(aralik), coz: temiz(coz) };
}
function aralikCozYaz_(sh, h, v, r, metin) {
  try {
    const iA = bul_(h, ["Ölçüm Aralığı", "Ölçüm Aralığı (Kapasite)", "Kapasite"]), iC = bul_(h, ["Çözünürlük"]); if (iA < 0 && iC < 0) return;
    const x = aralikCozBul_(metin);
    if (iA >= 0 && x.aralik && !String(v[r][iA]).trim()) { sh.getRange(r + 1, iA + 1).setValue(x.aralik); v[r][iA] = x.aralik; }
    // 1.6: çözünürlük hücresi boşsa yazılır; doluysa yalnızca açıkça yanlışsa (aralığın üst sınırına eşit ya da büyük, ör. "0–10 l/min" için "10 l/min") düzeltilir
    const ust = iA >= 0 ? Math.max(0, ...(String(v[r][iA]).match(/\d+(?:[.,]\d+)?/g) || ["0"]).map(gnSayi_)) : 0, eski = iC >= 0 ? String(v[r][iC]).trim() : "";
    const yanlis = eski && ust && gnSayi_(eski) >= ust;
    if (iC >= 0 && x.coz && (!eski || (yanlis && gnSayi_(x.coz) < ust))) { sh.getRange(r + 1, iC + 1).setValue(x.coz); v[r][iC] = x.coz; }
  } catch (e) {}
}
// 1.5: TSE ELEKTRİK TABLOSU ("Test Cihazından Ölçülen / Referans Cihazından Ölçülen / Hata / Mutlak Belirsizlik"):
// OCR her satırın 4 değerinin sırasını karıştırabilir → hata = test − referans (TSE) eşitliğini sağlayan TEK dağılım aranır; birden çok ya da hiç yoksa satır alınmaz.
// Kaynak cihazlarda (yüksek gerilim cihazı, oto trafo, kaynak…) Referans = cihaz ayarı (set), Ölçülen = gerçekte çıkan; ölçüm cihazlarında Referans = gerçek, Ölçülen = cihaz okuması. Her iki durumda Hata = Ölçülen − Referans.
function gnTseElektrik_(t, ad) {
  if (!/Test\s*Cihaz[ıi]ndan/i.test(t) || !/Referans\s*Cihaz[ıi]ndan/i.test(t)) return [];
  const b = t.search(/Tablo\s*1|Table\s*1/i), son = t.search(/Ölçüm\s*noktaları|Uygunluk\s*Beyan|Declaration\s*of\s*Conf/i);
  const s = t.slice(b >= 0 ? b : 0, son > b ? son : undefined), kaynak = /yüksek\s*gerilim\s*cihaz|oto\s*trafo|güç\s*kayna|kaynak|spark/i.test(String(ad || "")) && !/prob|ölçer|metre/i.test(String(ad || ""));
  const N = [], BR = "kV|mV|V|mA|µA|A|GΩ|MΩ|kΩ|mΩ|Ω|Hz|kHz|W|kW";
  s.split(/\n\s*\n/).forEach(parca => {
    const p2 = parca.replace(new RegExp("\\d+(?:,\\d+)?\\s*[-–]\\s*\\d+(?:,\\d+)?\\s*(" + BR + ")(?![A-Za-zΩ/])", "g"), " ");   // ölçüm aralığı (0-10 kV) değer sayılmaz
    const T = []; let m; const re = new RegExp("(-?\\d+(?:,\\d+)?)\\s*(" + BR + ")(?![A-Za-zΩ/])", "g");   // OCR bitiştirmesi: "kV0,078" – birimden sonra rakam gelebilir
    while ((m = re.exec(p2)) !== null) T.push({ s: m[1], v: gnSayi_(m[1]), b: m[2] });
    if (T.length !== 4 || T.some(x => x.b !== T[0].b)) return;
    const cozum = [];
    for (let h = 0; h < 4; h++) for (let tt = 0; tt < 4; tt++) for (let r = 0; r < 4; r++) {
      if (new Set([h, tt, r]).size < 3) continue; const u = 6 - h - tt - r;
      const H = T[h], Te = T[tt], R = T[r], U = T[u], tol = Math.pow(10, -Math.max(gnDec_(H.s), 1)) * 0.6 + 1e-9;
      if (U.v <= 0 || Te.v < 0 || R.v < 0 || Math.abs(Te.v - R.v - H.v) > tol) continue;
      cozum.push({ Te, R, H, U });
    }
    if (cozum.length !== 1) return;   // belirsiz satır alınmaz – okuma denetimi eksik noktayı yakalar
    const c = cozum[0], d = Math.max(gnDec_(c.Te.s), gnDec_(c.R.s)), f = x => String(+x.toFixed(d)).replace(".", ",");
    N.push(kaynak ? { reft: c.Te.s, olct: c.R.s, hatat: f(c.R.v - c.Te.v), ut: c.U.s, olcek: 1, birim: c.Te.b, not: "TSE: hata = test − referans; kaynak cihaz: Referans = ayar, Ölçülen = gerçek" }
                  : { reft: c.R.s, olct: c.Te.s, hatat: f(c.Te.v - c.R.v), ut: c.U.s, olcek: 1, birim: c.Te.b, not: "TSE: hata = test − referans" });
  });
  return N;
}
// 1.5: BLOK SÜTUN (TSE izolasyon / çok aralıklı): her aralık için k referans, sonra k ölçülen, k hata, k belirsizlik alt alta.
// Blok ancak BÜTÜN noktalarda ölçülen − referans = hata tutarsa alınır; MΩ, V, kV gibi farklı büyüklükler aynı sertifikada olabilir.
function gnBlokSutun_(t) {
  const b = t.search(/Tablo\s*1|Table\s*1|ÖLÇÜM\s*ARALI[ĞG]I/i); if (b < 0) return [];
  const BR = "GΩ|MΩ|kΩ|mΩ|Ω|kV|mV|V|mA|µA|A|°C|bar|Hz|kHz|W|kW|mm|µm|g|kg|N";
  const s = t.slice(b).replace(new RegExp("\\d+(?:,\\d+)?\\s*[-–÷]\\s*\\d+(?:,\\d+)?\\s*(" + BR + ")(?![A-Za-zΩ/])", "g"), " ").replace(/\d+(?:,\d+)?\s*Hz\b/g, " ");
  const T = []; let m; const re = new RegExp("(-?\\d+(?:,\\d+)?)(?:\\s*(" + BR + "))?(?![\\d,A-Za-zΩ])", "g");
  while ((m = re.exec(s)) !== null) T.push({ s: m[1], v: gnSayi_(m[1]), b: m[2] || "" });
  const N = []; let i = 0, blok = 0;
  while (i < T.length) {
    let alindi = 0;
    for (let k = Math.min(15, Math.floor((T.length - i) / 4)); k >= 2 && !alindi; k--) {
      const A = T.slice(i, i + k), B = T.slice(i + k, i + 2 * k), H = T.slice(i + 2 * k, i + 3 * k), U = T.slice(i + 3 * k, i + 4 * k), bb = A[0].b;
      if (!bb || A.some(x => x.b !== bb) || B.some(x => x.b !== bb) || U.some(x => (x.b && x.b !== bb) || !(x.v > 0))) continue;   // hata birimi dikkate alınmaz (KK-04: Ω yerine "mΩ" yazılmış) – kabul sayısal eşitliğe bağlı
      if (!A.every((a, j) => Math.abs(B[j].v - a.v - H[j].v) <= Math.pow(10, -Math.max(gnDec_(H[j].s), 0)) * 0.6 + 1e-9)) continue;
      blok++; for (let j = 0; j < k; j++) N.push({ reft: A[j].s, olct: B[j].s, hatat: H[j].s, ut: U[j].s, olcek: 1, birim: bb, aralik: "Tablo bölüm " + blok });
      i += 4 * k; alindi = 1;
    }
    if (!alindi) i++;
  }
  return N.length >= 2 ? N : [];
}
// 1.5: ÇİFT + SAPMA LİSTESİ (TSE cetvel / metre eski şablonu): nominal (az basamaklı) → ölçülen (çok basamaklı) çiftleri;
// çiftlerin farkları metinde ART ARDA ve AYNI SIRAYLA bir sapma listesi olarak geçmiyorsa okunmaz (grafik ekseni gürültüsü giremez). U genel değerden.
function gnCiftSapma_(t) {
  const T = gnSayilar_(t), C = [];
  for (let i = 0; i + 1 < T.length; i++) {
    const r = T[i], o = T[i + 1], d = Math.abs(o.v - r.v);
    if (gnDec_(r.s) < gnDec_(o.s) && d <= Math.max(0.5, 0.01 * Math.abs(r.v)) && (r.v !== 0 || o.v === 0) && !C.some(c => c.r.s === r.s && c.o.s === o.s)) { C.push({ r, o, i }); i++; }
  }
  if (C.length < 3) return [];
  const E = C.map(c => c.o.v - c.r.v), tol = j => Math.pow(10, -Math.max(gnDec_(C[j].o.s), 1)) * 0.6 + 1e-9;
  for (const f of [1, 1000]) {   // sapma listesi aynı birimde ya da ×1000 (mm değer, µm sapma – KK-10)
    for (let s = 0; s + C.length <= T.length; s++) {
      if (C.some(c => s <= c.i + 1 && c.i <= s + C.length - 1)) continue;   // sapma listesi çiftlerin kendisi olamaz
      if (C.every((c, j) => { const L = T[s + j], tl = f === 1 ? tol(j) : Math.pow(10, -gnDec_(L.s)) * 0.6 + 1e-9; return Math.abs(L.v - E[j] * f) <= tl && (f === 1 ? gnDec_(L.s) >= 1 : true); }) && E.some(x => Math.abs(x) > 0))
        { const hb = /Referans\s*De[ğg]erler?\s*(mm|µm|um|°C|kV|mV|V|mA|A|kg|mg|g|bar|mΩ|kΩ|Ω)(?![A-Za-z])/i.exec(t);   // birim tablo başlığından (en sık geçen birim yanıltır: KK-10'da µm)
          return C.map((c, j) => ({ reft: c.r.s, olct: c.o.s, hatat: T[s + j].s, ut: "", olcek: f, birim: hb ? hb[1].replace(/^um$/i, "µm") : undefined })); }
    }
  }
  return [];
}
// 1.5: STANDART DİRENÇ (TSE vb.): tablo "Girilen değer / Okunan değer / Hata / Belirsizlik"; her değer Ω ve mV olarak iki kez yazılır → yalnız Ω değerleri; tek nokta doğaldır
function gnStdDirenc_(t) {
  if (!/STANDART\s*D[İI]REN[ÇC]/i.test(t)) return [];
  const b = t.search(/Tablo\s*1|Table\s*1|Girilen\s*De/i), s = b >= 0 ? t.slice(b) : t, T = []; let m;
  const re = /(-?\d+(?:,\d+)?)\s*(µΩ|μΩ|uΩ|mΩ|kΩ|MΩ|Ω)(?![\w])/g;
  while ((m = re.exec(s)) !== null) T.push({ s: m[1], v: gnSayi_(m[1]), b: m[2].replace(/[μu]Ω/, "µΩ") });
  const N = [];
  for (let i = 0; i + 3 < T.length; i++) {
    const [a, o, h, u] = T.slice(i, i + 4);
    if (a.b === o.b && o.b === h.b && u.v > 0 && Math.abs(o.v - a.v - h.v) <= Math.pow(10, -gnDec_(h.s)) * 0.6 + 1e-12) { N.push({ reft: a.s, olct: o.s, hatat: h.s, ut: u.s, olcek: 1, birim: a.b }); i += 3; }
  }
  return N;
}
// 1.4: TERAZİ – EURAMET cg-18 "Doğrusallık / Linearity" tablosu: yük, gösterge, sapma (g/kg) + belirsizlik (mg/g); ön yükleme ve köşe yükü atlanır
function gnTerazi_(t) {
  const b = t.search(/Doğrusallık\s*Testi|Linearity\s*Test/i); if (b < 0) return [];
  const s = t.slice(b), son = s.search(/Gösterge\s*Belirsizliği|Kalibrasyonu\s*Yapan|Calibrated\s*by/i), bol = son > 0 ? s.slice(0, son) : s.slice(0, 3000);
  const G = { mg: 0.001, g: 1, kg: 1000 }, T = []; let m; const re = /(-?\d+(?:,\d+)?)\+?\s*(mg|kg|g)\b/g;
  while ((m = re.exec(bol)) !== null) T.push({ s: m[1], v: gnSayi_(m[1]), b: m[2] });
  const N = [];
  for (let i = 0; i + 3 < T.length; i++) {
    const [a, o, h, u] = T.slice(i, i + 4);
    if (a.b === o.b && o.b === h.b && Math.abs(o.v - a.v - h.v) <= Math.pow(10, -gnDec_(h.s)) * 0.6 + 1e-12 && G[u.b] !== undefined) {
      const ug = u.v * G[u.b] / G[a.b], dec = Math.max(gnDec_(o.s), 1) + (u.b === a.b ? 0 : 3);
      N.push({ reft: a.s, olct: o.s, hatat: h.s, ut: String(+ug.toFixed(Math.min(dec, 8))).replace(".", ","), olcek: 1, birim: a.b }); i += 3;
    }
  }
  return N.length >= 2 ? N : [];
}
// 1.3: SÜTUN DÖKÜMÜ – OCR tabloyu sütun sütun döker: n × (test, referans, mutlak hata, bağıl hata %) ve hemen ardından n × (U mutlak, U bağıl %)
function gnSutun_(t) {
  const T = gnSayilar_(t), v = T.map(x => x.v), tol = (a, b, s) => Math.abs(a - b) <= s;
  for (let i = 0; i + 4 <= v.length; i++) {
    const N = []; let j = i;
    while (j + 4 <= v.length) {
      const [a, b, c, d] = v.slice(j, j + 4), adim = Math.pow(10, -gnDec_(T[j + 2].s)) * 0.6 + 1e-9;
      if (!b || !tol(a - b, c, adim) || !tol(c / b * 100, d, 0.6)) break;
      N.push({ j, a, b, c }); j += 4;
    }
    if (N.length < 2) continue;
    const U = [];
    for (let q = 0; q < N.length && j + 2 <= v.length; q++, j += 2) { const [ua, ur] = v.slice(j, j + 2); if (ua < 0 || !tol(ua / N[q].b * 100, ur, 0.35)) break; U.push(T[j].s); }
    return N.map((n, q) => ({ reft: T[n.j + 1].s, olct: T[n.j].s, hatat: T[n.j + 2].s, ut: U.length === N.length ? U[q] : "", olcek: 1 }));
  }
  return [];
}
function genelMetinOku_(metin, ad) {
  const t = gnTemizle_(metin); let N = gnStdDirenc_(t), yol = "standart direnç";
  if (!N.length) { N = gnTseElektrik_(t, ad); yol = "TSE elektrik tablosu"; }
  if (!N.length) { N = gnBlokSutun_(t); yol = "blok sütun tablosu"; }
  if (!N.length) { N = gnTerazi_(t); yol = "terazi (doğrusallık)"; }
  if (!N.length) { N = gnSutun_(t); yol = "sütun dökümü"; }
  if (!N.length) { N = gnCiftSapma_(t); yol = "çift + sapma listesi"; }
  if (!N.length) { N = gnTablo_(t); yol = "tablo"; }
  if (!N.length) { N = gnUclu_(t); yol = "üçlü"; }
  const gor = {}; N = N.filter(x => { const k = (x.aralik || "") + "|" + (x.birim || "") + "|" + x.reft + "|" + x.olct + "|" + x.hatat; if (gor[k]) return false; gor[k] = 1; return true; });   // 1.5: farklı aralıktaki aynı değerler kopya sayılmaz
  const U = gnGenelU_(t);
  return { yol: N.length ? yol : "", noktalar: N, genelU: U };
}

// Referans değerlerin birimi: "Referans" başlığından sonraki ilk birim; yoksa metinde en sık geçen ölçü birimi
// 1.2: cihaz türüne göre beklenen birimler (çevre şartlarındaki °C, %rh gibi birimler seçilmesin)
const GN_BEKLENEN = [
  [/yüksek gerilim|spark|oto trafo|orta gerilim|prob/, ["kV", "V"]], [/profil|mikroskop|kumpas|mikrometre|çap|cap |cam skala|komparatör|şerit metre|serit metre|çelik metre|celik metre|metre sayac|yazı makina|mastar|sertlik/, ["mm", "µm"]],   // 1.3: "metre" tek başına değil (flowmetre, manometre, anemometre…)
  [/ısı kayıt|isi kayit|termometre|sıcaklık|etüv|banyo|termokupl|dondurucu|fırın/, ["°C"]], [/terazi|kantar|ağırlık/, ["g", "kg", "mg"]],
  [/manometre|basınç|basinc/, ["bar", "mbar", "kPa", "MPa", "Pa"]], [/miliohm|megaohm|direnç|direnc|resistomat|ohm/, ["µΩ", "mΩ", "Ω", "kΩ", "MΩ"]],
  [/kronometre/, ["s"]], [/flowmetre|debimetre|akış ölçer|akis olcer|flowmeter/, ["l/min", "ml/min", "m³/h"]], [/ph metre|ph-metre/, ["pH"]], [/anemometre/, ["m/s"]], [/akım|akim|ampermetre/, ["A", "mA"]], [/dinamometre|kuvvet|çekme/, ["N", "kN"]]
];
const GN_COKLU = /multimetre|multimeter|kalibratör|kalibrator|osiloskop|analizör|analizor/;   // çok fonksiyonlu: genel okuyucuya uygun değil
const gnBeklenen_ = ad => { const n = norm_(ad); const x = GN_BEKLENEN.find(e => e[0].test(n)); return x ? x[1] : null; };
function gnBirimBul_(t, ad) {
  const bek = gnBeklenen_(ad || "");
  if (bek) {   // çevre / ortam şartları bölümleri sayılmaz; beklenen birimlerden en sık geçen
    const temiz = t.replace(/(?:Çevre|Cevre|Ortam|Environment\w*)[^\n]{0,60}/gi, " ");
    const esc = s => s.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&"), BRb = new RegExp("(?:^|[\\s(\\[/])(" + bek.map(esc).join("|") + (bek.includes("µm") ? "|um" : "") + ")(?=[\\s)\\],.;:]|$)", "g");
    const say = {}; let m; while ((m = BRb.exec(temiz)) !== null) { const b = m[1] === "um" ? "µm" : m[1]; say[b] = (say[b] || 0) + 1; }
    return Object.keys(say).sort((p, q) => say[q] - say[p])[0] || "";
  }
  return gnBirimBulEski_(t);
}
function gnBirimBulEski_(t) {
  const BR = /(?:^|[\s(\[])(µm|um|mm|kV|mV|V|mA|µA|A|kN|N|mbar|bar|kPa|MPa|Pa|mg|kg|g|°C|mΩ|kΩ|MΩ|Ω|ml|pH|m\/s|s)(?=[\s)\],.;:]|$)/;
  const r = t.search(/Refer[ae]n[cs]e?\w*/i); if (r >= 0) { const m = BR.exec(t.slice(r, r + 400)); if (m) return m[1].replace("um", "µm"); }
  const say = {}; let m; const re = new RegExp(BR.source, "g"); while ((m = re.exec(t)) !== null) { const b = m[1].replace("um", "µm"); if (b !== "°C") say[b] = (say[b] || 0) + 1; }
  return Object.keys(say).sort((p, q) => say[q] - say[p])[0] || "";
}
// 1.9: iki birim aynı büyüklükten mi (U ile nokta birimi): °C ≠ bar, mm = µm, Ω = mΩ …
const GN_AILE = [["nm", "µm", "um", "mm", "cm", "m"], ["mV", "V", "kV"], ["µA", "mA", "A"], ["mN", "N", "kN"], ["mg", "g", "kg"], ["mbar", "bar", "Pa", "kPa", "MPa"], ["°C"], ["%", "%rh"], ["µΩ", "μΩ", "mΩ", "Ω", "kΩ", "MΩ", "GΩ"], ["mW", "W", "kW"], ["ml", "mL", "l", "L"], ["ml/min", "l/min"], ["s", "dk"], ["pH"], ["Hz"]];
const gnAyniAile_ = (a, b) => { if (!a || !b) return !a || !b ? true : false; if (a === b) return true; const f = x => GN_AILE.findIndex(L => L.indexOf(x) >= 0); return f(a) >= 0 && f(a) === f(b); };
const gnCevir_ = (v, from, to) => (!from || !to || from === to || GN_BIRIM[from] === undefined || GN_BIRIM[to] === undefined) ? v : v * GN_BIRIM[from] / GN_BIRIM[to];
// En ayrıntılı eşleşen kriter satırı (Model > Marka > Cihaz Adı)
function gnKriterBul_(ss, ad, marka, model) {
  const v = kriterSekmesi_(ss).getDataRange().getValues(), h = v[0].map(norm_), c = n => h.indexOf(norm_(n)); let en = null, ep = -1;
  for (let r = 1; r < v.length; r++) {
    let p = 0, ok = true;
    [["Cihaz Adı", ad, 1], ["Marka", marka, 2], ["Model", model, 4]].forEach(([s, d, w]) => { const k = norm_(v[r][c(s)]); if (!k) return; if (norm_(d).indexOf(k) >= 0) p += w; else ok = false; });
    if (!ok || !p || String(v[r][c("Değer")]).trim() === "") continue;
    if (p > ep) { ep = p; en = { tip: String(v[r][c("Tip")] || "mutlak").trim(), deger: sayiTr_(v[r][c("Değer")]), sabit: c("Sabit") >= 0 ? (sayiTr_(v[r][c("Sabit")]) || 0) : 0, birim: c("Birim") >= 0 ? String(v[r][c("Birim")] || "").trim() : "" }; }
  }
  return en;
}
function gnSinir_(ref, kr, birim, fs) {
  const t = norm_(kr.tip), yuz = kr.deger / 100 * Math.abs(ref);
  if (/büyü|buyu/.test(t)) return Math.max(gnCevir_(kr.sabit, kr.birim, birim), yuz);
  if (/oiml|r35/.test(t)) { const L = Math.abs(gnCevir_(ref, birim, "m")); return gnCevir_(kr.sabit + kr.deger * L, "mm", birim); }
  if (/tam skala/.test(t)) return fs ? kr.deger / 100 * fs : null;
  return /%/.test(t) ? yuz + (/sabit/.test(t) ? gnCevir_(kr.sabit, kr.birim, birim) : 0) : gnCevir_(kr.deger, kr.birim, birim);
}
function gnKarar_(ref, hata, u, kr, birim, fs) {
  const lim = gnSinir_(ref, kr, birim, fs);
  if (lim === null) return { lim: null, top: Math.abs(hata) + (u || 0), karar: "KRİTER YOK" };
  const e = Math.abs(hata), U = u || 0;
  return { lim: lim, top: e + U, karar: e + U <= lim + 1e-12 ? "UYGUN" : (e <= lim + 1e-12 ? "KARAR VERİLEMİYOR" : "ÖLÇÜM RAPORUNA BAKINIZ") };
}
const gnKriterYazi_ = (kr) => { const d = x => String(x).replace(".", ","), t = norm_(kr.tip);
  if (/büyü|buyu/.test(t)) return "± %" + d(kr.deger) + " okuma, en az ± " + d(kr.sabit) + " " + kr.birim;
  if (/oiml|r35/.test(t)) return "± (" + d(kr.sabit) + " + " + d(kr.deger) + "·L) " + kr.birim + " – OIML R35";
  if (/tam skala/.test(t)) return "± %" + d(kr.deger) + " tam skala";
  return /%/.test(t) ? "± %" + d(kr.deger) + " okuma" + (/sabit/.test(t) ? " + " + d(kr.sabit) + " " + kr.birim : "") : "± " + d(kr.deger) + " " + kr.birim; };
const gnYaz_ = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(Math.max(0, d)).replace(".", ",").replace(/^-(0,?0*)$/, "$1");
// sadece: { "KK-113": 1 } (Yönlendirici) ya da boş (özel ajanı olmayan tüm cihazlar). Aynı sertifikadan daha önce okunmuş/okunamamış olanlar atlanır.
function genelOku(sadece) {
  if (sadece && typeof sadece !== "object") sadece = null;
  gnKriterleriEkle(true);
  const ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_(), bas = Date.now();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]), iKt = bul_(h, ["Kalibrasyon Tarihi"]), iAr = bul_(h, ["Ölçüm Aralığı", "Kapasite", "Ölçüm Aralığı - Kapasite"]);
  const ozel = yonOkumaAjanlari_().filter(a => a.kod !== "GENEL"), prop = PropertiesService.getScriptProperties(), basarisiz = JSON.parse(prop.getProperty("GN_BASARISIZ") || "{}");
  let ns = ss.getSheetByName(NOKTA_SEKME); if (!ns) { ns = ss.insertSheet(NOKTA_SEKME); ns.getRange(1, 1, 1, NOKTA_BASLIK.length).setValues([NOKTA_BASLIK]).setFontWeight("bold"); ns.setFrozenRows(1); }
  const eski = ns.getDataRange().getValues(), okunmus = {}; eski.slice(1).forEach(r => { if (r[0]) okunmus[anahtar_(r[0]) + "|" + String(r[1]).trim()] = 1; });
  const yeni = [], islenen = {}, rapor = [], okunamayan = []; let kaldi = 0, atlandi = 0, gecilen = 0;
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId], ad = String(v[r][iAd]); if (!id) continue;
    if (sadece ? !sadece[anahtar_(id)] : ozel.some(a => a.desen.test(ad))) continue;
    const d = idx[anahtar_(id)]; if (!d) continue;
    const cert = (d.ad.replace(/\.pdf$/i, "").match(/_([^_]+)$/) || [])[1] || "", anah = anahtar_(id) + "|" + cert;
    if (!sadece && okunmus[anah]) { atlandi++; continue; }
    if (!sadece && basarisiz[anah]) { gecilen++; continue; }   // 1.2: daha önce okunamayan (tanı dosyası Drive'da) her turda yeniden denenmez
    if (GN_COKLU.test(norm_(ad))) { okunamayan.push(id + " " + ad + " (çok fonksiyonlu – elle)"); basarisiz[anah] = "çok fonksiyonlu"; continue; }
    if (Date.now() - bas > 180000) { kaldi++; continue; }
    let metin = "", o = { noktalar: [] };
    try { metin = pdfMetni_(DriveApp.getFileById(/\/d\/([\w-]+)/.exec(d.url)[1])); o = genelMetinOku_(metin, ad); } catch (e) {}
    if (metin) aralikCozYaz_(sh, h, v, r, metin);   // 1.4
    if (!o.noktalar.length) { okunamayan.push(id + " " + ad); basarisiz[anah] = new Date().toISOString().slice(0, 10); if (metin) taniKaydet_(id, d.ad, metin); continue; }
    delete basarisiz[anah];
    const fs = iAr >= 0 ? Math.max(0, ...(String(v[r][iAr]).match(/\d+(?:[.,]\d+)?/g) || ["0"]).map(gnSayi_)) || null : null;
    const t = gnTemizle_(metin), birim = gnBirimBul_(t, ad), kr = gnKriterBul_(ss, ad, iMa >= 0 ? v[r][iMa] : "", iMo >= 0 ? v[r][iMo] : ""), bir = birim || (kr ? kr.birim : "");
    const kararlar = []; let enk = null;
    o.noktalar.forEach(n => {
      const ref = gnSayi_(n.reft), hata = gnSayi_(n.hatat) / n.olcek, dRef = n.olcek > 1 ? gnDec_(n.hatat) + 3 : Math.max(gnDec_(n.reft), gnDec_(n.olct), gnDec_(n.hatat));   // hata, sertifikadaki basamakla (µm → mm ise +3)
      let u = null, uNot = "";
      if (n.ut !== "" && !isNaN(gnSayi_(n.ut))) u = gnSayi_(n.ut) / n.olcek;
      else if (o.genelU && gnAyniAile_(o.genelU.birim, n.birim || bir)) { const ub = n.birim || bir; u = ub && GN_BIRIM[o.genelU.birim] !== undefined && GN_BIRIM[ub] !== undefined ? gnCevir_(o.genelU.v, o.genelU.birim, ub) : o.genelU.v / n.olcek; uNot = "U genel (± " + o.genelU.s + " " + o.genelU.birim + ")"; }   // 1.5: noktanın kendi birimine
      else if (o.genelU) uNot = "genel U (± " + o.genelU.s + " " + o.genelU.birim + ") nokta birimiyle uyuşmuyor – kullanılmadı";   // 1.9: ortam şartı (± 5 °C) bar noktasına U yazılmasın
      const nb = n.birim || bir;   // 1.5: her nokta kendi birimiyle (KK-08: MΩ, V, kV aynı sertifikada)
      const k = kr ? gnKarar_(ref, hata, u, kr, nb, fs) : { lim: null, top: Math.abs(hata) + (u || 0), karar: "KRİTER YOK" }; kararlar.push(k.karar);
      if (!enk || Math.abs(hata) > Math.abs(enk.h)) enk = { h: hata, d: dRef, r: n.reft, b: n.birim || bir };
      const uYaz = u === null ? "" : (n.olcek === 1 && n.ut !== "" && n.ut != null ? String(n.ut) : String(+u.toPrecision(4)).replace(".", ","));   // 1.5: U sertifikadaki gibi / çevrilmişse 4 anlamlı basamak – yuvarlanıp küçülmez
      const dK = Math.max(dRef, gnDec_(uYaz));
      yeni.push([id, cert, iKt >= 0 ? v[r][iKt] : "", ad, n.aralik || "", n.reft, n.olct, gnYaz_(hata, dRef), uYaz, nb, k.lim === null ? "" : gnYaz_(k.lim, dK), gnYaz_(k.top, dK), k.karar,
        ["genel okuyucu (" + o.yol + ")", n.not || "", n.olcek !== 1 ? "sertifikada hata " + n.hatat + " (×1/" + n.olcek + ")" : "", uNot, u === null ? "U yok" : ""].filter(Boolean).join("; "), new Date()]);
    });
    islenen[anahtar_(id)] = 1;
    const genel = kr ? genelKarar_(kararlar) : "Kriter tanımlı değil (Kabul_Kriterleri)", say = x => kararlar.filter(y => y === x).length;
    const yaz = (adi, deger) => { const c = sutunGaranti_(sh, adi); sh.getRange(r + 1, c + 1).setNumberFormat("@").setValue(deger); };
    yaz("Kabul Kriteri", kr ? gnKriterYazi_(kr) : ""); yaz("Max Hata", enk ? (enk.h > 0 ? "+" : "") + gnYaz_(enk.h, enk.d) + " " + (enk.b || bir) + " (" + enk.r + ")" : ""); yaz("Kal. Kontrol Sonucu", genel);
    const ct = sutunGaranti_(sh, "Kal. Kontrol Tarihi"); sh.getRange(r + 1, ct + 1).setValue(new Date());
    rapor.push(id + " " + ad + " [" + o.yol + ", " + (bir || "birim?") + "]: " + o.noktalar.length + " nokta · UYGUN " + say("UYGUN") + " · karar verilemiyor " + say("KARAR VERİLEMİYOR") + " · aşan " + say("ÖLÇÜM RAPORUNA BAKINIZ") + " → " + genel);
  }
  prop.setProperty("GN_BASARISIZ", JSON.stringify(basarisiz));
  if (yeni.length) {
    // 1.8: yazmadan hemen önce yeniden okunur – başka ajanların arada yazdığı satırlar silinmez
    const kalan = ns.getDataRange().getValues().slice(1).filter(x => String(x[0]).trim() !== "" && !islenen[anahtar_(x[0])]).map(x => { const s = x.slice(0, NOKTA_BASLIK.length); while (s.length < NOKTA_BASLIK.length) s.push(""); return s; });
    const tum = kalan.concat(yeni), son = ns.getLastRow();
    if (son > 1) ns.getRange(2, 1, son - 1, Math.max(ns.getLastColumn(), NOKTA_BASLIK.length)).clearContent();
    ns.getRange(2, 6, tum.length, 7).setNumberFormat("@"); ns.getRange(2, 1, tum.length, NOKTA_BASLIK.length).setValues(tum);
  }
  const m = "Genel okuyucu:\n" + (rapor.join("\n") || "okunan cihaz yok") + (atlandi ? "\n\nDaha önce okunmuş (atlandı): " + atlandi : "") + (gecilen ? "\nDaha önce okunamamış (atlandı, tanı Drive'da): " + gecilen : "") + (kaldi ? "\n⏱ Süre doldu, kalan " + kaldi + " cihaz için komutu tekrar çalıştırın." : "") + (okunamayan.length ? "\n\nOkunamayan (" + okunamayan.length + ", tanı metni Drive'a kaydedildi): " + okunamayan.join(", ") : "");
  PropertiesService.getScriptProperties().setProperty("GN_SON", JSON.stringify({ zaman: new Date().toISOString(), kaldi, okunan: rapor.length, atlandi, gecilen, okunamayan: okunamayan.length, mesaj: m.slice(0, 8000) }));
  if (!sadece && !genelOku.arka) bildir_(m);
  return m.split("\n").slice(0, 3).join(" | ");
}
// ===== 1.2: arka planda okuma (5 dakikada bir tur; bitince kendini kapatır) =====
function genelArkaPlanBaslat() {
  genelArkaPlanDurdur(true);
  ScriptApp.newTrigger("genelArkaTur").timeBased().everyMinutes(5).create();
  bildir_("Genel okuyucu arka planda başladı: 5 dakikada bir tur çalışır, hepsi bitince kendiliğinden durur.\nİlerlemeyi: Ajanlar → Genel okuyucu → \"Arka plan durumunu göster\".\nBu pencereyi kapatıp çalışmaya devam edebilirsiniz.");
}
function genelArkaTur() {
  const lk = LockService.getScriptLock(); if (!lk.tryLock(1000)) return;
  try { genelOku.arka = true; genelOku(); } finally { genelOku.arka = false; lk.releaseLock(); }
  const s = JSON.parse(PropertiesService.getScriptProperties().getProperty("GN_SON") || "{}");
  if (s.kaldi === 0) genelArkaPlanDurdur(true);
}
function genelArkaPlanDurdur(sessiz) {
  let n = 0; ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "genelArkaTur") { ScriptApp.deleteTrigger(t); n++; } });
  if (sessiz !== true) bildir_(n ? "Arka planda okuma durduruldu." : "Çalışan arka plan okuması yok.");
}
function genelArkaPlanDurum() {
  const s = JSON.parse(PropertiesService.getScriptProperties().getProperty("GN_SON") || "{}"), cal = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "genelArkaTur");
  if (!s.zaman) return bildir_("Henüz tur çalışmadı." + (cal ? " Arka plan başladı, ilk tur 5 dakika içinde." : ""));
  bildir_((cal ? "🔄 Arka planda sürüyor." : (s.kaldi === 0 ? "✓ Tamamlandı." : "⏸ Arka plan çalışmıyor.")) + "\nSon tur: " + new Date(s.zaman).toLocaleString("tr-TR") + "\nKalan: " + s.kaldi + " · Son turda okunan: " + s.okunan + " · Okunmuş (toplam atlanan): " + s.atlandi + " · Okunamayan: " + s.gecilen + "\n\n" + s.mesaj);
}
// 1.2: genel okuyucunun yazdığı satırları siler ve okunamayan listesini sıfırlar (birim düzeltmesinden sonra bir kez)
function gnSatirlariTemizle() {
  const ns = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NOKTA_SEKME); if (!ns) return bildir_("Kalibrasyon_Noktalari sekmesi yok.");
  const v = ns.getDataRange().getValues(), h = v[0].map(norm_), iN = h.indexOf(norm_("Okuma Notu")), ids = {};
  const kalan = v.slice(1).filter(r => { const g = /^genel okuyucu/i.test(String(r[iN])); if (g) ids[anahtar_(r[0])] = 1; return !g; });
  ns.getRange(2, 1, Math.max(v.length - 1, 1), v[0].length).clearContent();
  if (kalan.length) ns.getRange(2, 1, kalan.length, v[0].length).setValues(kalan);
  PropertiesService.getScriptProperties().deleteProperty("GN_BASARISIZ");
  bildir_("Genel okuyucu satırları temizlendi: " + (v.length - 1 - kalan.length) + " satır, " + Object.keys(ids).length + " cihaz. Okunamayan listesi sıfırlandı.\nŞimdi \"Arka planda oku (otomatik)\" komutunu çalıştırın.");
}
