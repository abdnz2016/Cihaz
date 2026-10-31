# Cihaz Takip Sistemi – Seval Kablo

## Proje
- Bağımsız HTML sayfaları. Derleme adımı, package.json, npm yok.
- Her sayfa kendi CSS ve JS'ini içinde taşır. Kütüphaneler CDN'den gelir.
- GitHub Pages'te yayında. QR etiketleri bu sayfalara yönlendirir.
- Veri: Google Sheet (gviz ile okunur). Yazma: Apps Script (SERVIS_URL).
- Sertifika değerleri PDF'ten sayfada okunmaz: Apps Script (Okuma.gs) okur,
  Sheet'teki "Ölçümler" sekmesine yazar; kalkontrol.html oradan gösterir.
- Ölçüm Aralığı ve Çözünürlük, Sheet'in cihaz sekmesinden gelir.
- Arayüz dili Türkçe. Kullanıcıya açıklamalar Türkçe ve sade olsun.

## Çalışma ilkeleri
- Kodlamadan önce düşün: isteği kısaca özetle, belirsizlik varsa önce sor.
- En basit çözümü seç. İstenmeyen özellik, soyutlama veya "ileride lazım olur" kodu ekleme.
- Her satırın gerekçesi olsun. Tarayıcının veya mevcut kodun zaten yaptığını yeniden yazma.
- Sadece isteneni değiştir. İlgisiz kodu düzenleme, yeniden biçimlendirme veya yeniden adlandırma.
- Değişiklikten sonra neyi değiştirdiğini ve nasıl test edileceğini kısaca yaz.

## Kurallar
- SHEET_ID ve SERVIS_URL değerlerini değiştirme.
- PIN akışını (erisimPin, kayitPin, islem:"pin") değiştirme.
- Tek dosya HTML yapısını koru. Derleme aracı veya klasör ekleme.
- Yeni CDN kütüphanesi eklemeden önce sor.
- Şifre, PIN, API anahtarı veya token'ı asla koda yazma.
- Yeni bir HTML sayfası eklediğinde veya sildiğinde, bu dosyadaki
  "Dosyalar" listesini de aynı değişiklikte güncelle.

## Dosyalar
- index.html: ana panel
- cihaz.html: QR ile açılan cihaz kartı
- dogrulama.html, toplu_yukle.html, kalkontrol.html, rapor.html: kalibrasyon/doğrulama
- depo.html, makine.html, etiket.html, karne.html: cihaz yönetimi
- harita3d.html, lab3d.html, park.html, hat.html: 3B/2B görünümler
- pano.html: index.html'e yönlendirme
