/**
 * Undangan Perayaan Natal GKE Daerah Istimewa Yogyakarta 2026
 * Script Utama: Keamanan, Validasi Akses Tamu Undangan, Animasi, Galeri & Kontrol Musik
 */

/* ===================================================
   1. INISIALISASI & SETUP EFEK SALJU (CANVAS 2D)
=================================================== */
(function initSnowAnimation() {
    const canvas = document.getElementById('snow-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let lastWidth = window.innerWidth;
    let resizeTimeout = null;

    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (Math.abs(window.innerWidth - lastWidth) > 30) {
                lastWidth = window.innerWidth;
                width = canvas.width = window.innerWidth;
                height = canvas.height = window.innerHeight;
            }
        }, 150);
    });

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.vy = Math.random() * 1.5 + 0.5; // Kecepatan jatuh
            this.vx = Math.random() * 1 - 0.5;   // Efek angin horizontal
            this.r = Math.random() * 3 + 1;      // Ukuran butiran salju
            this.o = Math.random() * 0.5 + 0.3;  // Opacity butiran salju
        }

        update() {
            this.y += this.vy;
            this.x += this.vx;

            if (this.y > height) {
                this.reset();
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.o})`;
            ctx.fill();
        }
    }

    const particles = [];
    const particleCount = Math.min(65, Math.floor(window.innerWidth / 12));

    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }

    let isTabActive = true;
    document.addEventListener('visibilitychange', () => {
        isTabActive = !document.hidden;
    });

    function animate() {
        if (isTabActive) {
            ctx.clearRect(0, 0, width, height);
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
            }
        }
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
})();


/* ===================================================
   2. KEAMANAN DATA, SANITASI, DAN AKSES TAMU UNDANGAN
=================================================== */
// URL Webhook Google Apps Script (Hanya dipanggil untuk Tamu Personal Terdaftar)
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxZvUcNPRroqP9zaMeP-J0fjXTnyJ_V1Nk2gs06K6tLDz2lG_v02H8UWSW8qUfELmf-/exec';

/**
 * Sanitasi string input nama untuk mencegah XSS & pemalsuan data
 * @param {string|null} name
 * @returns {string} Nama yang aman atau "Tamu Undangan"
 */
function sanitizeGuestName(name) {
    if (!name || typeof name !== 'string') return "Tamu Undangan";

    // 1. Deteksi karakter kode/script berbahaya (XSS payload)
    if (/[<>{}[\]=;\/\\`]|javascript:|data:|vbscript:/i.test(name)) {
        return "Tamu Undangan";
    }

    // 2. Izinkan huruf Unicode, angka, spasi, titik, koma, kutip, ampersand, tanda hubung, kurung
    let cleaned = name.replace(/[^\p{L}\p{N}\s.,'’()&-]/gu, '');

    // 3. Normalisasi spasi dan trim
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    // 4. Batasi panjang karakter maksimum agar tidak merusak tata letak
    if (cleaned.length > 60) {
        cleaned = cleaned.substring(0, 60).trim();
    }

    // 5. Cek kata kunci generic atau nilai kosong
    const genericKeywords = [
        '', 'tamu', 'tamu undangan', 'undangan', 'guest', 'invited guest',
        'jemaat', 'sahabat', 'anonymous', 'null', 'undefined'
    ];
    if (genericKeywords.includes(cleaned.toLowerCase())) {
        return "Tamu Undangan";
    }

    return cleaned;
}

/**
 * Akses penyimpanan aman dengan penanganan exception (Safari Private / Storage disabled)
 */
function safeGetStorage(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        console.warn("Storage tidak dapat diakses:", e);
        return null;
    }
}

function safeSetStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        console.warn("Gagal menyimpan ke storage:", e);
    }
}

function safeRemoveStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.warn("Gagal menghapus storage:", e);
    }
}


/* ===================================================
   3. MANAJEMEN AKSES & FORMULIR KEHADIRAN (RSVP)
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
    // Tangkap parameter nama tamu dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const rawGuest = urlParams.get('to') || urlParams.get('nama') || urlParams.get('guest');
    const guestName = sanitizeGuestName(rawGuest);
    
    // Evaluasi apakah pengunjung berstatus Tamu Undangan (Akses Terbuka / QR Medsos)
    const isGenericGuest = (guestName.toLowerCase() === "tamu undangan");

    // Perbarui teks nama tamu di Cover dan Halaman Utama
    const guestNameElement = document.getElementById('guest-name');
    const coverGuestNameElement = document.getElementById('cover-guest-name');
    const hiddenNameInput = document.getElementById('nama-hidden');

    if (guestNameElement) guestNameElement.textContent = guestName;
    if (coverGuestNameElement) coverGuestNameElement.textContent = guestName;
    if (hiddenNameInput) hiddenNameInput.value = isGenericGuest ? '' : guestName;

    // Bersihkan data lama jika pernah ada sesi Tamu Undangan umum
    if (isGenericGuest) {
        safeRemoveStorage('gke_rsvp_general_guest');
    }

    // Efek halus munculnya bagian-bagian halaman
    document.querySelectorAll('section').forEach((sec, idx) => {
        sec.style.opacity = '0';
        sec.style.transform = 'translateY(18px)';
        sec.style.transition = `opacity 0.7s ease ${idx * 0.1}s, transform 0.7s ease ${idx * 0.1}s`;

        setTimeout(() => {
            sec.style.opacity = '1';
            sec.style.transform = 'translateY(0)';
        }, 120);
    });

    // ----------------------------------------------------
    // KONTROL AKSES RSVP (TAMU UNDANGAN vs TAMU PERSONAL)
    // ----------------------------------------------------
    const rsvpNotice = document.getElementById('rsvp-guest-notice');
    const rsvpForm = document.getElementById('rsvp-form');
    const rsvpTitle = document.getElementById('rsvp-title');
    const rsvpSubtitle = document.getElementById('rsvp-subtitle');
    const kehadiranSelect = document.getElementById('kehadiran');
    const jumlahInput = document.getElementById('jumlah');
    const groupJumlah = document.getElementById('group-jumlah');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const formStatus = document.getElementById('form-status');
    const statusBadge = document.getElementById('rsvp-status-badge');
    const badgeTitle = document.getElementById('badge-title');
    const badgeDesc = document.getElementById('badge-desc');

    if (isGenericGuest) {
        /* ===================================================
           MODE: TAMU UNDANGAN (READ ONLY)
           Pengunjung melalui QR media sosial HANYA BISA MELIHAT
           isi undangan dan TIDAK DAPAT memasukkan data diri.
        =================================================== */
        if (rsvpTitle) rsvpTitle.textContent = "Informasi Kehadiran";
        if (rsvpSubtitle) rsvpSubtitle.textContent = "Warta kehadiran & partisipasi Perayaan Natal GKE DIY 2026";
        
        if (rsvpNotice) rsvpNotice.style.display = 'block';
        if (rsvpForm) {
            rsvpForm.style.display = 'none';
            // Nonaktifkan semua elemen input demi keamanan berlapis
            rsvpForm.querySelectorAll('input, select, button').forEach(el => {
                el.disabled = true;
            });
        }

        // Cegah pengiriman formulir jika dimanipulasi melalui browser developer tools
        if (rsvpForm) {
            rsvpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                alert("Sebagai Tamu Undangan melalui QR Media Sosial, Anda berstatus akses lihat saja (Read-Only). Untuk pertanyaan atau kehadiran, silakan menghubungi Narahubung Panitia.");
                return false;
            });
        }

        return; // Selesai untuk Tamu Undangan, tidak perlu memproses handler submit
    }

    /* ===================================================
       MODE: TAMU PERSONAL TERDAFTAR (INTERACTIVE RSVP)
    =================================================== */
    if (rsvpTitle) rsvpTitle.textContent = "Konfirmasi Kehadiran";
    if (rsvpSubtitle) rsvpSubtitle.textContent = `Mohon konfirmasikan kehadiran ${guestName} untuk kenyamanan bersama`;
    if (rsvpNotice) rsvpNotice.style.display = 'none';
    if (rsvpForm) {
        rsvpForm.style.display = 'flex';
        rsvpForm.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = false;
        });
    }

    // Kunci unik penyimpanan lokal per-tamu
    const sanitizedKey = 'gke_rsvp_' + encodeURIComponent(guestName.toLowerCase().replace(/\s+/g, '_'));

    // Toggle tampilan jumlah tamu jika "Tidak Hadir"
    function handleKehadiranChange() {
        if (!kehadiranSelect) return;
        if (kehadiranSelect.value === 'Tidak Hadir') {
            if (groupJumlah) groupJumlah.style.display = 'none';
            if (jumlahInput) {
                jumlahInput.value = '0';
                jumlahInput.required = false;
                jumlahInput.removeAttribute('min');
            }
        } else {
            if (groupJumlah) groupJumlah.style.display = 'flex';
            if (jumlahInput) {
                if (jumlahInput.value === '0' || !jumlahInput.value) {
                    jumlahInput.value = '1';
                }
                jumlahInput.required = true;
                jumlahInput.setAttribute('min', '1');
            }
        }
    }

    if (kehadiranSelect) {
        kehadiranSelect.addEventListener('change', handleKehadiranChange);
    }

    // Muat data konfirmasi sebelumnya jika ada
    const existingData = safeGetStorage(sanitizedKey);
    if (existingData) {
        try {
            const parsed = JSON.parse(existingData);
            if (parsed.kehadiran && kehadiranSelect) {
                kehadiranSelect.value = parsed.kehadiran;
                handleKehadiranChange();
            }
            if (parsed.jumlah !== undefined && parsed.kehadiran === 'Hadir' && jumlahInput) {
                jumlahInput.value = parsed.jumlah;
            }

            if (statusBadge) {
                statusBadge.style.display = 'flex';
                if (badgeTitle) {
                    badgeTitle.textContent = `Konfirmasi Tersimpan: ${parsed.kehadiran}`;
                }
                if (badgeDesc) {
                    const detail = parsed.kehadiran === 'Hadir' 
                        ? `Kehadiran (${parsed.jumlah} orang) telah tercatat untuk ${guestName}.` 
                        : `Pernyataan belum bisa hadir telah tercatat untuk ${guestName}.`;
                    badgeDesc.textContent = `${detail} Anda dapat mengubah data di bawah ini jika terdapat perubahan rencana.`;
                }
            }

            if (btnText) {
                btnText.textContent = "Perbarui Konfirmasi Kehadiran";
            }
        } catch (e) {
            console.error("Gagal membaca data konfirmasi lokal:", e);
        }
    }

    // Penanganan Pengiriman Formulir RSVP dengan Rate Limiting & Timeout
    let lastSubmitTime = 0;

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Proteksi Tambahan: Jangan pernah kirim jika ternyata tamu umum
            if (isGenericGuest) {
                return;
            }

            // Rate-limiting: Cegah spam klik beruntun dalam waktu singkat
            const now = Date.now();
            if (now - lastSubmitTime < 4000) {
                if (formStatus) {
                    formStatus.textContent = "Mohon tunggu beberapa saat sebelum mengirim kembali.";
                    formStatus.className = "status-msg";
                }
                return;
            }
            lastSubmitTime = now;

            const kehadiran = kehadiranSelect ? kehadiranSelect.value : '';
            let jumlah = 0;

            if (!kehadiran) {
                if (formStatus) {
                    formStatus.textContent = "Silakan tentukan status kehadiran Anda.";
                    formStatus.className = "status-msg";
                }
                return;
            }

            if (kehadiran === 'Hadir') {
                const parsedVal = parseInt(jumlahInput ? jumlahInput.value : '1', 10);
                // Tanpa batas maksimal tamu (bebas sesuai jumlah keluarga/rombongan)
                jumlah = (!isNaN(parsedVal) && parsedVal >= 1) ? parsedVal : 1;
            } else {
                jumlah = 0;
            }

            if (submitBtn) submitBtn.disabled = true;
            if (btnText) btnText.textContent = "Menyimpan...";
            if (formStatus) {
                formStatus.textContent = "Sedang memperbarui konfirmasi kehadiran Anda...";
                formStatus.className = "status-msg loading";
            }

            const payload = {
                nama: guestName,
                kehadiran: kehadiran,
                jumlah: jumlah,
                timestamp: new Date().toISOString()
            };

            // Simpan secara lokal ke perangkat tamu
            safeSetStorage(sanitizedKey, JSON.stringify(payload));

            // Kirim ke Google Spreadsheet dengan Timeout Controller (Maksimal 8 detik)
            // Menyerahkan parameter action: 'upsert' agar script Google Sheet menimpa baris jika nama sudah ada
            try {
                if (URL_APPS_SCRIPT) {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 8000);

                    const formData = new FormData();
                    formData.append('action', 'upsert');
                    formData.append('nama', guestName);
                    formData.append('kehadiran', kehadiran);
                    formData.append('jumlah', jumlah);
                    formData.append('timestamp', payload.timestamp);

                    try {
                        await fetch(URL_APPS_SCRIPT, {
                            method: 'POST',
                            body: formData,
                            mode: 'no-cors',
                            signal: controller.signal
                        });
                    } finally {
                        clearTimeout(timeoutId);
                    }
                }
            } catch (err) {
                console.warn("Sinkronisasi server memerlukan waktu lebih lama, data tetap aman di perangkat:", err);
            }

            // Perbarui antarmuka pengguna
            setTimeout(() => {
                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.textContent = "Perbarui Konfirmasi Kehadiran";

                if (statusBadge) {
                    statusBadge.style.display = 'flex';
                    if (badgeTitle) {
                        badgeTitle.textContent = `Konfirmasi Berhasil Tersimpan: ${kehadiran}`;
                    }
                    if (badgeDesc) {
                        const msg = kehadiran === 'Hadir' 
                            ? `Terima kasih! Kehadiran ${jumlah} orang telah dikonfirmasi untuk ${guestName}.` 
                            : `Terima kasih atas konfirmasinya, ${guestName}. Doa kami menyertai.`;
                        badgeDesc.textContent = `${msg} Anda tetap dapat memperbarui pilihan ini sewaktu-waktu.`;
                    }
                }

                if (formStatus) {
                    formStatus.textContent = "✅ Konfirmasi kehadiran Anda berhasil tercatat!";
                    formStatus.className = "status-msg success";
                }
            }, 600);
        });
    }
});


/* ===================================================
   4. GALERI DOKUMENTASI & MODAL LIGHTBOX
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const galleryTrack = document.querySelector(".gallery-track");
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');

    if (galleryTrack && !galleryTrack.dataset.duplicated) {
        galleryTrack.dataset.duplicated = "true";
        const galleryImages = Array.from(galleryTrack.children);
        galleryImages.forEach((image) => {
            const clone = image.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            galleryTrack.appendChild(clone);
        });

        // Buka gambar pada Lightbox
        galleryTrack.addEventListener('click', (e) => {
            if (e.target && e.target.tagName === 'IMG') {
                const img = e.target;
                if (modalImg && modal) {
                    modalImg.src = img.src;
                    if (modalCaption) {
                        modalCaption.textContent = img.alt || "Dokumentasi Keluarga GKE DIY";
                    }
                    modal.classList.add('active');
                    modal.setAttribute('aria-hidden', 'false');
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    }

    function closeModal() {
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            const cover = document.getElementById('invitation-cover');
            if (!cover || cover.classList.contains('opened')) {
                document.body.style.overflow = '';
            }
        }
    }

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.classList.contains('active')) {
            closeModal();
        }
    });
});


/* ===================================================
   5. KONTROL AUDIO & COVER PEMBUKA UNDANGAN
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const cover = document.getElementById('invitation-cover');
    const btnOpen = document.getElementById('btn-open-invitation');

    if (!bgMusic) return;

    bgMusic.volume = 0.7;

    function updateUI(isPlaying) {
        if (!musicToggle) return;
        if (isPlaying) {
            musicToggle.classList.remove('paused');
            musicToggle.classList.add('playing');
            musicToggle.setAttribute('aria-label', 'Matikan Musik Latar');
            musicToggle.setAttribute('title', 'Matikan Musik');
        } else {
            musicToggle.classList.remove('playing');
            musicToggle.classList.add('paused');
            musicToggle.setAttribute('aria-label', 'Nyalakan Musik Latar');
            musicToggle.setAttribute('title', 'Nyalakan Musik');
        }
    }

    function playAudio() {
        const playPromise = bgMusic.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    updateUI(true);
                })
                .catch(() => {
                    updateUI(false);
                });
        }
    }

    function pauseAudio() {
        bgMusic.pause();
        updateUI(false);
    }

    let isOpened = false;
    function openInvitation() {
        if (isOpened) return;
        isOpened = true;

        playAudio();

        if (cover) {
            cover.classList.add('opened');
        }
        document.body.classList.remove('locked-scroll');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (btnOpen) {
        btnOpen.addEventListener('click', (e) => {
            e.stopPropagation();
            openInvitation();
        });
    }

    if (cover) {
        cover.addEventListener('click', () => {
            openInvitation();
        });
    }

    if (musicToggle) {
        musicToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (bgMusic.paused) {
                playAudio();
            } else {
                pauseAudio();
            }
        });
    }
});
