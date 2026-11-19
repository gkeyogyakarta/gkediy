/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: SISTEM RSVP UNDANGAN NATAL GKE DIY 2026
 * =========================================================================
 * Fitur:
 * 1. Pencegahan Duplikasi (Auto-Overwrite / Menimpa baris jika nama sudah ada)
 * 2. Proteksi Concurrency (Menggunakan LockService agar tidak bentrok)
 * 3. Deteksi Otomatis Kolom / Pembuatan Header Otomatis
 * 4. Pemblokiran Spam Tamu Umum (Tamu Undangan tanpa nama tidak akan disimpan)
 * 
 * PANDUAN PEMASANGAN:
 * 1. Buka Google Sheet tempat penampungan RSVP Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode lama di "Code.gs", lalu tempelkan (paste) seluruh kode di bawah ini.
 * 4. Klik ikon Save (Disket / Ctrl+S).
 * 5. Klik tombol "Deploy" (Terapkan) > "Kelola Deployment" (Manage Deployments).
 * 6. Klik ikon pensil (Edit), pilih versi baru ("New version"), lalu klik "Deploy".
 *    (Pastikan akses: "Siapa saja" / "Anyone").
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  
  // Tunggu antrean hingga 15 detik jika ada pengiriman bersamaan
  try {
    lock.waitLock(15000);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Server sedang sibuk, silakan coba beberapa detik lagi."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Ambil parameter data
    var rawNama = e.parameter.nama ? e.parameter.nama.trim() : "";
    var kehadiran = e.parameter.kehadiran ? e.parameter.kehadiran.trim() : "";
    var jumlah = parseInt(e.parameter.jumlah, 10);
    if (isNaN(jumlah) || kehadiran === "Tidak Hadir") {
      jumlah = (kehadiran === "Tidak Hadir") ? 0 : 1;
    }
    
    // Format Waktu Sekarang (WIB / GMT+7)
    var nowFormatted = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

    // 1. KEAMANAN: Blokir jika nama kosong atau nama generic "Tamu Undangan"
    var genericTerms = ["", "tamu", "tamu undangan", "undangan", "guest", "anonymous"];
    if (genericTerms.indexOf(rawNama.toLowerCase()) !== -1) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ignored",
        message: "Akses Tamu Undangan bersifat read-only. Data tidak dicatat ke sheet."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Setup Header otomatis jika sheet masih kosong
    var lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      sheet.appendRow([
        "Nama Tamu Undangan",
        "Status Kehadiran",
        "Jumlah Orang",
        "Waktu Konfirmasi Pertama",
        "Terakhir Diperbarui"
      ]);
      // Beri gaya visual sederhana pada header
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#D4AF37").setFontColor("#121212");
      sheet.setFrozenRows(1);
      lastRow = 1;
    }

    // 3. Cari apakah tamu dengan nama ini sudah pernah ada sebelumnya
    var rowIndexToUpdate = -1;
    
    if (lastRow > 1) {
      // Ambil seluruh data nama dari baris ke-2 hingga terakhir (Kolom A)
      var nameRange = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
      var targetNamaLower = rawNama.toLowerCase();

      for (var i = 0; i < nameRange.length; i++) {
        var existingName = (nameRange[i][0] || "").toString().trim().toLowerCase();
        if (existingName === targetNamaLower) {
          rowIndexToUpdate = i + 2; // Baris riil di sheet (karena mulai dari indeks baris ke-2)
          break;
        }
      }
    }

    // 4. TIMPA (OVERWRITE) JIKA SUDAH ADA, ATAU TAMBAH BARIS BARU JIKA BELUM ADA
    var responseAction = "";

    if (rowIndexToUpdate > 0) {
      // Tamu sudah pernah mengisi -> TIMPA (UPDATE) kolom yang sesuai
      sheet.getRange(rowIndexToUpdate, 1).setValue(rawNama);       // Nama tetap rapi
      sheet.getRange(rowIndexToUpdate, 2).setValue(kehadiran);     // Status Kehadiran terbaru
      sheet.getRange(rowIndexToUpdate, 3).setValue(jumlah);        // Jumlah orang terbaru
      sheet.getRange(rowIndexToUpdate, 5).setValue(nowFormatted);  // Waktu pembaruan
      responseAction = "updated (ditimpa)";
    } else {
      // Tamu belum pernah mengisi -> TAMBAHKAN BARIS BARU
      sheet.appendRow([
        rawNama,
        kehadiran,
        jumlah,
        nowFormatted, // Waktu konfirmasi pertama
        nowFormatted  // Terakhir diperbarui
      ]);
      responseAction = "created (baru)";
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      action: responseAction,
      nama: rawNama,
      kehadiran: kehadiran,
      jumlah: jumlah,
      updatedAt: nowFormatted
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput("Sistem RSVP Undangan Perayaan Natal GKE DIY 2026 Aktif & Siap Menerima Data.")
    .setMimeType(ContentService.MimeType.TEXT);
}
