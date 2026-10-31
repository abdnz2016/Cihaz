/***** AJAN_SICAKLIK 2.7 (2.7: yazmadan hemen önce sekme yeniden okunur – başka ajanların arada yazdığı satırlar silinmez · 2.6: ölçüm aralığı + çözünürlük; tümünü yeniden okuma + arka plan; F7.10-02 Rev 1 kriterleri; kabin U okuması düzeltildi) – Sıcaklık cihazları (etüv, su banyosu, derin dondurucu, termometre, sıcaklık ölçer, data logger…)
 * 1) Sertifikayı DOĞRUDAN okur (tablo ve kabin şablonları; sertifikadaki değerler birebir, her nokta hata = ölçülen − referans ile doğrulanır)
 * 2) Okuyamazsa ana okuyucunun Ölçümler sekmesindeki değerlerini kullanır (köprü)  3) O da yoksa tanı metnini Drive'a kaydeder.
 * Noktalar → Kalibrasyon_Noktalari, karar → Ajan_Karar (belirsizlik dahil, üç durum), özet → Cihazlar. Nem noktaları ayrı (Büyüklük: Nem) değerlendirilir. *****/
function ajanKimlik_Sicaklik() {
  return { kod: "SICAKLIK", ad: "Sıcaklık okuma", surum: "2.7", aciklama: "Sıcaklık sertifikalarını doğrudan okur ve değerlendirir",
           menu: [["Tüm sıcaklık sertifikalarını yeniden oku (arka planda)", "sicTumunuYenile"], ["Arka plan durumunu göster", "sicArkaDurum"], ["Sıcaklık cihazlarını değerlendir (bir tur)", "sicaklikOku"], ["Kabin sertifikalarını yeniden oku (U düzeltmesi, bir kez)", "sicKabinYenile"], ["Sıcaklık kabul kriterlerini ekle (bir kez)", "sicKriterleriEkle"], ["Tanı: okunamayan / az noktalı sertifika metinlerini Drive'a kaydet", "sicTaniKaydet"]], gunluk: null, web: {},
           okuma: { desen: "etüv|etuv|su banyosu|dondurucu|termometre|sıcaklık ölçer|data logger|termokupl|ısı kayıt|termoreakt", islev: "sicaklikOku" } };
}
// Başlangıç kriterleri (doğrulama kriterleriyle aynı, mutlak °C) – Kabul_Kriterleri'nde aynı Cihaz Adı yoksa eklenir; sonra siz düzenlersiniz
// F7.10-02 Rev 1: [Cihaz Adı, Değer, Tip, Sabit] – termometre/sıcaklık ölçer/data logger ortam sınıfı ±1 °C; referans sınıfı (ısı kayıt, Fluke 52, Pt100) model satırlarından
const SIC_KRITER = [["Etüv", 2], ["Su Banyosu", 1], ["Derin Dondurucu", 2], ["Termometre", 1], ["Sıcaklık Ölçer", 1], ["Data Logger", 1], ["Isı Kayıt", 0.5], ["Termoreaktör", 2], ["Kül Fırını", 3], ["Termokupl", 0.75, "en büyüğü", 2.5]];
// Model bazında üretici doğruluğu: [Cihaz Adı, Marka, Model, Büyüklük, Tip, Değer, Sabit, Kaynak, Not]  (Tip: "mutlak" ya da "% okuma + sabit")
const SIC_KRITER_MODEL = [
  ["Data Logger", "Cem", "DT-172", "Sıcaklık", "mutlak", "1", "", "CEM DT-172: ±1 °C (−10…40 °C), dışında ±2 °C", "Üretici"],
  ["Data Logger", "Cem", "DT-172", "Nem", "mutlak", "3,5", "", "CEM DT-172: ±3,5 %rh (40–60 %rh'de ±3)", "Üretici"],
  ["Termometre", "Cem DT-612", "", "Sıcaklık", "% okuma + sabit", "0,5", "1", "CEM DT-612: ±(%0,5 okuma + 1 °C), 0…1000 °C, prob hariç", "Üretici"],
  ["Termometre", "Fluke 52", "", "Sıcaklık", "% okuma + sabit", "0,05", "0,3", "Fluke 52 II: ±(%0,05 okuma + 0,3 °C), −100 °C üstü", "Üretici – prob hariç"],
  ["Sıcaklık Ölçer", "Maxim", "DS18B20", "Sıcaklık", "mutlak", "1", "", "Üretici ±0,5 °C; F7.10-02 Rev 1 proses sınıfı ±1 °C (referans U 0,3 °C ile TUR ≥ 3)", "F7.10-02 Rev 1"],
  ["Sıcaklık Ölçer", "Omron", "E5", "Sıcaklık", "mutlak", "1", "", "Omron E5CC: termokupl ±%0,3 PV veya ±1 °C (büyük olan); Pt100 ±0,8 °C", "Üretici – sensör tipine göre düzenleyin"],
  ["Sıcaklık Ölçer", "Burster", "PT", "Sıcaklık", "mutlak", "1", "", "Pt100 B sınıfı ±(0,3 + 0,005·|t|) °C; F7.10-02 Rev 1 proses sınıfı ±1 °C (referans U 0,3 °C ile TUR ≥ 3)", "F7.10-02 Rev 1"],
  ["Termokupl", "Mateş", "", "Sıcaklık", "en büyüğü", "0,75", "2,5", "K tipi termokupl Sınıf 2 (IEC 60584-1): ±2,5 °C (−40…333 °C)", "Standart – sınıf doğrulanmalı"],
  ["Termometre", "Isolab", "", "Sıcaklık", "mutlak", "1", "", "Üretici verisi bulunamadı – benzer dijital termo-higrometreler ±1 °C", "DOĞRULANMALI"],
  ["Termometre", "Enda", "", "Sıcaklık", "mutlak", "1", "", "Üretici verisi bulunamadı – panel tipi gösterge ±1 °C varsayıldı", "DOĞRULANMALI"],
  ["Sıcaklık Ölçer", "Mateş", "HT", "Sıcaklık", "mutlak", "1", "", "Üretici verisi bulunamadı", "DOĞRULANMALI"]
];
function sicKriterleriEkle(sessiz) {
  const s = kriterSekmesi_(SpreadsheetApp.openById(SHEET_ID)), v = s.getDataRange().getValues(), h = v[0].map(norm_), c = n => h.indexOf(norm_(n)), var_ = {};
  v.slice(1).forEach(r => { var_[norm_(r[c("Cihaz Adı")])] = 1; });
  const ek = SIC_KRITER.filter(x => !var_[norm_(x[0])]).map(x => { const r = new Array(h.length).fill(""); r[c("Cihaz Adı")] = x[0]; r[c("Büyüklük")] = "Sıcaklık"; r[c("Tip")] = x[2] || "mutlak"; r[c("Değer")] = String(x[1]).replace(".", ","); r[c("Kaynak")] = "F7.10-02 Rev 1"; r[c("Not")] = "Başlangıç değeri – üretici değeriyle değiştirilebilir"; if (c("Dijit") >= 0) r[c("Dijit")] = "0"; return r; });
  if (ek.length) { s.getRange(s.getLastRow() + 1, 1, ek.length, h.length).setNumberFormat("@"); s.getRange(s.getLastRow() + 1, 1, ek.length, h.length).setValues(ek); }
  // "Sabit" sütunu ve model bazında üretici kriterleri (aynı Cihaz Adı + Marka + Model + Büyüklük yoksa eklenir)
  if (c("Sabit") < 0) { s.getRange(1, h.length + 1).setValue("Sabit").setFontWeight("bold"); }
  const v2 = s.getDataRange().getValues(), h2 = v2[0].map(norm_), c2 = n => h2.indexOf(norm_(n)), var2 = {};
  v2.slice(1).forEach(r => { var2[[r[c2("Cihaz Adı")], r[c2("Marka")], r[c2("Model")], r[c2("Büyüklük")]].map(norm_).join("|")] = 1; });
  const ek2 = SIC_KRITER_MODEL.filter(x => !var2[[x[0], x[1], x[2], x[3]].map(norm_).join("|")]).map(x => { const r = new Array(h2.length).fill(""); r[c2("Cihaz Adı")] = x[0]; r[c2("Marka")] = x[1]; r[c2("Model")] = x[2]; r[c2("Büyüklük")] = x[3]; r[c2("Tip")] = x[4]; r[c2("Değer")] = x[5]; r[c2("Sabit")] = x[6]; r[c2("Kaynak")] = x[7]; r[c2("Not")] = x[8]; if (c2("Dijit") >= 0) r[c2("Dijit")] = "0"; return r; });
  if (ek2.length) { s.getRange(s.getLastRow() + 1, 1, ek2.length, h2.length).setNumberFormat("@"); s.getRange(s.getLastRow() + 1, 1, ek2.length, h2.length).setValues(ek2); }
  if (sessiz !== true) bildir_("Eklenen sıcaklık kriteri: " + (ek.length + ek2.length) + ((ek.length + ek2.length) ? " (" + ek.map(x => x[c("Cihaz Adı")]).concat(ek2.map(x => x[c2("Cihaz Adı")] + " " + x[c2("Marka")] + " " + x[c2("Model")] + " – " + x[c2("Büyüklük")])).join(", ") + ")" : " – hepsi zaten var"));
  return ek.length + ek2.length;
}
const sicListe_ = s => String(s == null ? "" : s).split(/[;|\n]+/).map(x => x.trim()).filter(x => x !== "").map(x => ({ t: x, v: parseFloat(x.replace(",", ".")) })).filter(x => !isNaN(x.v));
const sicOnd_ = t => (String(t).replace(",", ".").split(".")[1] || "").length;
const sicYaz_ = (v, d) => (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toFixed(d).replace(".", ",").replace(/^-(0,?0*)$/, "$1");
// ===== SERTİFİKA OKUYUCU (2.0): A) tablo şablonu (sıcaklık ölçer, termometre, data logger…)  B) kabin şablonu (etüv, derin dondurucu) =====
const sicSayi_ = s => parseFloat(String(s).replace(",", "."));
const sicDec_ = s => (String(s).split(",")[1] || "").length;
function sicNormal_(m) { return String(m || "").replace(/\\/g, "").replace(/[−–]/g, "-").replace(/\r/g, ""); }
// A) Tablo şablonu: "Referans [Sıcaklık|Nem] Değer…" başlığından sonra satır satır [set?] ref, ölçülen, hata, U
function sicTabloOku_(t) {
  const P = t.split(/Referans\s+(?:(Sıcaklık|Nem)\s+)?De[ğg]er/i), N = [];
  for (let i = 1; i + 1 < P.length; i += 2) {
    const tur = P[i] || "", parca = P[i + 1], bas = parca.search(/Uncertaint\w*/i); if (bas < 0) continue;
    const baslik = parca.slice(0, bas), nem = /nem/i.test(tur) || (!tur && /%\s*rh/i.test(baslik) && !/°C/.test(baslik.replace(/[\s\S]*Referans/i, "")));
    let govde = parca.slice(bas).replace(/^Uncertaint\w*[^\d-]*/i, "");
    const dur = govde.search(/Kabin\s+Set|Ölçüm\s+Belirsizli|Beyan|Sayfa\s+\d|\n\s*\d+\s*\.\s+[A-ZÇĞİÖŞÜa-zçğıöşü]/i); if (dur >= 0) govde = govde.slice(0, dur);
    const tok = (govde.match(/-?\d+(?:,\d+)?/g) || []);
    let sec = null;
    for (const k of [5, 4]) {
      if (tok.length < k || tok.length % k) continue;
      const n = tok.length / k, L = [];
      for (const duzen of ["satir", "sutun"]) {
        const al = (r, c) => duzen === "satir" ? tok[r * k + c] : tok[c * n + r], S = [];
        for (let r = 0; r < n; r++) {
          const o = k === 5 ? 1 : 0, ref = al(r, o), olc = al(r, o + 1), h = al(r, o + 2), u = al(r, o + 3);
          const tol = 0.5 * Math.pow(10, -sicDec_(ref)) + 0.5 * Math.pow(10, -sicDec_(olc)) + 0.5 * Math.pow(10, -sicDec_(h)) + 1e-9;
          const tutar = Math.abs(sicSayi_(olc) - sicSayi_(ref) - sicSayi_(h)) <= tol;
          S.push({ buyukluk: nem ? "Nem" : "Sıcaklık", birim: nem ? "%rh" : "°C", set: k === 5 ? al(r, 0) : "", reft: ref, olct: olc, hatat: h, ut: u, ref: sicSayi_(ref), olc: sicSayi_(olc), hata: sicSayi_(h), u: sicSayi_(u), tutar: tutar && sicSayi_(u) >= 0 });
        }
        if (S.every(x => x.tutar)) { sec = S; break; }
      }
      if (sec) break;
    }
    if (sec) sec.forEach(x => N.push(x));
  }
  return N;
}
// B) Kabin şablonu (etüv, derin dondurucu, su banyosu): her set bölümünde set, U ve ortalama özeti (set / kabin ortalaması / hata)
//    Yeni şablon: "Test Cihaz N.Set Sıcaklığı" … "Error of Average" (hata = set − ortalama)
//    Eski K serisi: "Set sıcaklığı Set Temperature" … "Deviation of average" (sapma = ortalama − set). U: "Şekil" yazısından önceki son sayı.
function sicKabinOku_(t) {
  const P = t.split(/Test\s+Cihaz\s+\d+\s*\.\s*Set\s+S[ıi]cakl[ıi][ğg][ıi]|Set\s+s[ıi]cakl[ıi][ğg][ıi]\s+Set\s+Temperature/), N = [];   // büyük/küçük harfe duyarlı: yeni şablonun özet başlığı ("Set Sıcaklığı Set Temperature") bölüm sayılmaz
  for (let i = 1; i < P.length; i++) {
    let sec = P[i]; const nem = sec.search(/Test\s+Cihaz\s+Nem/i); if (nem >= 0) sec = sec.slice(0, nem);
    const sm = /(-?\d+(?:,\d+)?)\s*[⁰°º]\s*C/.exec(sec.slice(0, 200)), e = sec.search(/Error\s+of\s+Average|Deviation\s+of\s+average/i);
    if (e < 0) continue;
    const sk = sec.search(/Şekil/i), onceki = sk > 0 ? (sec.slice(0, sk).match(/-?\d+,\d+/g) || []) : [], um = /Uncertaint\w*[\s\S]*?(\d+,\d+)/i.exec(sec);
    // 2.4: U = "Error of Average"dan önceki, set değerine göre küçük (≤ %10 set, en az 5) pozitif virgüllü sayı (TSE şablonunda tablo ortasında durur); bulunamazsa eski kural
    const setV = Math.abs(sicSayi_(sm ? sm[1] : "0")), adaylar = (sec.slice(0, e).match(/-?\d+,\d+/g) || []).filter(x => { const v = sicSayi_(x); return v > 0 && v <= Math.max(5, 0.1 * setV); });
    const uT = adaylar.length ? adaylar[0] : (onceki.length ? onceki[onceki.length - 1] : (um ? um[1] : ""));
    const z = (sec.slice(e).replace(/^(?:Error\s+of\s+Average|Deviation\s+of\s+average)[^\d-]*/i, "").match(/-?\d+(?:,\d+)?/g) || []).slice(0, 3); if (z.length < 3) continue;
    const setT = z[0], ortT = z[1], hT = z[2], tol = 0.5 * Math.pow(10, -sicDec_(setT)) + 0.5 * Math.pow(10, -sicDec_(ortT)) + 0.5 * Math.pow(10, -sicDec_(hT)) + 1e-9;
    const setEksi = Math.abs(sicSayi_(setT) - sicSayi_(ortT) - sicSayi_(hT)) <= tol, ortEksi = Math.abs(sicSayi_(ortT) - sicSayi_(setT) - sicSayi_(hT)) <= tol;
    // sütunlar, sertifikadaki hata = ölçülen − referans olacak şekilde yerleştirilir (hata işareti birebir korunur)
    const ref = setEksi ? ortT : setT, olc = setEksi ? setT : ortT;
    N.push({ buyukluk: "Sıcaklık", birim: "°C", set: sm ? sm[1] : setT, reft: ref, olct: olc, hatat: hT, ut: uT, ref: sicSayi_(ref), olc: sicSayi_(olc), hata: sicSayi_(hT), u: uT ? sicSayi_(uT) : null, tutar: setEksi || ortEksi, kabin: true, isaret: setEksi ? "hata = set − kabin ortalaması" : "sapma = kabin ortalaması − set" });
  }
  return N;
}
function sicMetinOku_(metin) {
  const t = sicNormal_(metin), kabin = sicKabinOku_(t);
  if (kabin.length) return { sablon: "kabin", noktalar: kabin };
  const tablo = sicTabloOku_(t);
  return { sablon: tablo.length ? "tablo" : "", noktalar: tablo };
}

// Kriter: Kabul_Kriterleri'nde Cihaz Adı / Marka / Model eşleşen ve Büyüklük'ü boş ya da aynı olan satırlardan EN AYRINTILI olanı (model > marka > yalnız cihaz adı)
function sicKriterBul_(ss, ad, marka, model, buyukluk) {
  const v = kriterSekmesi_(ss).getDataRange().getValues(), h = v[0].map(norm_), c = n => h.indexOf(norm_(n)), cihazMarkaModel = norm_(marka) + " " + norm_(model);
  let en = null, enPuan = -1;
  for (let r = 1; r < v.length; r++) {
    const es = (sut, d) => { const k = norm_(v[r][c(sut)]); return !k || norm_(d).indexOf(k) >= 0 || (sut !== "Cihaz Adı" && cihazMarkaModel.indexOf(k) >= 0); }, b = norm_(v[r][c("Büyüklük")]);
    if (!(es("Cihaz Adı", ad) && es("Marka", marka) && es("Model", model) && (!b || b === norm_(buyukluk)) && String(v[r][c("Değer")]).trim() !== "")) continue;
    const puan = (norm_(v[r][c("Model")]) ? 2 : 0) + (norm_(v[r][c("Marka")]) ? 1 : 0) + (b ? 0.5 : 0);
    if (puan > enPuan) { enPuan = puan; en = { tip: String(v[r][c("Tip")]).trim() || "mutlak", deger: sayiTr_(v[r][c("Değer")]), sabit: c("Sabit") >= 0 ? (sayiTr_(v[r][c("Sabit")]) || 0) : 0, dijit: 0, birim: "", kaynak: String(v[r][c("Kaynak")] || "") }; }
  }
  return en;
}
// "% okuma + sabit" kriterini noktaya göre mutlak sınıra çevirir; diğer tipler olduğu gibi
const sicKriterNokta_ = (kr, ref) => /büyü|buyu/i.test(kr.tip) ? { tip: "mutlak", deger: Math.max(kr.sabit, kr.deger / 100 * Math.abs(ref)), dijit: 0, birim: "" } : /sabit/i.test(kr.tip) ? { tip: "mutlak", deger: kr.deger / 100 * Math.abs(ref) + kr.sabit, dijit: 0, birim: "" } : kr;
const sicKriterYazi_ = (kr, birim) => /büyü|buyu/i.test(kr.tip) ? "± " + String(kr.sabit).replace(".", ",") + " " + birim + " ya da %" + String(kr.deger).replace(".", ",") + " okuma (büyük olan)" : /sabit/i.test(kr.tip) ? "± (%" + String(kr.deger).replace(".", ",") + " okuma + " + String(kr.sabit).replace(".", ",") + " " + birim + ")" : (/%/.test(kr.tip) ? "± %" + String(kr.deger).replace(".", ",") + " okuma" : "± " + String(kr.deger).replace(".", ",") + " " + birim);
// sadece: { "KK-05": 1, ... } (Yönlendirici) ya da boş (tüm sıcaklık cihazları). Aynı sertifikadan daha önce doğrudan okunmuş cihazlar atlanır.
// 2.5: Rev 1 öncesi değerlendirilen TÜM sıcaklık satırlarını temizler ve arka planda yeniden okur (5 dakikada bir tur, bitince durur)
function sicTumunuYenile() {
  const ns = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NOKTA_SEKME); if (!ns) return bildir_("Kalibrasyon_Noktalari sekmesi yok.");
  const v = ns.getDataRange().getValues(), h = v[0].map(norm_), iB = h.indexOf(norm_("Büyüklük")), iN = h.indexOf(norm_("Okuma Notu")), ids = {};
  const kalan = v.slice(1).filter(r => { const x = norm_(String(r[iB])) === norm_("Sıcaklık") && !/^genel okuyucu/i.test(String(r[iN])); if (x) ids[anahtar_(r[0])] = 1; return !x; });
  ns.getRange(2, 1, Math.max(v.length - 1, 1), v[0].length).clearContent();
  if (kalan.length) ns.getRange(2, 1, kalan.length, v[0].length).setValues(kalan);
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "sicArkaTur") ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger("sicArkaTur").timeBased().everyMinutes(5).create();
  bildir_("Sıcaklık satırları temizlendi: " + (v.length - 1 - kalan.length) + " satır, " + Object.keys(ids).length + " cihaz.\nArka planda yeniden okunuyor (5 dakikada bir tur, bitince durur).\nİlerleme: Ajanlar → Sıcaklık okuma → Arka plan durumunu göster.");
}
function sicArkaTur() {
  const lk = LockService.getScriptLock(); if (!lk.tryLock(1000)) return;
  try { sicaklikOku.arka = true; sicaklikOku(); } finally { sicaklikOku.arka = false; lk.releaseLock(); }
  const d = JSON.parse(PropertiesService.getScriptProperties().getProperty("SIC_SON") || "{}");
  if (d.kaldi === 0) ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "sicArkaTur") ScriptApp.deleteTrigger(t); });
}
function sicArkaDurum() {
  const d = JSON.parse(PropertiesService.getScriptProperties().getProperty("SIC_SON") || "{}"), cal = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "sicArkaTur");
  bildir_(!d.zaman ? (cal ? "Başladı, ilk tur 5 dakika içinde." : "Henüz çalışmadı.") : (cal ? "🔄 Sürüyor." : (d.kaldi === 0 ? "✓ Tamamlandı." : "⏸ Durdu.")) + "\nSon tur: " + new Date(d.zaman).toLocaleString("tr-TR") + "\nKalan: " + d.kaldi + "\n\n" + d.mesaj);
}
// 2.4: Kalibrasyon_Noktalari'ndaki kabin satırlarını (Aralık "Set …") temizler; sonraki "Sıcaklık cihazlarını değerlendir" turlarında yeni U kuralıyla yeniden okunurlar
function sicKabinYenile() {
  const ns = SpreadsheetApp.openById(SHEET_ID).getSheetByName(NOKTA_SEKME); if (!ns) return bildir_("Kalibrasyon_Noktalari sekmesi yok.");
  const v = ns.getDataRange().getValues(), h = v[0].map(norm_), iA = h.indexOf(norm_("Aralık")), ids = {};
  const kalan = v.slice(1).filter(r => { const k = /^Set\s/i.test(String(r[iA])); if (k) ids[anahtar_(r[0])] = 1; return !k; });
  ns.getRange(2, 1, Math.max(v.length - 1, 1), v[0].length).clearContent();
  if (kalan.length) ns.getRange(2, 1, kalan.length, v[0].length).setValues(kalan);
  bildir_("Kabin satırları temizlendi: " + (v.length - 1 - kalan.length) + " satır, " + Object.keys(ids).length + " cihaz.\nŞimdi menüden \"Sıcaklık cihazlarını değerlendir\"i, \"Tamamlandı\" diyene kadar tekrar çalıştırın.");
}
function sicaklikOku(sadece) {
  if (sadece && typeof sadece !== "object") sadece = null;
  sicKriterleriEkle(true);
  const ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]), iKt = bul_(h, ["Kalibrasyon Tarihi"]);
  const desen = new RegExp(ajanKimlik_Sicaklik().okuma.desen, "i"), bas = Date.now();
  const os = ss.getSheetByName("Ölçümler"), olc = {};
  if (os) { const ov = os.getDataRange().getValues(), oh = ov[0].map(norm_), oc = n => oh.indexOf(norm_(n));
    ov.slice(1).forEach(r => { const id = r[oc("Kayıt No")]; if (id) olc[anahtar_(id)] = { set: r[oc("Set Değerleri")], olc: r[oc("Ölçülen Değerler")], u: oc("Belirsizlikler") >= 0 ? r[oc("Belirsizlikler")] : "", birim: oc("Birim") >= 0 ? String(r[oc("Birim")] || "°C") : "°C", cert: oc("Sertifika No") >= 0 ? String(r[oc("Sertifika No")] || "") : "", durum: oc("Durum") >= 0 ? String(r[oc("Durum")] || "") : "" }; }); }
  let ns = ss.getSheetByName(NOKTA_SEKME); if (!ns) { ns = ss.insertSheet(NOKTA_SEKME); ns.getRange(1, 1, 1, NOKTA_BASLIK.length).setValues([NOKTA_BASLIK]).setFontWeight("bold"); ns.setFrozenRows(1); }
  const eskiNoktalar = ns.getDataRange().getValues(), dogrudan = {};
  eskiNoktalar.slice(1).forEach(r => { if (r[0] && /sertifikadan/.test(String(r[13]))) dogrudan[anahtar_(r[0]) + "|" + String(r[1]).trim()] = 1; });
  const yeni = [], islenen = {}, rapor = [], okunamayan = [], tani = []; let kaldi = 0, atlandi = 0;
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId], ad = String(v[r][iAd]); if (!id || !desen.test(ad)) continue;
    if (sadece && !sadece[anahtar_(id)]) continue;
    const d = idx[anahtar_(id)], cert = d ? sertNoDosyadanSic_(d.ad) : "";
    if (!sadece && d && dogrudan[anahtar_(id) + "|" + cert]) { atlandi++; continue; }
    if (Date.now() - bas > 180000) { kaldi++; continue; }
    let N = [], kaynak = "", sablon = "", metin = "";
    if (d) { try { metin = pdfMetni_(DriveApp.getFileById(/\/d\/([\w-]+)/.exec(d.url)[1])); if (typeof aralikCozYaz_ === "function") aralikCozYaz_(sh, h, v, r, metin); const o = sicMetinOku_(metin); if (o.noktalar.length) { N = o.noktalar; sablon = o.sablon; kaynak = "sertifikadan (" + o.sablon + " şablonu)"; } } catch (e) { metin = ""; } }
    if (!N.length) {   // köprü: Ölçümler
      const o = olc[anahtar_(id)], S = o ? sicListe_(o.set) : [], O = o ? sicListe_(o.olc) : [], U = o ? sicListe_(o.u) : [];
      if (o && S.length && O.length && !/okunamad/i.test(o.durum)) {
        for (let i = 0; i < Math.min(S.length, O.length); i++) { const u = U.length ? (U[i] || U[U.length - 1]) : null, hv = O[i].v - S[i].v, dd = Math.max(sicOnd_(O[i].t), sicOnd_(S[i].t));
          N.push({ buyukluk: "Sıcaklık", birim: o.birim, set: "", reft: S[i].t, olct: O[i].t, hatat: sicYaz_(hv, dd), ut: u ? u.t : "", ref: S[i].v, olc: O[i].v, hata: hv, u: u ? u.v : null, tutar: true }); }
        kaynak = "Ölçümler sekmesinden (" + (o.durum || "durum yok") + ")";
      }
    }
    if (!N.length) { okunamayan.push(id + " " + ad); if (d && metin) tani.push(taniKaydet_(id, d.ad, metin)); continue; }
    const kararlar = [], certYaz = cert || (olc[anahtar_(id)] || {}).cert || ""; let enk = null;
    N.forEach(n => {
      const kr = sicKriterBul_(ss, ad, iMa >= 0 ? v[r][iMa] : "", iMo >= 0 ? v[r][iMo] : "", n.buyukluk), dd = Math.max(1, sicDec_(n.hatat), sicDec_(n.olct));
      const k = kr ? noktaKarar_({ ref: n.ref, olc: n.olc, hata: n.hata, u: n.u, coz: 0 }, sicKriterNokta_(kr, n.ref)) : { lim: null, top: Math.abs(n.hata) + (n.u || 0), karar: "KRİTER YOK" };
      if (n.buyukluk === "Sıcaklık") { kararlar.push(k.karar); if (!enk || Math.abs(n.hata) > Math.abs(enk.h)) enk = { h: n.hata, t: n.hatat, s: n.kabin ? n.set : n.reft, kr: kr }; }
      const aralik = n.kabin ? "Set " + n.set + " °C" : (n.set ? "Kabin set " + n.set : "") ;
      yeni.push([id, certYaz, iKt >= 0 ? v[r][iKt] : "", n.buyukluk, aralik, n.reft, n.olct, n.hatat, n.ut, n.birim, k.lim === null ? "" : sicYaz_(k.lim, dd), sicYaz_(k.top, dd), k.karar, kaynak + (n.isaret ? "; " + n.isaret : "") + (n.tutar ? "" : "; hata, ölçülen − referans ile tutmuyor") + (n.u === null ? "; U yok" : ""), new Date()]);
    });
    islenen[anahtar_(id)] = 1;
    const kr0 = enk ? enk.kr : null, genel = kr0 ? genelKarar_(kararlar) : "Kriter tanımlı değil (Kabul_Kriterleri)", say = k => kararlar.filter(x => x === k).length;
    const yaz = (adi, deger) => { const c = sutunGaranti_(sh, adi); sh.getRange(r + 1, c + 1).setNumberFormat("@").setValue(deger); };
    yaz("Kabul Kriteri", kr0 ? sicKriterYazi_(kr0, "°C") : ""); yaz("Max Hata", enk ? (enk.h > 0 ? "+" : "") + String(enk.t).replace(/^\+/, "") + " °C (" + enk.s + " °C)" : ""); yaz("Kal. Kontrol Sonucu", genel);
    const ct = sutunGaranti_(sh, "Kal. Kontrol Tarihi"); sh.getRange(r + 1, ct + 1).setValue(new Date());
    rapor.push(id + " " + ad + " [" + (kaynak.indexOf("sertifikadan") === 0 ? sablon : "köprü") + "]: " + N.length + " nokta · UYGUN " + say("UYGUN") + " · karar verilemiyor " + say("KARAR VERİLEMİYOR") + " · aşan " + say("ÖLÇÜM RAPORUNA BAKINIZ") + " → " + genel);
  }
  if (yeni.length) {
    // 2.7: yazmadan hemen önce yeniden okunur – başka ajanların arada yazdığı satırlar silinmez
    const kalan = ns.getDataRange().getValues().slice(1).filter(x => String(x[0]).trim() !== "" && !islenen[anahtar_(x[0])]).map(x => { const s = x.slice(0, NOKTA_BASLIK.length); while (s.length < NOKTA_BASLIK.length) s.push(""); return s; });
    const tum = kalan.concat(yeni), son = ns.getLastRow();
    if (son > 1) ns.getRange(2, 1, son - 1, Math.max(ns.getLastColumn(), NOKTA_BASLIK.length)).clearContent();
    ns.getRange(2, 6, tum.length, 7).setNumberFormat("@"); ns.getRange(2, 1, tum.length, NOKTA_BASLIK.length).setValues(tum);
  }
  const metinR = "Sıcaklık okuma (2.2):\n" + (rapor.join("\n") || "okunan cihaz yok") + (atlandi ? "\n\nAynı sertifikadan daha önce okunmuş (atlandı): " + atlandi : "") + (kaldi ? "\n⏱ Süre doldu, kalan " + kaldi + " cihaz için komutu tekrar çalıştırın." : "") + (okunamayan.length ? "\n\nOkunamayan (" + okunamayan.length + "): " + okunamayan.join(", ") + (tani.length ? "\nTanı metni kaydedildi: " + tani.length : "") : "");
  PropertiesService.getScriptProperties().setProperty("SIC_SON", JSON.stringify({ zaman: new Date().toISOString(), kaldi: kaldi, mesaj: metinR.slice(0, 8000) }));
  if (!sadece && !sicaklikOku.arka) bildir_(metinR);
  return metinR.split("\n").slice(0, 3).join(" | ");
}
const sertNoDosyadanSic_ = ad => (String(ad).replace(/\.pdf$/i, "").match(/_([^_]+)$/) || [])[1] || "";

// Tanı: Ölçümler'de değeri olmayan ya da en fazla 2 noktası okunmuş sıcaklık sertifikalarının ham metnini CIHAZ_EVRAK'a Okuma_Tani_KK-xx.txt olarak kaydeder.
// Süre dolarsa tekrar çalıştırın: son 3 saatte kaydedilenler atlanır, kaldığı yerden devam eder.
function sicTaniKaydet() {
  const ss = SpreadsheetApp.openById(SHEET_ID), v = ss.getSheetByName(AYAR.SEKME).getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), desen = new RegExp(ajanKimlik_Sicaklik().okuma.desen, "i");
  const os = ss.getSheetByName("Ölçümler"), olc = {};
  if (os) { const ov = os.getDataRange().getValues(), oh = ov[0].map(norm_), oc = n => oh.indexOf(norm_(n)); ov.slice(1).forEach(r => { const id = r[oc("Kayıt No")]; if (id) olc[anahtar_(id)] = { set: r[oc("Set Değerleri")], olc: r[oc("Ölçülen Değerler")], durum: oc("Durum") >= 0 ? String(r[oc("Durum")]) : "" }; }); }
  const kl = DriveApp.getFolderById(EVRAK_KLASOR_ID), bas = Date.now(), sinir = Date.now() - 3 * 3600 * 1000, kaydedilen = [], atlanan = [], dosyasiz = [];
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId], ad = String(v[r][iAd]); if (!id || !desen.test(ad)) continue;
    const o = olc[anahtar_(id)], n = o ? Math.min(sicListe_(o.set).length, sicListe_(o.olc).length) : 0;
    if (o && n > 2 && !/okunamad/i.test(o.durum)) continue;
    const d = idx[anahtar_(id)]; if (!d) { dosyasiz.push(id); continue; }
    const ad2 = "Okuma_Tani_" + String(id).replace(/\//g, "-") + ".txt", f = kl.getFilesByName(ad2);
    if (f.hasNext() && f.next().getDateCreated().getTime() > sinir) { atlanan.push(id); continue; }
    if (Date.now() - bas > 280000) { bildir_("Süre doldu: " + kaydedilen.length + " kaydedildi. Komutu tekrar çalıştırın, kaldığı yerden devam eder."); return; }
    try { taniKaydet_(id, d.ad, pdfMetni_(DriveApp.getFileById(/\/d\/([\w-]+)/.exec(d.url)[1]))); kaydedilen.push(id + " (" + ad + ", " + n + " nokta)"); } catch (e) { kaydedilen.push(id + " HATA " + e.message); }
  }
  bildir_("Tanı metni kaydedilen: " + kaydedilen.length + (kaydedilen.length ? "\n" + kaydedilen.join("\n") : "") + (atlanan.length ? "\nDaha önce kaydedilmiş (atlandı): " + atlanan.length : "") + (dosyasiz.length ? "\nSertifika dosyası yok: " + dosyasiz.join(", ") : ""));
}
