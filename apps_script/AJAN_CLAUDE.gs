/***** AJAN_CLAUDE 1.6 (mevcut okuması olmayan cihazlar karşılaştırmada doğrudan işlenir; eksik türler süzgeci, çoklu seçim; yapılandırılmış çıktı; ayar cihazı sütunları; karar ve özet; aralık/çözünürlük) – Claude okuyucu: (a) TÜM sertifikaları bağımsız okuyup mevcut okumalarla karşılaştırır (Claude_Noktalari, Claude_Karsilastirma)  (b) Genel okuyucunun okuyamadıklarını okur
 * AJAN_GENEL'e DOKUNMAZ ve Yönlendirici'ye bağlanmaz (okuma anahtarı yok): yalnızca menüden çalışır.
 * Hedef: GN_BASARISIZ listesindeki (Genel okuyucunun okuyamadığı) cihazlar ya da seçili satırdaki cihaz. Daha önce okunmuş sertifikalar atlanır.
 * Sayılar sertifikada yazıldığı gibi (metin) alınır; hata = ölçülen − referans her noktada yeniden doğrulanır; tutmayan hata uyarı olarak yazılır.
 * Karar Genel okuyucunun kriter/karar işlevleriyle (gnKriterBul_, gnKarar_) verilir ve Cihazlar özet sütunları yazılır. Kapatmak için Script Properties: CLAUDE_KARAR = kapalı.
 * Gerekenler: Script Properties → ANTHROPIC_API_KEY (menüden kaydedilir). İsteğe bağlı: CLAUDE_MODEL (varsayılan claude-sonnet-5-5). *****/
function ajanKimlik_Claude() {
  return { kod: "CLAUDE", ad: "Yedek okuyucu (Claude)", surum: "1.6", sira: 95,
           aciklama: "Genel okuyucunun okuyamadığı sertifikaları Claude ile okur",
           menu: [["EKSİK TÜRLER (listedeki) – Claude ile oku ve karşılaştır", "claudeEksikTurler"], ["TÜM sertifikaları Claude ile oku ve karşılaştır (arka planda)", "claudeTumunuKarsilastir"], ["Karşılaştırma durumunu göster", "claudeTumDurum"], ["Karşılaştırmayı durdur", "claudeTumDurdur"], ["Yalnız Claude'un okuduklarını işle (Kalibrasyon_Noktalari + karar + özet)", "claudeYeniAktar"], ["Okunamayanları Claude ile oku (arka planda)", "claudeOkunamayanlariOku"], ["Seçili satır(lar)daki cihazları Claude ile oku", "claudeSeciliOku"], ["Arka plan durumunu göster", "claudeDurum"], ["Arka planda okumayı durdur", "claudeDurdur"], ["Claude API anahtarını kaydet", "claudeAnahtarKaydet"], ["Claude bağlantısını test et", "claudeBaglantiTest"]],
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
function clYanitCoz_(kod, metin) {
  if (kod === 429 || kod === 529 || kod >= 500) return { tekrar: true, hata: "API yoğun (" + kod + ")" };
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
// 1.4: ölçüm aralığı ve çözünürlük. Boş hücreye yazılır. Çözünürlük, aralığın üst sınırına eşit ya da büyükse (ör. "0-10 l/min" için "10 l/min") açıkça yanlıştır → sertifikadaki değerle düzeltilir. Döner: rapor notu
function clAralikCozYaz_(sh, v, r, iAr, iCz, sonuc) {
  const notlar = [], ar = String(sonuc.olcum_araligi || "").trim(), cz = String(sonuc.cozunurluk || "").trim();
  if (iAr >= 0 && ar && !String(v[r][iAr]).trim()) { sh.getRange(r + 1, iAr + 1).setValue(ar); v[r][iAr] = ar; notlar.push("aralık yazıldı: " + ar); }
  if (iCz >= 0 && cz && !/;/.test(cz)) {
    const eski = String(v[r][iCz]).trim(), ust = Math.max(0, ...(String(v[r][iAr] || ar).match(/\d+(?:[.,]\d+)?/g) || ["0"]).map(clSayi_)), ev = clSayi_(eski);
    if (!eski) { sh.getRange(r + 1, iCz + 1).setValue(cz); v[r][iCz] = cz; notlar.push("çözünürlük yazıldı: " + cz); }
    else if (ust && !isNaN(ev) && ev >= ust && clSayi_(cz) < ust) { sh.getRange(r + 1, iCz + 1).setValue(cz); v[r][iCz] = cz; notlar.push("çözünürlük düzeltildi: " + eski + " → " + cz); }
    else if (eski.replace(/\s/g, "") !== cz.replace(/\s/g, "")) notlar.push("⚠ çözünürlük Cihazlar'da " + eski + ", sertifikada " + cz + " (kontrol edin)");
  }
  return notlar.join(" · ");
}
// 1.6: Doğrulanmış noktaları işler: karar (Kabul_Kriterleri), Kalibrasyon_Noktalari satırları, Cihazlar özeti, aralık/çözünürlük.
// satirlar: [{ p: {referans, olculen, not}, d: {ref, olc, hata, hataYazi, u, uYazi, birim, notlar, uyari}, aralik, buyukluk, notHazir? }]
// ara: { olcum_araligi, cozunurluk } ya da null. Döner: { yeni: [satır], genel: "UYGUN"…, arNot }
function clIsle_(ctx, r, id, certYaz, kt, satirlar, ara, ayar) {
  const { ss, sh, v, iMa, iMo, iAr, iCz, karar, model } = ctx, ad = String(v[r][sutun_(v[0], "Cihaz Adı")]);
  const arNot = ara ? clAralikCozYaz_(sh, v, r, iAr, iCz, ara) : "";   // ölçüm aralığı / çözünürlük sertifikadan (boşsa yazılır; çözünürlük aralığın üst sınırına eşit ya da büyükse düzeltilir)
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
    const ad = String(v[r][iAd]), ayar = clAyarMi_(ad), dog = clYanitDogrula_(sonuc, ayar), certYaz = String(sonuc.sertifika_no || cert || "").trim() || cert;
    if (!dog.satirlar.length) { sorunlu.push(id + ": nokta okunamadı" + (dog.uyari.length ? " (" + dog.uyari.slice(0, 2).join("; ") + ")" : "")); continue; }
    const ctx = { ss, sh, v, iMa, iMo, iAr, iCz, karar, model }, isl = clIsle_(ctx, r, id, certYaz, iKt >= 0 ? v[r][iKt] : (sonuc.kalibrasyon_tarihi || ""), dog.satirlar, sonuc, ayar), yeni = isl.yeni, arNot = isl.arNot;
    tum = tum.filter(x => anahtar_(x[0]) !== k).concat(yeni);   // bu cihazın eski satırları yenileriyle değişir
    const son = ns.getLastRow(); if (son > 1) ns.getRange(2, 1, son - 1, Math.max(ns.getLastColumn(), NOKTA_BASLIK.length)).clearContent();
    ns.getRange(2, 6, tum.length, 7).setNumberFormat("@"); ns.getRange(2, 1, tum.length, NOKTA_BASLIK.length).setValues(tum);   // her cihazdan sonra yazılır; süre dolsa da kayıp olmaz
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
  let tum = ns.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "").map(r => { const x = r.slice(0, NOKTA_BASLIK.length); while (x.length < NOKTA_BASLIK.length) x.push(""); return x; }), aktarildi = 0;
  if (ns) ns.getDataRange().getValues().slice(1).forEach(r => { if (!r[0]) return; const ref = clSayi_(r[5]), olc = clSayi_(r[6]); if (isNaN(ref) || isNaN(olc)) return; (mev[anahtar_(r[0]) + "|" + String(r[1]).trim()] = mev[anahtar_(r[0]) + "|" + String(r[1]).trim()] || []).push({ ref, olc, birim: String(r[9] || "") }); });
  const hedef = [];
  for (let r = 1; r < v.length; r++) {
    const id = v[r][iId]; if (!id) continue; const k = anahtar_(id), d = idx[k]; if (!d) continue;
    if (filtre && !filtre.test(String(v[r][iAd])) && !filtre.test(String(v[r][iAd]).toLocaleLowerCase("tr"))) continue;
    const cert = clCertDosyadan_(d.ad), anah = k + "|" + cert; if (yapilmis[anah] || (hatalar[anah] || 0) >= 2) continue;
    hedef.push({ r, id, k, d, cert, anah, ad: String(v[r][iAd]) });
  }
  let kars = ks.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "");
  let i = 0, islenen = 0;
  while (i < hedef.length && Date.now() - bas < 200000) {
    const grup = hedef.slice(i, i + paralel), istekler = [], gecerli = [];
    grup.forEach(g => { try { istekler.push(clIstek_(DriveApp.getFileById((/\/d\/([\w-]+)/.exec(g.d.url) || [0, ""])[1]), anahtar, model)); gecerli.push(g); } catch (e) { hatalar[g.anah] = 2; kars.push([g.id, g.ad, g.cert, 0, (mev[g.anah] || []).length, "", "", "", "", "✗ Claude okuyamadı", "", "PDF alınamadı: " + e.message, new Date()]); } });
    i += grup.length;
    if (!istekler.length) continue;
    const yanitlar = UrlFetchApp.fetchAll(istekler);
    yanitlar.forEach((y, j) => {
      const g = gecerli[j], c = clYanitCoz_(y.getResponseCode(), y.getContentText());
      if (c.tekrar) return;   // sonraki tur yeniden dener
      const dog = c.input ? clYanitDogrula_(c.input, clAyarMi_(g.ad)) : { satirlar: [], uyari: [c.hata] };
      if (!dog.satirlar.length) { hatalar[g.anah] = (hatalar[g.anah] || 0) + 1; if (hatalar[g.anah] >= 2) kars = kars.filter(x => !(anahtar_(x[0]) === g.k && String(x[2]) === g.cert)).concat([[g.id, g.ad, g.cert, 0, (mev[g.anah] || []).length, "", "", "", "", "✗ Claude okuyamadı", "", dog.uyari.slice(0, 3).join("; "), new Date()]]); return; }
      const certYaz = String(c.input.sertifika_no || g.cert).trim() || g.cert;
      const satir = dog.satirlar.map(x => { const d2 = x.d; const row = [g.id, certYaz, iKt >= 0 ? v[g.r][iKt] : (c.input.kalibrasyon_tarihi || ""), x.buyukluk, x.aralik, String(x.p.referans).trim(), String(x.p.olculen).trim(), d2.hataYazi, d2.u === null ? "" : d2.uYazi, d2.birim, "", String(+(Math.abs(d2.hata) + (d2.u || 0)).toPrecision(5)).replace(".", ","), "—", [CL_NOT + " (" + model + ")"].concat(x.p.not ? [String(x.p.not)] : [], d2.notlar, d2.uyari).join("; "), new Date()]; while (row.length < 19) row.push(""); row.push(g.cert, String(c.input.olcum_araligi || ""), String(c.input.cozunurluk || "")); return row; });
      cn = cn.filter(x => anahtar_(x[0]) !== g.k).concat(satir);
      const K = clKarsilastir_(dog.satirlar.map(x => ({ ref: x.d.ref, olc: x.d.olc, birim: x.d.birim })), mev[g.anah] || []);
      const ayr = K.farkli.slice(0, 4).map(f => "ref " + f.ref + " " + f.birim + ": Claude " + f.claude + " / mevcut " + f.mevcut).concat(K.yalnizMevcut.slice(0, 3).map(b => "yalnız mevcutta: ref " + b.ref + " " + b.birim)).join(" · ");
      let durum = K.durum;
      if (!(mev[g.anah] || []).length) {   // 1.6: mevcut okuması olmayan cihaz → doğrudan işlenir (Kalibrasyon_Noktalari + karar + Cihazlar özeti), elle aktarmaya gerek yok
        const isl = clIsle_(ctx, g.r, g.id, certYaz, iKt >= 0 ? v[g.r][iKt] : (c.input.kalibrasyon_tarihi || ""), dog.satirlar, c.input, clAyarMi_(g.ad));
        tum = tum.filter(x => anahtar_(x[0]) !== g.k).concat(isl.yeni); aktarildi++;
        durum = "＋ Yalnız Claude okudu → işlendi" + (isl.genel ? ": " + isl.genel : "");
      }
      kars = kars.filter(x => anahtar_(x[0]) !== g.k).concat([[g.id, g.ad, certYaz, dog.satirlar.length, (mev[g.anah] || []).length, K.eslesen, K.farkli.length, K.yalnizClaude.length, K.yalnizMevcut.length, durum, ayr, dog.uyari.slice(0, 4).join("; "), new Date()]]);
      delete hatalar[g.anah]; islenen++;
    });
    // her gruptan sonra yaz: süre dolsa da kayıp olmaz
    if (aktarildi) clNoktaYaz_(ns, tum);
    const gen = Math.max(NOKTA_BASLIK.length, 22), cnD = cn.map(x => { const s = x.slice(0, gen); while (s.length < gen) s.push(""); return s; });
    if (cs.getLastRow() > 1) cs.getRange(2, 1, cs.getLastRow() - 1, Math.max(cs.getLastColumn(), gen)).clearContent();
    if (cnD.length) { if (cs.getRange(1, 20).getValue() === "") cs.getRange(1, 20, 1, 3).setValues([["Dosyadaki Sertifika No", "Ölçüm Aralığı (sertifika)", "Çözünürlük (sertifika)"]]); cs.getRange(2, 6, cnD.length, 7).setNumberFormat("@"); cs.getRange(2, 1, cnD.length, gen).setValues(cnD); }
    if (ks.getLastRow() > 1) ks.getRange(2, 1, ks.getLastRow() - 1, CL_KARS_BAS.length).clearContent();
    if (kars.length) ks.getRange(2, 1, kars.length, CL_KARS_BAS.length).setValues(kars);
  }
  P.setProperty("CL_TUM_HATA", JSON.stringify(hatalar));
  const kalan = hedef.length - i, say = {}; kars.forEach(r => { const d = String(r[9]).replace(/\s*\(.*\)$/, "").replace(/: .*$/, ""); say[d] = (say[d] || 0) + 1; });
  P.setProperty("CL_TUM_SON", JSON.stringify({ zaman: new Date().toISOString(), islenen: islenen, kalan: kalan, say: say, aktarildi: aktarildi }));
  return kalan;
}
function claudeTumDurum() {
  const d = JSON.parse(PropertiesService.getScriptProperties().getProperty("CL_TUM_SON") || "{}"), cal = ScriptApp.getProjectTriggers().some(t => t.getHandlerFunction() === "claudeTumTur");
  if (!d.zaman) return bildir_(cal ? "Başladı, ilk tur 5 dakika içinde." : "Henüz çalışmadı.");
  bildir_((cal ? "🔄 Sürüyor." : (d.kalan === 0 ? "✓ Tamamlandı." : "⏸ Durdu.")) + "\nSon tur: " + new Date(d.zaman).toLocaleString("tr-TR") + " · bu turda " + d.islenen + " sertifika · kalan " + d.kalan +
    "\n\n" + (Object.keys(d.say || {}).sort().map(k => k + ": " + d.say[k]).join("\n") || "") + "\n\nAyrıntı: Claude_Karsilastirma sekmesi (Farklı / Yalnız Mevcut sütunlarına bakın).");
}
function clNoktaYaz_(ns, tum) {
  const son = ns.getLastRow(); if (son > 1) ns.getRange(2, 1, son - 1, Math.max(ns.getLastColumn(), NOKTA_BASLIK.length)).clearContent();
  if (tum.length) { ns.getRange(2, 6, tum.length, 7).setNumberFormat("@"); ns.getRange(2, 1, tum.length, NOKTA_BASLIK.length).setValues(tum); }
}
// "＋ Yalnız Claude okudu" olup henüz işlenmemiş cihazları (1.5 ve öncesinde okunanlar) Claude_Noktalari'ndan İŞLER: Kalibrasyon_Noktalari + karar + Cihazlar özeti. API çağrısı yapmaz.
// Mevcut okuması olan cihazlara dokunmaz.
function claudeYeniAktar() {
  const ss = SpreadsheetApp.openById(SHEET_ID), ks = ss.getSheetByName(CL_KARS), cs = ss.getSheetByName(CL_SEKME); if (!ks || !cs) return bildir_("Önce karşılaştırmayı çalıştırın.");
  const sh = ss.getSheetByName(AYAR.SEKME), v = sh.getDataRange().getValues(), h = v[0], P = PropertiesService.getScriptProperties();
  const iId = sutun_(h, AYAR.KAYIT_BASLIK), iAd = sutun_(h, "Cihaz Adı"), iMa = bul_(h, ["Marka"]), iMo = bul_(h, ["Model"]), iAr = bul_(h, ["Ölçüm Aralığı", "Ölçüm Aralığı (Kapasite)", "Kapasite", "Ölçüm Aralığı - Kapasite"]), iCz = bul_(h, ["Çözünürlük"]);
  const ctx = { ss, sh, v, iMa, iMo, iAr, iCz, karar: !/kapal/i.test(P.getProperty("CLAUDE_KARAR") || ""), model: clModel_() }, satirNo = {}; v.forEach((r, i) => { if (i && r[iId]) satirNo[anahtar_(r[iId])] = i; });
  const kv = ks.getDataRange().getValues(), hedef = {}; kv.slice(1).forEach((r, i) => { if (/Yalnız Claude/i.test(String(r[9])) && !/işlendi/i.test(String(r[9]))) hedef[anahtar_(r[0])] = i + 1; });
  const ns = clSekme_(ss, NOKTA_SEKME, NOKTA_BASLIK); let tum = ns.getDataRange().getValues().slice(1).filter(r => String(r[0]).trim() !== "").map(r => { const x = r.slice(0, NOKTA_BASLIK.length); while (x.length < NOKTA_BASLIK.length) x.push(""); return x; });
  const mevcut = {}; tum.forEach(r => { mevcut[anahtar_(r[0])] = 1; });
  const grup = {}; cs.getDataRange().getValues().slice(1).forEach(r => { const k = anahtar_(r[0]); if (r[0] && hedef[k] && !mevcut[k]) (grup[k] = grup[k] || []).push(r); });
  const rapor = [];
  Object.keys(grup).forEach(k => {
    const R = grup[k], r = satirNo[k]; if (r === undefined) return;
    const S = R.map(x => ({ p: { referans: x[5], olculen: x[6], not: "" }, d: { ref: clSayi_(x[5]), olc: clSayi_(x[6]), hata: clSayi_(x[7]), hataYazi: String(x[7]), u: String(x[8]).trim() === "" ? null : clSayi_(x[8]), uYazi: String(x[8]), birim: String(x[9]) }, aralik: x[4], buyukluk: x[3], notHazir: String(x[13]) }))
      .filter(x => !isNaN(x.d.ref) && !isNaN(x.d.olc) && !isNaN(x.d.hata));
    if (!S.length) return;
    const ara = R[0][20] !== undefined && (String(R[0][20]).trim() || String(R[0][21]).trim()) ? { olcum_araligi: R[0][20], cozunurluk: R[0][21] } : null;
    const isl = clIsle_(ctx, r, R[0][0], R[0][1], R[0][2], S, ara, clAyarMi_(String(v[r][iAd])));
    tum = tum.concat(isl.yeni);
    ks.getRange(hedef[k] + 1, 10).setValue("＋ Yalnız Claude okudu → işlendi" + (isl.genel ? ": " + isl.genel : ""));
    rapor.push(R[0][0] + ": " + S.length + " nokta" + (isl.genel ? " → " + isl.genel : "") + (isl.arNot ? " · " + isl.arNot : ""));
  });
  if (!rapor.length) return bildir_("İşlenecek yeni cihaz yok.");
  clNoktaYaz_(ns, tum);
  bildir_("İşlendi (" + rapor.length + " cihaz): Kalibrasyon_Noktalari'na yazıldı, karar verildi, Cihazlar özeti dolduruldu.\n\n" + rapor.join("\n"));
}

if (typeof module !== "undefined") module.exports = { CL_EKSIK_TURLER, clAyarMi_, clYanitCoz_, clKarsilastir_, clSayi_, clOnd_, clBirim_, clCarpan_, clNoktaDogrula_, clYanitDogrula_ };
