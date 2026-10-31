/***** AJAN_CLAUDE 1.10 (Sertifika No = dosya adındaki numara, diğer ajanlar yeniden okumaz; karşılaştırma sekmeleri de güvenli yazılır; güvenli yazma: başkalarının satırları korunur; başka sertifika no ile okunmuş cihaza dokunmaz; kredi/anahtar hatasında durur, cihaz işaretlenmez; aralık = en düşük–en yüksek, çözünürlük = en hassas; sertifika → üretici tamamlama; mevcut okuması olmayan cihazlar karşılaştırmada doğrudan işlenir; eksik türler süzgeci, çoklu seçim; yapılandırılmış çıktı; ayar cihazı sütunları; karar ve özet; aralık/çözünürlük) – Claude okuyucu: (a) TÜM sertifikaları bağımsız okuyup mevcut okumalarla karşılaştırır (Claude_Noktalari, Claude_Karsilastirma)  (b) Genel okuyucunun okuyamadıklarını okur
 * AJAN_GENEL'e DOKUNMAZ ve Yönlendirici'ye bağlanmaz (okuma anahtarı yok): yalnızca menüden çalışır.
 * Hedef: GN_BASARISIZ listesindeki (Genel okuyucunun okuyamadığı) cihazlar ya da seçili satırdaki cihaz. Daha önce okunmuş sertifikalar atlanır.
 * Sayılar sertifikada yazıldığı gibi (metin) alınır; hata = ölçülen − referans her noktada yeniden doğrulanır; tutmayan hata uyarı olarak yazılır.
 * Karar Genel okuyucunun kriter/karar işlevleriyle (gnKriterBul_, gnKarar_) verilir ve Cihazlar özet sütunları yazılır. Kapatmak için Script Properties: CLAUDE_KARAR = kapalı.
 * Gerekenler: Script Properties → ANTHROPIC_API_KEY (menüden kaydedilir). İsteğe bağlı: CLAUDE_MODEL (varsayılan claude-sonnet-5-5). *****/
function ajanKimlik_Claude() {
  return { kod: "CLAUDE", ad: "Yedek okuyucu (Claude)", surum: "1.10", sira: 95,
           aciklama: "Genel okuyucunun okuyamadığı sertifikaları Claude ile okur",
           menu: [["EKSİK TÜRLER (listedeki) – Claude ile oku ve karşılaştır", "claudeEksikTurler"], ["TÜM sertifikaları Claude ile oku ve karşılaştır (arka planda)", "claudeTumunuKarsilastir"], ["Karşılaştırma durumunu göster", "claudeTumDurum"], ["Karşılaştırmayı durdur", "claudeTumDurdur"], ["Yalnız Claude'un okuduklarını işle (Kalibrasyon_Noktalari + karar + özet)", "claudeYeniAktar"], ["Okunamayanları Claude ile oku (arka planda)", "claudeOkunamayanlariOku"], ["Seçili satır(lar)daki cihazları Claude ile oku", "claudeSeciliOku"], ["Arka plan durumunu göster", "claudeDurum"], ["Arka planda okumayı durdur", "claudeDurdur"], ["Ölçüm aralığı / çözünürlük tamamla (sertifika → üretici)", "claudeAralikTamamla"], ["Hata kayıtlarını sıfırla (kredi bitti vb. sonrası)", "claudeHatalariSifirla"], ["Claude API anahtarını kaydet", "claudeAnahtarKaydet"], ["Claude bağlantısını test et", "claudeBaglantiTest"]],
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
    // [işaret, ölçek, not]: sertifikadaki hata = işaret × ölçek × (ölçülen − referans)
    const adaylar = [[1, 1, ""], [-1, 1, "işaret ters (hata = referans − cihaz)"], [1, 1000, "ölçek ×1000"], [-1, 1000, "işaret ters, ×1000"], [1, 0.001, "ölçek ÷1000"], [-1, 0.001, "işaret ters, ÷1000"]];
    const es = adaylar.find(a => Math.abs(a[0] * a[1] * hesap - hy) <= (a[1] === 1 ? dar : genis * a[1]) + hataAdim + 1e-12);
    if (es) {   // Hata sütunu her zaman ölçülen − referans yönünde ve referansın biriminde yazılır (işaret/ölçek farkı nota düşer)
      r.hata = hy / (es[0] * es[1]); const hd = Math.max(0, clOnd_(p.hata) + Math.round(Math.log10(es[1])));
      r.hataYazi = (es[0] === 1 && es[1] === 1) ? String(p.hata).trim() : r.hata.toFixed(hd).replace(".", ",").replace(/^-(0,?0*)$/, "$1");
      if (es[2]) r.notlar.push("sertifikada hata " + String(p.hata).trim() + " (" + es[2] + ")");
    }
    else {   // yazılı hata hesapla tutmuyor: hesaplanan yazılır, fark işaretlenir (rakamı sessizce değiştirmeyiz)
      r.hata = hesap; r.hataYazi = String(+hesap.toFixed(Math.min(dec + 1, 8))).replace(".", ","); r.uyari.push("sertifikadaki hata (" + p.hata + ") ölçülen − referans (" + r.hataYazi + ") ile tutmuyor");
    }
  } else { r.hata = hesap; r.hataYazi = String(+hesap.toFixed(Math.min(dec + 1, 8))).replace(".", ","); r.notlar.push("hata sertifikada yok, hesaplandı"); }
  if (r.u !== null && r.u < 0) { r.uyari.push("negatif belirsizlik"); r.u = Math.abs(r.u); }
  r.uYazi = r.u === null ? "" : String(p.belirsizlik).trim();
  const ub = clBirim_(p.belirsizlik_birimi);
  if (r.u !== null && ub && ub !== birim) {   // U başka birimde (ör. µm, değerler mm): referansın birimine çevrilir
    const k = clCarpan_(ub, birim);
    if (isNaN(k)) r.uyari.push("U birimi (" + ub + ") değer birimiyle (" + birim + ") uyuşmuyor");
    else { r.u = r.u * k; r.uYazi = String(+r.u.toPrecision(4)).replace(".", ","); r.notlar.push("U sertifikada " + String(p.belirsizlik).trim() + " " + ub); }
  }
  if (r.u === null) r.notlar.push("U yok");
  r.gecerli = true; return r;
}
// Tüm yanıtı doğrular: { satirlar: [...], uyari: [...] }
// Sizin sisteminizdeki kural (kalkontrol / rapor): AYAR cihazında Referans sütunu = cihaza girilen (set), Ölçülen = gerçek; ÖLÇÜ aletinde Referans = gerçek, Ölçülen = cihaz okuması
const CL_AYAR_RE = /etüv|etuv|su banyosu|dondurucu|kül fırını|kul firini|termoreaktör|flowmetre|debimetre|akış|akis|hava değişimi/i, CL_AYAR_DEGIL = /resistomat|spark|yüksek gerilim|oto trafo/i;
const clAyarMi_ = ad => { const n = String(ad || "").toLocaleLowerCase("tr"); return CL_AYAR_RE.test(n) && !CL_AYAR_DEGIL.test(n); };
function clYanitDogrula_(o, ayar) {
  const satir = [], uyari = [];
  (o.noktalar || []).forEach((p, i) => {
    if (p.referans_degeri !== undefined || p.cihaz_degeri !== undefined) { p = Object.assign({}, p); p.referans = ayar ? p.cihaz_degeri : p.referans_degeri; p.olculen = ayar ? p.referans_degeri : p.cihaz_degeri; }
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
const CL_ISTEM = "Bu bir kalibrasyon sertifikasıdır. Ölçüm sonuçları tablolarındaki HER satırı verilen JSON şemasına göre ver.\n" +
  "KURALLAR:\n" +
  "1. Sayıları sertifikada yazıldığı gibi, metin olarak kopyala (ondalık virgül, sondaki sıfırlar, E-notasyonu aynen). Hiçbir sayıyı hesaplama, yuvarlama, tamamlama, düzeltme.\n" +
  "2. Her nokta için iki değeri sütun BAŞLIĞINA bakarak ayır (sütun sırasına değil):\n" +
  "   `cihaz_degeri` = KALİBRE EDİLEN (test edilen) cihaza ait değer: cihazın göstergesi/okuması ya da cihaza girilen/ayarlanan set değeri (başlıklar: 'Test Değeri', 'Test Cihazından', 'Gösterge', 'Okunan', 'Set', 'Kalibre Edilen Cihaz').\n" +
  "   `referans_degeri` = REFERANS (standart) cihazın ölçtüğü/uyguladığı gerçek değer (başlıklar: 'Referans', 'Reference', 'Standart', 'Uygulanan', 'Nominal', 'Girilen', 'Test Ağırlığı').\n" +
  "   Etüv/su banyosu/fırın gibi kabinlerde: cihaz_degeri = set sıcaklığı, referans_degeri = kabin ortalaması.\n" +
  "3. `hata`: sertifikada yazılı hata/sapma sütunu; yoksa null. `belirsizlik`: genişletilmiş belirsizlik (U) o satır için; yoksa null. `birim` = referans ve cihaz değerlerinin birimi; `hata_birimi` ve `belirsizlik_birimi` farklıysa (ör. değerler mm, sapma µm) ayrıca yaz, aynıysa `birim` ile aynısını yaz. Birim sütun başlığında ya da hücrede olabilir (µΩ, mΩ, kV, mm, °C …). Belirsizlik tek bir genel değer olarak verilmişse (ör. 'Ölçüm Belirsizliği: ± 7,0 µm') her noktaya o değeri yaz.\n" +
  "4. `tablo`: satırın ait olduğu tablonun/testin adı (ör. 'Doğrusallık', 'DC Direnç Doğruluk Testi'). `aralik`: ölçüm aralığı ya da kademe (ör. '0-200 mΩ'), yoksa boş.\n" +
  "5. Tekrarlanabilirlik, köşe yükü, histerezis gibi testlerin satırlarını da ver ama `tablo` alanında test adını belirt; birden çok ölçüm sütunu varsa (ön/arka, artan/azalan) her sütun için ayrı nokta ver ve `not` alanına sütunu yaz.\n" +
  "6. Okuyamadığın ya da emin olmadığın bir yer varsa uydurma: o noktayı atla ve `okunamayan` listesine nerede olduğunu yaz.\n" +
  "7. Sertifika no, kalibrasyon tarihi (GG.AA.YYYY) ve cihaz adını doldur. `olcum_araligi`: kalibre edilen cihazın ölçme sahası/aralığı (ör. '0-10 l/min'); `cozunurluk`: cihazın çözünürlüğü birimiyle (ör. '0,01 l/min'). Sertifikada yoksa boş bırak; birden çok aralık ve çözünürlük varsa hepsini '; ' ile yaz.";
// Yapılandırılmış çıktı şeması (output_config.format): yanıt bu şemaya UYMAK ZORUNDA (her nesnede additionalProperties: false, tüm alanlar zorunlu; boş olabilenler null)
const CL_NULL_STR = { anyOf: [{ type: "string" }, { type: "null" }] };
const CL_SEMA = { type: "object", additionalProperties: false,
  required: ["sertifika_no", "kalibrasyon_tarihi", "cihaz", "olcum_araligi", "cozunurluk", "noktalar", "okunamayan", "notlar"],
  properties: {
    sertifika_no: { type: "string" }, kalibrasyon_tarihi: { type: "string" }, cihaz: { type: "string" }, olcum_araligi: { type: "string" }, cozunurluk: { type: "string" },
    noktalar: { type: "array", items: { type: "object", additionalProperties: false,
      required: ["tablo", "aralik", "buyukluk", "birim", "referans_degeri", "cihaz_degeri", "hata", "hata_birimi", "belirsizlik", "belirsizlik_birimi", "not"],
      properties: { tablo: { type: "string" }, aralik: { type: "string" }, buyukluk: { type: "string" }, birim: { type: "string" },
        referans_degeri: { type: "string" }, cihaz_degeri: { type: "string" }, hata: CL_NULL_STR, hata_birimi: { type: "string" }, belirsizlik: CL_NULL_STR, belirsizlik_birimi: { type: "string" }, not: { type: "string" } } } },
    okunamayan: { type: "array", items: { type: "string" } }, notlar: { type: "string" } } };
function clIstek_(dosya, anahtar, model) {   // UrlFetchApp.fetchAll için istek nesnesi
  const baytlar = dosya.getBlob().getBytes(); if (baytlar.length > 30 * 1024 * 1024) throw new Error("PDF 30 MB'tan büyük");
  const efor = PropertiesService.getScriptProperties().getProperty("CLAUDE_EFOR") || "low";   // çıkarma işi: düşük efor hızlı ve yeterli; zor sertifikalarda "medium"/"high"
  const govde = { model: model, max_tokens: 16000, output_config: { effort: efor, format: { type: "json_schema", schema: CL_SEMA } },
    messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: Utilities.base64Encode(baytlar) } }, { type: "text", text: CL_ISTEM }] }] };
  return { url: CL_API, method: "post", contentType: "application/json", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(govde), muteHttpExceptions: true };
}
// Yanıtı çözer: { input } ya da { tekrar: true } (yoğunluk – sonra yeniden denenir) ya da { hata }
// 1.8: hesap düzeyindeki hatalar (kredi bitti, anahtar geçersiz) – hiçbir cihaz "okunamadı" sayılmaz, çalıştırma durur
const clDurNedeni_ = (kod, metin) => /credit balance|billing/i.test(String(metin)) ? "Anthropic hesabında kredi bitti (console.anthropic.com → Billing)" : (kod === 401 ? "API anahtarı geçersiz (menüden yeniden kaydedin)" : "API erişimi reddedildi (" + kod + ")");
function clYanitCoz_(kod, metin) {
  if (kod === 429 || kod === 529 || kod >= 500) return { tekrar: true, hata: "API yoğun (" + kod + ")" };
  if (kod === 401 || kod === 403 || (kod === 400 && /credit balance|billing/i.test(String(metin)))) return { durdur: true, tekrar: true, hata: clDurNedeni_(kod, metin) };   // hesap sorunu: cihazın suçu değil
  if (kod !== 200) return { hata: "API " + kod + ": " + String(metin).slice(0, 200) };
  let j; try { j = JSON.parse(metin); } catch (e) { return { hata: "API yanıtı çözülemedi" }; }
  if (j.stop_reason === "refusal") return { hata: "model sertifikayı işlemeyi reddetti (" + ((j.stop_details || {}).category || "kategori yok") + ")" };
  const metin2 = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  let girdi; try { girdi = JSON.parse(metin2); } catch (e) { return { hata: j.stop_reason === "max_tokens" ? "yanıt uzunluk sınırına takıldı (çok büyük sertifika)" : "yanıt JSON değil" }; }
  if (j.stop_reason === "max_tokens") girdi.okunamayan = (girdi.okunamayan || []).concat(["yanıt uzunluk sınırına takıldı – nokta listesi eksik olabilir"]);
  return { input: girdi };
}
function clAnahtar_() { const a = PropertiesService.getScriptProperties().getProperty("ANTHROPIC_API_KEY"); if (!a) throw new Error("API anahtarı kayıtlı değil (menü: Claude API anahtarını kaydet)"); return a; }
const clModel_ = () => PropertiesService.getScriptProperties().getProperty("CLAUDE_MODEL") || "claude-sonnet-5-5";
function clApi_(dosya) {
  const istek = clIstek_(dosya, clAnahtar_(), clModel_());
  for (let deneme = 0; deneme < 3; deneme++) {
    const y = UrlFetchApp.fetch(istek.url, istek), c = clYanitCoz_(y.getResponseCode(), y.getContentText());
    if (c.durdur) throw new Error(c.hata);
    if (c.tekrar) { Utilities.sleep(4000 * (deneme + 1)); continue; }
    if (c.hata) throw new Error(c.hata); return c.input;
  }
  throw new Error("API yoğun, sonra tekrar deneyin");
}

// 1.4: Cihazlar özet sütunları (Ajan_Genel ile aynı biçim)
const clGenel_ = (S, kr) => !kr ? "Kriter tanımlı değil (Kabul_Kriterleri)" : (typeof genelKarar_ === "function" ? genelKarar_(S.map(x => x.kk.karar)) : S.map(x => x.kk.karar).join(","));
function clOzetYaz_(sh, r, S, kr) {
  if (typeof sutunGaranti_ !== "function") return;
  let enk = null; S.forEach(x => { if (!enk || Math.abs(x.d.hata) > Math.abs(enk.d.hata)) enk = x; });
  const yaz = (adi, deger) => { const c = sutunGaranti_(sh, adi); sh.getRange(r + 1, c + 1).setNumberFormat("@").setValue(deger); };
  yaz("Kabul Kriteri", kr && typeof gnKriterYazi_ === "function" ? gnKriterYazi_(kr) : "");
  yaz("Max Hata", enk ? (enk.d.hata > 0 ? "+" : "") + String(enk.d.hataYazi).replace(/^\+/, "") + " " + enk.d.birim + " (" + String(enk.p.referans).trim() + ")" : "");
  yaz("Kal. Kontrol Sonucu", clGenel_(S, kr));
  const ct = sutunGaranti_(sh, "Kal. Kontrol Tarihi"); sh.getRange(r + 1, ct + 1).setValue(new Date());
}
// 1.7: Ölçüm aralığı = tüm aralıkların EN DÜŞÜK – EN YÜKSEK değeri (birim çevrilerek); çözünürlük = EN HASSAS (en küçük) değer
const CL_ARL_RE = /(-?\d+(?:[.,]\d+)?)\s*(?:-|–|…|\.\.\.|÷|to|ile|ila)\s*(\+?-?\d+(?:[.,]\d+)?)\s*([^\s;,()0-9][^\s;,()]*)/gi;
const clFmt_ = x => String(+x.toPrecision(6)).replace(".", ",");
function clAralikBirlestir_(metin) {
  const A = []; let m; const re = new RegExp(CL_ARL_RE.source, "gi");
  while ((m = re.exec(String(metin || ""))) !== null) A.push({ lo: clSayi_(m[1]), hi: clSayi_(m[2].replace("+", "")), b: clBirim_(m[3]) });
  if (!A.length) return "";
  const enB = A.reduce((p, q) => { const kp = clCarpan_(p.b, q.b); return !isNaN(kp) && q.hi > p.hi * kp ? q : p; }, A[0]).b;   // en yüksek üst sınırın birimi
  let lo = Infinity, hi = -Infinity;
  for (const x of A) { const k = clCarpan_(x.b, enB); if (isNaN(k)) return A.map(y => clFmt_(y.lo) + "–" + clFmt_(y.hi) + " " + y.b).join("; "); lo = Math.min(lo, x.lo * k); hi = Math.max(hi, x.hi * k); }
  return clFmt_(lo) + "–" + clFmt_(hi) + " " + enB;
}
function clCozEnInce_(metin) {
  const C = []; let m; const re = /(\d+(?:[.,]\d+)?)\s*([^\s;,()0-9][^\s;,()]*)/g;
  while ((m = re.exec(String(metin || ""))) !== null) C.push({ v: clSayi_(m[1]), b: clBirim_(m[2]), t: m[1] + " " + clBirim_(m[2]) });
  if (!C.length) return "";
  return C.reduce((p, q) => { const k = clCarpan_(q.b, p.b); return !isNaN(k) && q.v * k < p.v ? q : p; }, C[0]).t;
}
const clUst_ = s => { const m = /([\d.,]+)\s*([^\s;,()]*)\s*$/.exec(String(s || "").trim()); return m ? { v: clSayi_(m[1]), b: clBirim_(m[2]) } : null; };   // "0–600 Ω" → {600, Ω}
// Boş hücreye yazılır. Aralık: yeni aralık mevcuttan GENİŞSE güncellenir. Çözünürlük: mevcut değer aralığın üst sınırına eşit/büyükse (açıkça yanlış) ya da yeni değer DAHA HASSASSA güncellenir.
// kaynak: "sertifika" / "üretici: <url>" – Cihazlar'da "Aralık/Çözünürlük Kaynağı" sütununa yazılır. Döner: rapor notu
function clAralikCozYaz_(sh, v, r, iAr, iCz, sonuc, kaynak) {
  const notlar = [], ar = clAralikBirlestir_(sonuc.olcum_araligi) || String(sonuc.olcum_araligi || "").trim(), cz = clCozEnInce_(sonuc.cozunurluk);
  let yazildi = false;
  if (iAr >= 0 && ar) {
    const eski = String(v[r][iAr]).trim(), e = clUst_(eski), y = clUst_(ar), k = e && y ? clCarpan_(y.b, e.b) : NaN;
    if (!eski) { sh.getRange(r + 1, iAr + 1).setValue(ar); v[r][iAr] = ar; notlar.push("aralık yazıldı: " + ar); yazildi = true; }
    else if (!isNaN(k) && y.v * k > e.v * (1 + 1e-9) && !/;/.test(ar)) { sh.getRange(r + 1, iAr + 1).setValue(ar); v[r][iAr] = ar; notlar.push("aralık genişletildi: " + eski + " → " + ar); yazildi = true; }
  }
  if (iCz >= 0 && cz) {
    const eski = String(v[r][iCz]).trim(), ust = clUst_(v[r][iAr] || ar), ev = clUst_(eski), yv = clUst_(cz);
    const kEu = ev && ust ? clCarpan_(ev.b, ust.b) : NaN, kYe = ev && yv ? clCarpan_(yv.b, ev.b) : NaN;
    if (!eski) { sh.getRange(r + 1, iCz + 1).setValue(cz); v[r][iCz] = cz; notlar.push("çözünürlük yazıldı: " + cz); yazildi = true; }
    else if (!isNaN(kEu) && ev.v * kEu >= ust.v) { sh.getRange(r + 1, iCz + 1).setValue(cz); v[r][iCz] = cz; notlar.push("çözünürlük düzeltildi: " + eski + " → " + cz); yazildi = true; }
    else if (!isNaN(kYe) && yv.v * kYe < ev.v * (1 - 1e-9)) { sh.getRange(r + 1, iCz + 1).setValue(cz); v[r][iCz] = cz; notlar.push("çözünürlük en hassasa güncellendi: " + eski + " → " + cz); yazildi = true; }
  }
  if (yazildi && kaynak && typeof sutunGaranti_ === "function") { const c = sutunGaranti_(sh, "Aralık/Çözünürlük Kaynağı"); sh.getRange(r + 1, c + 1).setValue(kaynak); }
  return notlar.join(" · ");
}
// 1.6: Doğrulanmış noktaları işler: karar (Kabul_Kriterleri), Kalibrasyon_Noktalari satırları, Cihazlar özeti, aralık/çözünürlük.
// satirlar: [{ p: {referans, olculen, not}, d: {ref, olc, hata, hataYazi, u, uYazi, birim, notlar, uyari}, aralik, buyukluk, notHazir? }]
// ara: { olcum_araligi, cozunurluk } ya da null. Döner: { yeni: [satır], genel: "UYGUN"…, arNot }
function clIsle_(ctx, r, id, certYaz, kt, satirlar, ara, ayar) {
  const { ss, sh, v, iMa, iMo, iAr, iCz, karar, model } = ctx, ad = String(v[r][sutun_(v[0], "Cihaz Adı")]);
  const arNot = ara ? clAralikCozYaz_(sh, v, r, iAr, iCz, ara, "sertifika") : "";   // ölçüm aralığı / çözünürlük sertifikadan (boşsa yazılır; çözünürlük aralığın üst sınırına eşit ya da büyükse düzeltilir)
  const fs = iAr >= 0 ? Math.max(0, ...(String(v[r][iAr]).match(/\d+(?:[.,]\d+)?/g) || ["0"]).map(clSayi_)) || null : null;
  const kr = karar && typeof gnKriterBul_ === "function" ? gnKriterBul_(ss, ad, iMa >= 0 ? v[r][iMa] : "", iMo >= 0 ? v[r][iMo] : "") : null;
  const yeni = satirlar.map(x => {
    const d2 = x.d, top = Math.abs(d2.hata) + (d2.u || 0), kk = karar ? (kr ? gnKarar_(d2.ref, d2.hata, d2.u, kr, d2.birim, fs) : { lim: null, karar: "KRİTER YOK" }) : { lim: null, karar: "—" };
    const not = x.notHazir || [CL_NOT + " (" + model + ")", ayar ? "ayar cihazı: Referans = cihaza girilen, Ölçülen = gerçek" : ""].filter(Boolean).concat(x.p.not ? [String(x.p.not)] : [], d2.notlar, d2.uyari).join("; ");
    x.kk = kk; return [id, certYaz, kt, x.buyukluk, x.aralik, String(x.p.referans).trim(), String(x.p.olculen).trim(), d2.hataYazi, d2.u === null ? "" : d2.uYazi, d2.birim,
      kk.lim === null || kk.lim === undefined ? "" : String(+kk.lim.toPrecision(4)).replace(".", ","), String(+top.toPrecision(5)).replace(".", ","), kk.karar, not, new Date()];
  });
  if (karar) clOzetYaz_(sh, r, satirlar, kr);   // Cihazlar: Kabul Kriteri · Max Hata · Kal. Kontrol Sonucu · Kal. Kontrol Tarihi (diğer ajanlarla aynı)
  return { yeni: yeni, genel: karar ? clGenel_(satirlar, kr) : "", arNot: arNot };
}
// ---------- ana işlev ----------
// 1.10: Sertifika No sütununa HER ZAMAN dosya adındaki numara yazılır – diğer ajanlar (genel, sıcaklık, direnç, sertifika ajanı) "okunmuş mu" kontrolünü bununla yapar.
// PDF'teki yazım farklıysa (ör. "0094K - 0226 - 00935") yalnız Okuma Notu'na eklenir; aksi halde sertifika ajanı cihazı "yenilenmiş" sanıp yeniden okutur ve Claude satırlarının yerine yazar.
const clSertNot_ = (dosya, pdf) => { const a = String(dosya || "").replace(/[\s-]/g, "").toUpperCase(), b = String(pdf || "").replace(/[\s-]/g, "").toUpperCase(); return pdf && a && a !== b ? "PDF'te sertifika no: " + String(pdf).trim() : ""; };
const clCertDosyadan_ = ad => (String(ad).replace(/\.pdf$/i, "").match(/_([^_]+)$/) || [])[1] || "";
// sadece: { "KK-05": 1 } verilirse yalnız o cihazlar (daha önce okunmuş olsa da yeniden); verilmezse GN_BASARISIZ listesindeki ve henüz okunmamış cihazlar. Döner: rapor metni
function claudeOku(sadece) {
  if (sadece && typeof sadece !== "object") sadece = null;
  const ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]), iKt = bul_(h, ["Kalibrasyon Tarihi"]);
  const iAr = bul_(h, ["Ölçüm Aralığı", "Ölçüm Aralığı (Kapasite)", "Kapasite", "Ölçüm Aralığı - Kapasite"]), iCz = bul_(h, ["Çözünürlük"]);
  let ns = ss.getSheetByName(NOKTA_SEKME); if (!ns) { ns = ss.insertSheet(NOKTA_SEKME); ns.getRange(1, 1, 1, NOKTA_BASLIK.length).setValues([NOKTA_BASLIK]).setFontWeight("bold"); ns.setFrozenRows(1); }
  const P = PropertiesService.getScriptProperties(), karar = !/kapal/i.test(P.getProperty("CLAUDE_KARAR") || ""), bas = Date.now(), model = P.getProperty("CLAUDE_MODEL") || "claude-sonnet-5-5";
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
    const ad = String(v[r][iAd]), ayar = clAyarMi_(ad), dog = clYanitDogrula_(sonuc, ayar), certYaz = cert || String(sonuc.sertifika_no || "").trim(), certNot = clSertNot_(cert, sonuc.sertifika_no);
    if (!dog.satirlar.length) { sorunlu.push(id + ": nokta okunamadı" + (dog.uyari.length ? " (" + dog.uyari.slice(0, 2).join("; ") + ")" : "")); continue; }
    if (certNot) dog.satirlar.forEach(x => { x.d.notlar = (x.d.notlar || []).concat([certNot]); });
    const ctx = { ss, sh, v, iMa, iMo, iAr, iCz, karar, model }, isl = clIsle_(ctx, r, id, certYaz, iKt >= 0 ? v[r][iKt] : (sonuc.kalibrasyon_tarihi || ""), dog.satirlar, sonuc, ayar), yeni = isl.yeni, arNot = isl.arNot;
    const ki = {}; ki[k] = 1; clNoktaGuncelle_(ns, ki, yeni);   // yalnız bu cihazın satırları değişir; her cihazdan sonra yazılır
    okunmus[k + "|" + certYaz] = 1; okunmus[anah] = 1; delete basarisiz[anah]; yapilan++;
    rapor.push(id + " (" + certYaz + "): " + yeni.length + " nokta" + (karar ? " → " + isl.genel : "") + (arNot ? " · " + arNot : "") + (dog.uyari.length ? " · ⚠ " + dog.uyari.length + " uyarı: " + dog.uyari.slice(0, 3).join("; ") : " · uyarı yok"));
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
// Cihazlar sekmesinde SEÇİLİ satırların cihazlarını (okunmuş olsalar da) Claude ile yeniden okur. Birden çok satır seçilebilir (Ctrl/Shift ile).
// Bir çalıştırmada süre yeterli olduğu kadar cihaz okunur (~5-6); kalanlar mesajda yazar, komutu tekrar çalıştırınca okunmuşlar atlanmaz → yalnız seçimi daraltın.
function claudeSeciliOku() {
  const sh = SpreadsheetApp.getActiveSheet(), h = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0], iId = sutun_(h, AYAR.KAYIT_BASLIK), o = {};
  const satirlar = []; (sh.getActiveRangeList() ? sh.getActiveRangeList().getRanges() : [sh.getActiveRange()]).forEach(rg => { for (let r = rg.getRow(); r < rg.getRow() + rg.getNumRows(); r++) if (r >= 2) satirlar.push(r); });
  if (!satirlar.length) return bildir_("Cihazlar sekmesinde bir ya da daha çok cihaz satırı seçin.");
  satirlar.forEach(r => { const id = sh.getRange(r, iId + 1).getValue(); if (id) o[anahtar_(id)] = 1; });
  bildir_(claudeOku(o));
}
function claudeAnahtarKaydet() {
  const ui = SpreadsheetApp.getUi(), y = ui.prompt("Claude API anahtarı", "sk-ant-… anahtarınızı yapıştırın (yalnızca Script Properties'te saklanır).", ui.ButtonSet.OK_CANCEL);
  if (y.getSelectedButton() !== ui.Button.OK || !y.getResponseText().trim()) return;
  PropertiesService.getScriptProperties().setProperty("ANTHROPIC_API_KEY", y.getResponseText().trim()); bildir_("API anahtarı kaydedildi.");
}

// Anahtar, model ve dış bağlantı izni doğru mu? Küçük bir istek gönderir (maliyeti önemsiz)
function claudeBaglantiTest() {
  let anahtar; try { anahtar = clAnahtar_(); } catch (e) { return bildir_("✗ " + e.message); }
  const model = clModel_(), y = UrlFetchApp.fetch(CL_API, { method: "post", contentType: "application/json", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01" },
    payload: JSON.stringify({ model: model, max_tokens: 20, messages: [{ role: "user", content: "Sadece TAMAM yaz." }] }), muteHttpExceptions: true });
  const kod = y.getResponseCode(), m = y.getContentText();
  if (kod === 200) return bildir_("✓ Claude bağlantısı çalışıyor.\nModel: " + model + "\nYanıt: " + ((JSON.parse(m).content || [])[0] || {}).text);
  const ipucu = kod === 401 ? "API anahtarı geçersiz – menüden yeniden kaydedin." : kod === 404 ? "Model adı bulunamadı – Script Properties'teki CLAUDE_MODEL değerini kontrol edin." : kod === 400 && /credit|balance/i.test(m) ? "Hesapta kredi yok – console.anthropic.com → Billing." : kod === 429 ? "Hız sınırı – birkaç dakika sonra deneyin." : "";
  bildir_("✗ Bağlantı hatası " + kod + (ipucu ? "\n" + ipucu : "") + "\n\n" + m.slice(0, 300));
}
// ===== 1.7: ÖLÇÜM ARALIĞI / ÇÖZÜNÜRLÜK TAMAMLAMA =====
// 1) Sertifikadan (kalibre edilen cihazın aralık/çözünürlüğü)  2) Sertifikada yoksa ÜRETİCİ teknik özelliklerinden (Claude web araması; kaynak URL'siyle).
// Yalnız aralığı ya da çözünürlüğü boş / açıkça yanlış olan cihazlar. Kaynak "Aralık/Çözünürlük Kaynağı" sütununa yazılır.
const CL_AR_SEMA = { type: "object", additionalProperties: false, required: ["olcum_araligi", "cozunurluk"], properties: { olcum_araligi: { type: "string" }, cozunurluk: { type: "string" } } };
const CL_AR_ISTEM = "Bu bir kalibrasyon sertifikasıdır. KALİBRE EDİLEN cihazın (referans/standart cihazların DEĞİL) ölçme sahasını/aralığını ve çözünürlüğünü yaz. Birden çok aralık ya da çözünürlük varsa hepsini '; ' ile ayırarak yaz (ör. '0-60 mΩ; 0-600 mΩ; 0-6 Ω'). Birimiyle, sertifikada yazıldığı gibi yaz. Sertifikada yoksa boş bırak; tahmin etme.";
function clIstekAralik_(dosya, anahtar, model) {
  const govde = { model: model, max_tokens: 2000, output_config: { effort: "low", format: { type: "json_schema", schema: CL_AR_SEMA } },
    messages: [{ role: "user", content: [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: Utilities.base64Encode(dosya.getBlob().getBytes()) } }, { type: "text", text: CL_AR_ISTEM }] }] };
  return { url: CL_API, method: "post", contentType: "application/json", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(govde), muteHttpExceptions: true };
}
function clIstekUretici_(ad, marka, model_, anahtar, model) {
  const istem = "Cihaz: " + ad + " · Marka: " + (marka || "?") + " · Model: " + (model_ || "?") + "\nBu cihazın ÜRETİCİSİNİN resmi teknik özelliklerinden (datasheet, kullanım kılavuzu, üretici sitesi) ölçüm aralığını (en düşük – en yüksek, birimiyle) ve EN HASSAS çözünürlüğünü bul. " +
    "Bulamazsan ya da model tam eşleşmiyorsa alanları boş bırak; tahmin etme. Yanıtın SONUNDA yalnız şu JSON'u yaz: {\"olcum_araligi\":\"...\",\"cozunurluk\":\"...\",\"kaynak\":\"<üretici sayfasının URL'si>\"}";
  const govde = { model: model, max_tokens: 4000, tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }], messages: [{ role: "user", content: istem }] };
  return { url: CL_API, method: "post", contentType: "application/json", headers: { "x-api-key": anahtar, "anthropic-version": "2023-06-01" }, payload: JSON.stringify(govde), muteHttpExceptions: true };
}
// Yanıt metnindeki son {"olcum_araligi":…} JSON'u
function clJsonBul_(metin) {
  const t = String(metin || ""), i = t.lastIndexOf('{"olcum_araligi"'); if (i < 0) return null;
  let d = 0; for (let j = i; j < t.length; j++) { if (t[j] === "{") d++; else if (t[j] === "}" && --d === 0) { try { return JSON.parse(t.slice(i, j + 1)); } catch (e) { return null; } } }
  return null;
}
// Hesap hatası (kredi bitti vb.) yüzünden yanlışlıkla "okunamadı / denendi" sayılan cihazları temizler – sonraki çalıştırmada yeniden denenirler
function claudeHatalariSifirla() {
  const P = PropertiesService.getScriptProperties(); P.deleteProperty("CL_AR_DENENDI"); P.deleteProperty("CL_TUM_HATA");
  const ks = SpreadsheetApp.openById(SHEET_ID).getSheetByName(CL_KARS); let n = 0;
  if (ks && ks.getLastRow() > 1) { const v = ks.getDataRange().getValues(), kalan = v.slice(1).filter(r => { const sil = /okuyamad/i.test(String(r[9])) && /API 4\d\d|credit|kredi/i.test(String(r[11])); if (sil) n++; return !sil; });
    ks.getRange(2, 1, v.length - 1, v[0].length).clearContent(); if (kalan.length) ks.getRange(2, 1, kalan.length, v[0].length).setValues(kalan); }
  bildir_("Sıfırlandı: aralık/çözünürlük deneme kayıtları ve karşılaştırma hata sayaçları silindi" + (n ? ", hesap hatası yüzünden '✗ okuyamadı' olan " + n + " satır kaldırıldı" : "") + ".\nKomutları yeniden çalıştırabilirsiniz; okunmuş cihazlar atlanır.");
}
function claudeAralikTamamla() {
  const ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_(), bas = Date.now();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]);
  const iAr = bul_(h, ["Ölçüm Aralığı", "Ölçüm Aralığı (Kapasite)", "Kapasite", "Ölçüm Aralığı - Kapasite"]), iCz = bul_(h, ["Çözünürlük"]);
  if (iAr < 0 && iCz < 0) return bildir_("Cihazlar'da 'Ölçüm Aralığı' / 'Çözünürlük' sütunu yok.");
  const P = PropertiesService.getScriptProperties(), anahtar = clAnahtar_(), model = clModel_(), paralel = Math.min(8, Math.max(1, Number(P.getProperty("CLAUDE_PARALEL")) || 4));
  const denendi = JSON.parse(P.getProperty("CL_AR_DENENDI") || "{}");   // "KK-05" → "sertifika" / "üretici" (aynı adım bir daha denenmez)
  const eksik = r => (iAr >= 0 && !String(v[r][iAr]).trim()) || (iCz >= 0 && !String(v[r][iCz]).trim()) || (iAr >= 0 && iCz >= 0 && (() => { const u = clUst_(v[r][iAr]), c = clUst_(v[r][iCz]), k = u && c ? clCarpan_(c.b, u.b) : NaN; return !isNaN(k) && c.v * k >= u.v; })());
  const sert = [], ure = [];
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId]; if (!id || !eksik(r)) continue; const k = anahtar_(id), d = idx[k];
    if (d && !/sertifika|üretici/.test(denendi[k] || "")) sert.push({ r, id, k, d }); else if (!/üretici/.test(denendi[k] || "")) ure.push({ r, id, k });
  }
  const rapor = [], bulunamadi = []; let durNedeni = "";
  const calistir = (L, istekYap, coz, adim) => {
    let i = 0;
    while (i < L.length && Date.now() - bas < 240000 && !durNedeni) {
      const grup = L.slice(i, i + paralel), ist = [], gec = []; i += grup.length;
      grup.forEach(g => { try { ist.push(istekYap(g)); gec.push(g); } catch (e) { denendi[g.k] = adim; bulunamadi.push(g.id + " (" + e.message + ")"); } });
      if (!ist.length) continue;
      UrlFetchApp.fetchAll(ist).forEach((y, j) => {
        const g = gec[j], kod = y.getResponseCode(); if (kod === 429 || kod === 529 || kod >= 500) return;   // sonra yeniden
        if (kod === 401 || kod === 403 || (kod === 400 && /credit balance|billing/i.test(y.getContentText()))) { durNedeni = clDurNedeni_(kod, y.getContentText()); return; }   // hesap sorunu: işaretlenmez
        denendi[g.k] = adim; let o = null;
        try { const jj = JSON.parse(y.getContentText()); if (kod === 200) o = coz(jj); else bulunamadi.push(g.id + " (API " + kod + ": " + String((jj.error || {}).message || "").slice(0, 80) + ")"); } catch (e) {}
        if (!o || !(String(o.olcum_araligi || "").trim() || String(o.cozunurluk || "").trim())) { if (adim === "sertifika") ure.push({ r: g.r, id: g.id, k: g.k }); else bulunamadi.push(g.id); return; }
        const not = clAralikCozYaz_(sh, v, g.r, iAr, iCz, o, adim === "sertifika" ? "sertifika" : "üretici: " + (o.kaynak || "?"));
        rapor.push(g.id + " [" + adim + "]: " + (not || "değişiklik yok (mevcut değerler daha uygun)") + (adim === "üretici" && o.kaynak ? " · " + o.kaynak : ""));
        if (eksik(g.r) && adim === "sertifika") ure.push({ r: g.r, id: g.id, k: g.k });
      });
    }
    return L.length - i;
  };
  const kalan1 = calistir(sert, g => clIstekAralik_(DriveApp.getFileById((/\/d\/([\w-]+)/.exec(g.d.url) || [0, ""])[1]), anahtar, model),
    jj => { const t = (jj.content || []).filter(c => c.type === "text").map(c => c.text).join(""); try { return JSON.parse(t); } catch (e) { return null; } }, "sertifika");
  const kalan2 = calistir(ure, g => clIstekUretici_(String(v[g.r][iAd]), iMa >= 0 ? v[g.r][iMa] : "", iMo >= 0 ? v[g.r][iMo] : "", anahtar, model),
    jj => { const o = clJsonBul_((jj.content || []).filter(c => c.type === "text").map(c => c.text).join("")); return o && /^https?:\/\//.test(String(o.kaynak || "")) ? o : null; }, "üretici");   // kaynaksız üretici bilgisi kabul edilmez
  P.setProperty("CL_AR_DENENDI", JSON.stringify(denendi));
  if (durNedeni) return bildir_("⛔ DURDU: " + durNedeni + "\nHiçbir cihaz 'denendi' olarak işaretlenmedi; sorunu giderip komutu yeniden çalıştırın." + (rapor.length ? "\n\nDurmadan önce güncellenen:\n" + rapor.join("\n") : ""));
  bildir_("Ölçüm aralığı / çözünürlük tamamlama:\n" + (rapor.join("\n") || "güncellenen yok") + (bulunamadi.length ? "\n\nBulunamadı (" + bulunamadi.length + "): " + bulunamadi.join(", ") : "") + (kalan1 + kalan2 ? "\n\n⏱ Süre doldu, kalan " + (kalan1 + kalan2) + " cihaz – komutu tekrar çalıştırın." : ""));
}
// ===== 1.2: TÜM SERTİFİKALAR – bağımsız okuma ve karşılaştırma (Kalibrasyon_Noktalari'na DOKUNMAZ) =====
const CL_SEKME = "Claude_Noktalari", CL_KARS = "Claude_Karsilastirma";
const CL_KARS_BAS = ["Kayıt No", "Cihaz Adı", "Sertifika No", "Claude Nokta", "Mevcut Nokta", "Eşleşen", "Farklı", "Yalnız Claude", "Yalnız Mevcut", "Durum", "Ayrıntı", "Uyarı", "Zaman"];
// Saf: Claude noktaları ile mevcut noktaları karşılaştırır. A, B: [{ ref, olc, birim }] (sayı). Referans aynı (birim çevrilerek) olan noktalar eşlenir, ölçülen karşılaştırılır.
function clKarsilastir_(A, B) {
  const es = (x, y) => Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(x), Math.abs(y)) + 1e-12;
  const cevir = (v, from, to) => { const k = clCarpan_(clBirim_(from), clBirim_(to)); return isNaN(k) ? NaN : v * k; };
  const kul = {}, sonuc = { eslesen: 0, farkli: [], yalnizClaude: [], yalnizMevcut: [] };
  A.forEach(a => {
    const aday = B.map((b, i) => ({ b, i, ref: cevir(b.ref, b.birim, a.birim), olc: cevir(b.olc, b.birim, a.birim) })).filter(x => !kul[x.i] && !isNaN(x.ref) && es(x.ref, a.ref));
    const tam = aday.find(x => es(x.olc, a.olc));
    if (tam) { kul[tam.i] = 1; sonuc.eslesen++; return; }
    if (aday.length) { kul[aday[0].i] = 1; sonuc.farkli.push({ ref: a.ref, birim: a.birim, claude: a.olc, mevcut: aday[0].olc }); return; }
    sonuc.yalnizClaude.push(a);
  });
  B.forEach((b, i) => { if (!kul[i]) sonuc.yalnizMevcut.push(b); });
  sonuc.durum = !B.length ? "＋ Yalnız Claude okudu" : (!sonuc.farkli.length && !sonuc.yalnizMevcut.length ? (sonuc.yalnizClaude.length ? "✓ Aynı (Claude fazladan " + sonuc.yalnizClaude.length + " nokta)" : "✓ Aynı") : "⚠ Fark var");
  return sonuc;
}
function clSekme_(ss, ad, bas) { let s = ss.getSheetByName(ad); if (!s) { s = ss.insertSheet(ad); s.getRange(1, 1, 1, bas.length).setValues([bas]).setFontWeight("bold").setBackground("#14305e").setFontColor("#ffffff"); s.setFrozenRows(1); } return s; }
// Dün verilen eksik türler listesi (Cihaz Adı'nda aranır)
const CL_EKSIK_TURLER = /miliohm|megaohm|mikrometre|standart\s*diren|çelik\s*metre|celik\s*metre|flowmetre|debimetre|ampermetre|wattmetre|yüksek\s*gerilim\s*prob|ph\s*-?\s*metre|yoğunluk\s*filtre|yogunluk\s*filtre|karl|kumpas|kül\s*fırın|kul\s*firin|blok\s*mastar|halka\s*mastar|kısmi\s*deşarj|kismi\s*desarj|komparatör|komparator|çap\s*mastar|cap\s*mastar|bakır\s*çubuk|bakir\s*cubuk|cam\s*filtre|aşındırma|asindirma|basınç|basinc|balon\s*joje|balonjoje|kronometre|ısı\s*kalibratör|isi\s*kalibrator|mezur|sirkometre|çap\s*ölçer|cap\s*olcer|gaz\s*anali|spark|kantar|güç\s*kayna|guc\s*kayna/i;
function claudeEksikTurler() {   // yalnız listedeki türler: Claude okur ve mevcut okumayla karşılaştırır (Kalibrasyon_Noktalari'na dokunmaz)
  PropertiesService.getScriptProperties().setProperty("CL_TUM_FILTRE", CL_EKSIK_TURLER.source);
  claudeTumunuKarsilastir(true);
}
function claudeTumunuKarsilastir(filtreli) {
  if (filtreli !== true) PropertiesService.getScriptProperties().deleteProperty("CL_TUM_FILTRE");
  clAnahtar_(); claudeTumDurdur(true);
  ScriptApp.newTrigger("claudeTumTur").timeBased().everyMinutes(5).create();
  bildir_("Tüm sertifikalar Claude ile arka planda okunuyor (5 dakikada bir tur, her turda " + (Number(PropertiesService.getScriptProperties().getProperty("CLAUDE_PARALEL")) || 4) + " sertifika aynı anda; bitince durur).\n\nKalibrasyon_Noktalari'na DOKUNULMAZ. Sonuçlar:\n• Claude_Noktalari – Claude'un okuduğu noktalar\n• Claude_Karsilastirma – her cihaz için mevcut okumayla karşılaştırma\n\nİlerleme: Karşılaştırma durumunu göster.");
}
function claudeTumDurdur(sessiz) {
  let n = 0; ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === "claudeTumTur") { ScriptApp.deleteTrigger(t); n++; } });
  if (sessiz !== true) bildir_(n ? "Karşılaştırma durduruldu (kaldığı yerden devam ettirilebilir)." : "Çalışan karşılaştırma yok.");
}
function claudeTumTur() {
  const lk = LockService.getScriptLock(); if (!lk.tryLock(1000)) return;
  let kalan = 0;
  try { kalan = claudeTumOku_(); } finally { lk.releaseLock(); }
  if (kalan === 0) claudeTumDurdur(true);
}
// Bir tur: Claude_Noktalari'nda henüz olmayan (cihaz + sertifika no) sertifikaları paralel okur. Döner: kalan cihaz sayısı
function claudeTumOku_() {
  const ss = SpreadsheetApp.openById(SHEET_ID), sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], idx = dosyaIndeksi_(), bas = Date.now();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iKt = bul_(h, ["Kalibrasyon Tarihi"]), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]);
  const iAr = bul_(h, ["Ölçüm Aralığı", "Ölçüm Aralığı (Kapasite)", "Kapasite", "Ölçüm Aralığı - Kapasite"]), iCz = bul_(h, ["Çözünürlük"]);
  const P = PropertiesService.getScriptProperties(), anahtar = clAnahtar_(), model = clModel_(), karar = !/kapal/i.test(P.getProperty("CLAUDE_KARAR") || ""), paralel = Math.min(8, Math.max(1, Number(P.getProperty("CLAUDE_PARALEL")) || 4));
  const hatalar = JSON.parse(P.getProperty("CL_TUM_HATA") || "{}"), filtre = P.getProperty("CL_TUM_FILTRE") ? new RegExp(P.getProperty("CL_TUM_FILTRE"), "i") : null;   // "KK-05|sert" → deneme sayısı (2 kez okunamayan atlanır)
  const cs = clSekme_(ss, CL_SEKME, NOKTA_BASLIK), ks = clSekme_(ss, CL_KARS, CL_KARS_BAS);
  let cn = cs.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "");
  const yapilmis = {}; cn.forEach(r => { yapilmis[anahtar_(r[0]) + "|" + String(r[19] || r[1]).trim()] = 1; });
  ks.getDataRange().getValues().slice(1).forEach(r => { if (/okuyamad/i.test(String(r[9]))) yapilmis[anahtar_(r[0]) + "|" + String(r[2]).trim()] = 1; });
  // mevcut okumalar (Kalibrasyon_Noktalari), cihaz|sertifika → [{ref, olc, birim}]
  const ns = clSekme_(ss, NOKTA_SEKME, NOKTA_BASLIK), mev = {}, ctx = { ss, sh, v, iMa, iMo, iAr, iCz, karar, model };
  const mevId = {}; let aktarildi = 0, bekleyen = {}, bekleyenSatir = [];   // mevId: cihazın HERHANGİ bir sertifikadan okuması var mı
  if (ns) ns.getDataRange().getValues().slice(1).forEach(r => { if (!r[0]) return; const ref = clSayi_(r[5]), olc = clSayi_(r[6]); if (isNaN(ref) || isNaN(olc)) return; (mev[anahtar_(r[0]) + "|" + String(r[1]).trim()] = mev[anahtar_(r[0]) + "|" + String(r[1]).trim()] || []).push({ ref, olc, birim: String(r[9] || "") }); (mevId[anahtar_(r[0])] = mevId[anahtar_(r[0])] || []).push({ ref, olc, birim: String(r[9] || ""), cert: String(r[1]).trim() }); });
  const hedef = [];
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId]; if (!id) continue; const k = anahtar_(id), d = idx[k]; if (!d) continue;
    if (filtre && !filtre.test(String(v[r][iAd])) && !filtre.test(String(v[r][iAd]).toLocaleLowerCase("tr"))) continue;
    const cert = clCertDosyadan_(d.ad), anah = k + "|" + cert; if (yapilmis[anah] || (hatalar[anah] || 0) >= 2) continue;
    hedef.push({ r, id, k, d, cert, anah, ad: String(v[r][iAd]) });
  }
  let kars = ks.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "");
  let i = 0, islenen = 0, durNedeni = "";
  while (i < hedef.length && Date.now() - bas < 200000 && !durNedeni) {
    const grup = hedef.slice(i, i + paralel), istekler = [], gecerli = [];
    grup.forEach(g => { try { istekler.push(clIstek_(DriveApp.getFileById((/\/d\/([\w-]+)/.exec(g.d.url) || [0, ""])[1]), anahtar, model)); gecerli.push(g); } catch (e) { hatalar[g.anah] = 2; kars.push([g.id, g.ad, g.cert, 0, (mev[g.anah] || []).length, "", "", "", "", "✗ Claude okuyamadı", "", "PDF alınamadı: " + e.message, new Date()]); } });
    i += grup.length;
    if (!istekler.length) continue;
    const yanitlar = UrlFetchApp.fetchAll(istekler);
    yanitlar.forEach((y, j) => {
      const g = gecerli[j], c = clYanitCoz_(y.getResponseCode(), y.getContentText());
      if (c.durdur) { durNedeni = c.hata; return; }
      if (c.tekrar) return;   // sonraki tur yeniden dener
      const dog = c.input ? clYanitDogrula_(c.input, clAyarMi_(g.ad)) : { satirlar: [], uyari: [c.hata] };
      if (!dog.satirlar.length) { hatalar[g.anah] = (hatalar[g.anah] || 0) + 1; if (hatalar[g.anah] >= 2) kars = kars.filter(x => !(anahtar_(x[0]) === g.k && String(x[2]) === g.cert)).concat([[g.id, g.ad, g.cert, 0, (mev[g.anah] || []).length, "", "", "", "", "✗ Claude okuyamadı", "", dog.uyari.slice(0, 3).join("; "), new Date()]]); return; }
      const certYaz = g.cert || String(c.input.sertifika_no || "").trim(), certNot = clSertNot_(g.cert, c.input.sertifika_no);
      if (certNot) dog.satirlar.forEach(x => { x.d.notlar = (x.d.notlar || []).concat([certNot]); });
      const satir = dog.satirlar.map(x => { const d2 = x.d; const row = [g.id, certYaz, iKt >= 0 ? v[g.r][iKt] : (c.input.kalibrasyon_tarihi || ""), x.buyukluk, x.aralik, String(x.p.referans).trim(), String(x.p.olculen).trim(), d2.hataYazi, d2.u === null ? "" : d2.uYazi, d2.birim, "", String(+(Math.abs(d2.hata) + (d2.u || 0)).toPrecision(5)).replace(".", ","), "—", [CL_NOT + " (" + model + ")"].concat(x.p.not ? [String(x.p.not)] : [], d2.notlar, d2.uyari).join("; "), new Date()]; while (row.length < 19) row.push(""); row.push(g.cert, String(c.input.olcum_araligi || ""), String(c.input.cozunurluk || "")); return row; });
      cn = cn.filter(x => anahtar_(x[0]) !== g.k).concat(satir);
      const ayniSert = (mev[g.anah] || []).length > 0, baska = !ayniSert && (mevId[g.k] || []).length > 0;   // 1.9: sertifika no yazımı farklı olabilir → cihazın mevcut okumasıyla karşılaştır, üzerine yazma
      const K = clKarsilastir_(dog.satirlar.map(x => ({ ref: x.d.ref, olc: x.d.olc, birim: x.d.birim })), ayniSert ? mev[g.anah] : (mevId[g.k] || []));
      const ayr = K.farkli.slice(0, 4).map(f => "ref " + f.ref + " " + f.birim + ": Claude " + f.claude + " / mevcut " + f.mevcut).concat(K.yalnizMevcut.slice(0, 3).map(b => "yalnız mevcutta: ref " + b.ref + " " + b.birim)).join(" · ");
      let durum = K.durum + (baska ? " (mevcut okuma başka sertifika no ile: " + mevId[g.k][0].cert + ")" : "");
      if (!ayniSert && !baska) {   // 1.6: mevcut okuması olmayan cihaz → doğrudan işlenir (Kalibrasyon_Noktalari + karar + Cihazlar özeti), elle aktarmaya gerek yok
        const isl = clIsle_(ctx, g.r, g.id, certYaz, iKt >= 0 ? v[g.r][iKt] : (c.input.kalibrasyon_tarihi || ""), dog.satirlar, c.input, clAyarMi_(g.ad));
        bekleyen[g.k] = 1; bekleyenSatir = bekleyenSatir.concat(isl.yeni); aktarildi++;
        durum = "＋ Yalnız Claude okudu → işlendi" + (isl.genel ? ": " + isl.genel : "");
      }
      kars = kars.filter(x => anahtar_(x[0]) !== g.k).concat([[g.id, g.ad, certYaz, dog.satirlar.length, (ayniSert ? mev[g.anah] : (mevId[g.k] || [])).length, K.eslesen, K.farkli.length, K.yalnizClaude.length, K.yalnizMevcut.length, durum, ayr, dog.uyari.slice(0, 4).join("; "), new Date()]]);
      delete hatalar[g.anah]; islenen++;
    });
    // her gruptan sonra yaz: süre dolsa da kayıp olmaz
    if (bekleyenSatir.length) { clNoktaGuncelle_(ns, bekleyen, bekleyenSatir); bekleyen = {}; bekleyenSatir = []; }
    const gen = Math.max(NOKTA_BASLIK.length, 22), degisen = {}; grup.forEach(g => { degisen[g.k] = 1; });
    if (cs.getRange(1, 20).getValue() === "") cs.getRange(1, 20, 1, 3).setValues([["Dosyadaki Sertifika No", "Ölçüm Aralığı (sertifika)", "Çözünürlük (sertifika)"]]);
    clSekmeGuncelle_(cs, gen, degisen, cn.filter(x => degisen[anahtar_(x[0])]), 7);
    clSekmeGuncelle_(ks, CL_KARS_BAS.length, degisen, kars.filter(x => degisen[anahtar_(x[0])]), 0);
  }
  P.setProperty("CL_TUM_HATA", JSON.stringify(hatalar));
  const kalan = hedef.length - i, say = {}; kars.forEach(r => { const d = String(r[9]).replace(/\s*\(.*\)$/, "").replace(/: .*$/, ""); say[d] = (say[d] || 0) + 1; });
  P.setProperty("CL_TUM_SON", JSON.stringify({ zaman: new Date().toISOString(), islenen: islenen, kalan: kalan, say: say, aktarildi: aktarildi, dur: durNedeni }));
  if (durNedeni) { claudeTumDurdur(true); return -1; }   // hesap sorunu: arka plan durur, kaldığı yerden devam ettirilebilir
  return kalan;
}
function claudeTumDurum() {
  const d = JSON.parse(PropertiesService.getScriptProperties().getProperty("CL_TUM_SON") || "{}"), cal = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "claudeTumTur");
  if (!d.zaman) return bildir_(cal ? "Başladı, ilk tur 5 dakika içinde." : "Henüz çalışmadı.");
  bildir_((d.dur ? "⛔ DURDU: " + d.dur + "\nSorunu giderip komutu yeniden başlatın; kaldığı yerden devam eder.\n\n" : "") + (cal ? "🔄 Sürüyor." : (d.kalan === 0 ? "✓ Tamamlandı." : "⏸ Durdu.")) + "\nSon tur: " + new Date(d.zaman).toLocaleString("tr-TR") + " · bu turda " + d.islenen + " sertifika · kalan " + d.kalan +
    "\n\n" + (Object.keys(d.say || {}).sort().map(k => k + ": " + d.say[k]).join("\n") || "") + "\n\nAyrıntı: Claude_Karsilastirma sekmesi (Farklı / Yalnız Mevcut sütunlarına bakın).");
}
// 1.10: herhangi bir sekmede yalnız verilen cihazların satırlarını değiştirir; yazmadan hemen önce yeniden okur (belge kilidi)
function clSekmeGuncelle_(sayfa, genislik, idler, yeni, metinSutun) {
  const lk = LockService.getDocumentLock(); lk.waitLock(60000);
  try {
    const tum = sayfa.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "" && !idler[anahtar_(r[0])]).concat(yeni).map(x => { const s = x.slice(0, genislik); while (s.length < genislik) s.push(""); return s; });
    const son = sayfa.getLastRow(); if (son > 1) sayfa.getRange(2, 1, son - 1, Math.max(sayfa.getLastColumn(), genislik)).clearContent();
    if (tum.length) { if (metinSutun) sayfa.getRange(2, 6, tum.length, metinSutun).setNumberFormat("@"); sayfa.getRange(2, 1, tum.length, genislik).setValues(tum); }
    SpreadsheetApp.flush();
  } finally { lk.releaseLock(); }
}
// 1.9: GÜVENLİ YAZMA – sekme yazmadan HEMEN ÖNCE yeniden okunur; yalnız verilen cihazların satırları değişir, diğer herkesin (genel/sıcaklık/direnç ajanları,
// arka plan turları) arada yazdığı satırlar korunur. Belge kilidi Claude komutlarını birbirine karşı sıraya sokar.
function clNoktaGuncelle_(ns, idler, yeni) {
  const lk = LockService.getDocumentLock(); lk.waitLock(60000);
  try {
    const sil = {}; Object.keys(idler).forEach(k => { sil[k] = 1; });
    const tum = ns.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "" && !sil[anahtar_(r[0])]).map(r => { const x = r.slice(0, NOKTA_BASLIK.length); while (x.length < NOKTA_BASLIK.length) x.push(""); return x; }).concat(yeni);
    const son = ns.getLastRow(); if (son > 1) ns.getRange(2, 1, son - 1, Math.max(ns.getLastColumn(), NOKTA_BASLIK.length)).clearContent();
    if (tum.length) { ns.getRange(2, 6, tum.length, 7).setNumberFormat("@"); ns.getRange(2, 1, tum.length, NOKTA_BASLIK.length).setValues(tum); }
    SpreadsheetApp.flush();
  } finally { lk.releaseLock(); }
}
// "＋ Yalnız Claude okudu" olup henüz işlenmemiş cihazları (1.5 ve öncesinde okunanlar) Claude_Noktalari'ndan İŞLER: Kalibrasyon_Noktalari + karar + Cihazlar özeti. API çağrısı yapmaz.
// Mevcut okuması olan cihazlara dokunmaz.
function claudeYeniAktar() {
  const ss = SpreadsheetApp.openById(SHEET_ID), ks = ss.getSheetByName(CL_KARS), cs = ss.getSheetByName(CL_SEKME); if (!ks || !cs) return bildir_("Önce karşılaştırmayı çalıştırın.");
  const sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], P = PropertiesService.getScriptProperties();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]), iAr = bul_(h, ["Ölçüm Aralığı", "Ölçüm Aralığı (Kapasite)", "Kapasite", "Ölçüm Aralığı - Kapasite"]), iCz = bul_(h, ["Çözünürlük"]);
  const ctx = { ss, sh, v, iMa, iMo, iAr, iCz, karar: !/kapal/i.test(P.getProperty("CLAUDE_KARAR") || ""), model: clModel_() }, satirNo = {}; v.forEach((r, i) => { if (i && r[iId]) satirNo[anahtar_(r[iId])] = i; });
  const kv = ks.getDataRange().getValues(), hedef = {}; kv.slice(1).forEach((r, i) => { if (/Yalnız Claude/i.test(String(r[9])) && !/işlendi/i.test(String(r[9]))) hedef[anahtar_(r[0])] = i + 1; });
  const ns = clSekme_(ss, NOKTA_SEKME, NOKTA_BASLIK), mevcut = {}; ns.getDataRange().getValues().slice(1).forEach(r => { if (String(r[0]).trim()) mevcut[anahtar_(r[0])] = 1; });
  const ekIds = {}; let ek = [];
  const grup = {}; cs.getDataRange().getValues().slice(1).forEach(r => { const k = anahtar_(r[0]); if (r[0] && hedef[k] && !mevcut[k]) (grup[k] = grup[k] || []).push(r); });
  const rapor = [];
  Object.keys(grup).forEach(k => {
    const R = grup[k], r = satirNo[k]; if (r === undefined) return;
    const S = R.map(x => ({ p: { referans: x[5], olculen: x[6], not: "" }, d: { ref: clSayi_(x[5]), olc: clSayi_(x[6]), hata: clSayi_(x[7]), hataYazi: String(x[7]), u: String(x[8]).trim() === "" ? null : clSayi_(x[8]), uYazi: String(x[8]), birim: String(x[9]) }, aralik: x[4], buyukluk: x[3], notHazir: String(x[13]) }))
      .filter(x => !isNaN(x.d.ref) && !isNaN(x.d.olc) && !isNaN(x.d.hata));
    if (!S.length) return;
    const ara = R[0][20] !== undefined && (String(R[0][20]).trim() || String(R[0][21]).trim()) ? { olcum_araligi: R[0][20], cozunurluk: R[0][21] } : null;
    const isl = clIsle_(ctx, r, R[0][0], R[0][1], R[0][2], S, ara, clAyarMi_(String(v[r][iAd])));
    ekIds[k] = 1; ek = ek.concat(isl.yeni);
    ks.getRange(hedef[k] + 1, 10).setValue("＋ Yalnız Claude okudu → işlendi" + (isl.genel ? ": " + isl.genel : ""));
    rapor.push(R[0][0] + ": " + S.length + " nokta" + (isl.genel ? " → " + isl.genel : "") + (isl.arNot ? " · " + isl.arNot : ""));
  });
  if (!rapor.length) return bildir_("İşlenecek yeni cihaz yok.");
  clNoktaGuncelle_(ns, ekIds, ek);
  bildir_("İşlendi (" + rapor.length + " cihaz): Kalibrasyon_Noktalari'na yazıldı, karar verildi, Cihazlar özeti dolduruldu.\n\n" + rapor.join("\n"));
}

if (typeof module !== "undefined") module.exports = { clJsonBul_, clAralikBirlestir_, clCozEnInce_, CL_EKSIK_TURLER, clAyarMi_, clYanitCoz_, clKarsilastir_, clSayi_, clOnd_, clBirim_, clCarpan_, clNoktaDogrula_, clYanitDogrula_ };
