// 1. Inisialisasi & Setup Salju Alami (JS Canvas)
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
    if (Math.abs(window.innerWidth - lastWidth) > 30) {
        lastWidth = window.innerWidth;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }
});

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * -height;
        this.vy = Math.random() * 1.5 + 0.5; // Kecepatan jatuh
        this.vx = Math.random() * 1 - 0.5;   // Kecepatan gerak horizontal (angin sepoi)
        this.r = Math.random() * 3 + 1;      // Ukuran butiran
        this.o = Math.random() * 0.5 + 0.3;  // Opacity (transparansi)
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
const particleCount = 65; // Jumlah butiran salju agar tetap lancar di HP

for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animate);
}

animate();


/* ===================================================
   2. DYNAMIC GUEST NAME & VALIDASI RSVP PER-TAMU
=================================================== */
// URL Google Apps Script yang sudah dimasukkan
const URL_APPS_SCRIPT = 'https://script.google.com/macros/s/AKfycbxZvUcNPRroqP9zaMeP-J0fjXTnyJ_V1Nk2gs06K6tLDz2lG_v02H8UWSW8qUfELmf-/exec'; 

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const rawGuest = urlParams.get('to');
    const guestName = rawGuest ? rawGuest.trim() : "Tamu Undangan";
    const isGenericGuest = !rawGuest || guestName.toLowerCase() === "tamu undangan";

    // Elemen Nama Tamu
    const guestNameElement = document.getElementById('guest-name');
    const coverGuestNameElement = document.getElementById('cover-guest-name');
    const hiddenNameInput = document.getElementById('nama-hidden');

    if (guestNameElement) guestNameElement.textContent = guestName;
    if (coverGuestNameElement) coverGuestNameElement.textContent = guestName;
    if (hiddenNameInput) hiddenNameInput.value = guestName;

    // Smooth Fade-in effect saat halaman terbuka (Perbaikan Typo idx)
    document.querySelectorAll('section').forEach((sec, idx) => {
        sec.style.opacity = '0';
        sec.style.transform = 'translateY(20px)';
        sec.style.transition = `opacity 0.8s ease ${idx * 0.12}s, transform 0.8s ease ${idx * 0.12}s`;
        
        setTimeout(() => {
            sec.style.opacity = '1';
            sec.style.transform = 'translateY(0)';
        }, 100);
    });

    // ----------------------------------------------------
    // VALIDASI FORM KONFIRMASI KEHADIRAN (1x ISI / PERBARUI)
    // Berdasarkan identitas masing-masing link tamu
    // ----------------------------------------------------
    const rsvpForm = document.getElementById('rsvp-form');
    const kehadiranSelect = document.getElementById('kehadiran');
    const jumlahInput = document.getElementById('jumlah');
    const groupJumlah = document.getElementById('group-jumlah');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = document.getElementById('btn-text');
    const formStatus = document.getElementById('form-status');
    const statusBadge = document.getElementById('rsvp-status-badge');
    const badgeTitle = document.getElementById('badge-title');
    const badgeDesc = document.getElementById('badge-desc');

    if (!rsvpForm) return;

    // Kunci unik penyimpanan per tamu (misal: 'gke_rsvp_bapak_budi')
    const sanitizedKey = isGenericGuest 
        ? 'gke_rsvp_general_guest' 
        : 'gke_rsvp_' + encodeURIComponent(guestName.toLowerCase().replace(/\s+/g, '_'));

    // Toggle tampilan jumlah tamu jika "Tidak Hadir" (Perbaikan Bug max/min validation HTML)
    function handleKehadiranChange() {
        if (kehadiranSelect.value === 'Tidak Hadir') {
            if (groupJumlah) groupJumlah.style.display = 'none';
            if (jumlahInput) {
                jumlahInput.value = '0';
                jumlahInput.required = false;
                jumlahInput.removeAttribute('min'); // Hapus aturan min=1 agar form bisa lolos validasi saat Tidak Hadir
            }
        } else {
            if (groupJumlah) groupJumlah.style.display = 'flex';
            if (jumlahInput) {
                if (jumlahInput.value === '0' || !jumlahInput.value) {
                    jumlahInput.value = '1';
                }
                jumlahInput.required = true;
                jumlahInput.setAttribute('min', '1'); // Kembalikan aturan min=1 saat Hadir
            }
        }
    }

    kehadiranSelect.addEventListener('change', handleKehadiranChange);

    // Cek apakah tamu ini sudah pernah mengisi konfirmasi sebelumnya
    const existingData = localStorage.getItem(sanitizedKey);
    if (existingData) {
        try {
            const parsed = JSON.parse(existingData);
            // Isi otomatis form dengan data yang sudah disimpan
            if (parsed.kehadiran) {
                kehadiranSelect.value = parsed.kehadiran;
                handleKehadiranChange();
            }
            if (parsed.jumlah !== undefined && parsed.kehadiran === 'Hadir') {
                jumlahInput.value = parsed.jumlah;
            }

            // Tampilkan kotak status konfirmasi
            if (statusBadge) {
                statusBadge.style.display = 'flex';
                if (badgeTitle) {
                    badgeTitle.textContent = `Konfirmasi Tersimpan: ${parsed.kehadiran}`;
                }
                if (badgeDesc) {
                    const detail = parsed.kehadiran === 'Hadir' 
                        ? `Kehadiran (${parsed.jumlah} orang) telah tercatat untuk ${guestName}.` 
                        : `Pernyataan tidak hadir telah tercatat untuk ${guestName}.`;
                    badgeDesc.textContent = `${detail} Anda dapat mengubah data di bawah ini jika terdapat perubahan rencana.`;
                }
            }

            // Ubah teks tombol menjadi "Perbarui Konfirmasi"
            if (btnText) {
                btnText.textContent = "Perbarui Konfirmasi Kehadiran";
            }
        } catch (e) {
            console.error("Gagal mem-parsing data konfirmasi lokal:", e);
        }
    }

    // Submit handler (Update real-time ke API & UI)
    rsvpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const kehadiran = kehadiranSelect.value;
        const jumlah = kehadiran === 'Tidak Hadir' ? 0 : (parseInt(jumlahInput.value, 10) || 1);

        if (!kehadiran) {
            formStatus.textContent = "Silakan pilih status kehadiran.";
            formStatus.className = "status-msg";
            return;
        }

        // Tampilkan indikator proses
        submitBtn.disabled = true;
        if (btnText) btnText.textContent = "Menyimpan...";
        formStatus.textContent = "Sedang memproses konfirmasi kehadiran Anda...";
        formStatus.className = "status-msg loading";

        const payload = {
            nama: guestName,
            kehadiran: kehadiran,
            jumlah: jumlah,
            timestamp: new Date().toISOString()
        };

        // 1. Simpan ke LocalStorage khusus tamu ini
        localStorage.setItem(sanitizedKey, JSON.stringify(payload));

        // 2. Kirim ke Google Apps Script Spreadsheet
        try {
            if (URL_APPS_SCRIPT && !URL_APPS_SCRIPT.includes('URL_WEB_APP_GOOGLE_SCRIPT_ANDA_DI_SINI')) {
                const formData = new FormData();
                formData.append('nama', guestName);
                formData.append('kehadiran', kehadiran);
                formData.append('jumlah', jumlah);
                formData.append('timestamp', payload.timestamp);

                await fetch(URL_APPS_SCRIPT, {
                    method: 'POST',
                    body: formData,
                    mode: 'no-cors'
                });
            }
        } catch (err) {
            console.warn("Gagal sinkronisasi Google Sheet, data tetap aman di perangkat:", err);
        }

        // 3. Perbarui tampilan UI
        setTimeout(() => {
            submitBtn.disabled = false;
            if (btnText) btnText.textContent = "Perbarui Konfirmasi Kehadiran";

            if (statusBadge) {
                statusBadge.style.display = 'flex';
                if (badgeTitle) {
                    badgeTitle.textContent = `Konfirmasi Berhasil Diperbarui: ${kehadiran}`;
                }
                if (badgeDesc) {
                    const msg = kehadiran === 'Hadir' 
                        ? `Terima kasih! Kehadiran ${jumlah} orang telah dikonfirmasi untuk ${guestName}.` 
                        : `Terima kasih atas konfirmasinya, ${guestName}. Doa kami menyertai.`;
                    badgeDesc.textContent = `${msg} Anda tetap dapat memperbarui pilihan ini sewaktu-waktu.`;
                }
            }

            formStatus.textContent = "✅ Konfirmasi kehadiran berhasil diperbarui!";
            formStatus.className = "status-msg success";
        }, 600);
    });
});


/* ===================================================
   3. GALERI SLIDER & LIGHTBOX (FOTO JELAS & UTUH)
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const galleryTrack = document.querySelector(".gallery-track");
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    const modalCaption = document.getElementById('modal-caption');
    const modalClose = document.getElementById('modal-close');
    const modalOverlay = document.getElementById('modal-overlay');

    if (galleryTrack) {
        // Gandakan foto agar efek infinite marquee berjalan tanpa jeda
        const galleryImages = Array.from(galleryTrack.children);
        galleryImages.forEach((image) => {
            const clone = image.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            galleryTrack.appendChild(clone);
        });

        // Event delegation: Klik foto mana pun untuk memperbesar di Lightbox
        galleryTrack.addEventListener('click', (e) => {
            if (e.target.tagName === 'IMG') {
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
            // Hanya kembalikan scroll jika cover sudah dibuka
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
   4. KONTROL AUDIO & COVER BUKA UNDANGAN
=================================================== */
document.addEventListener("DOMContentLoaded", () => {
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const cover = document.getElementById('invitation-cover');
    const btnOpen = document.getElementById('btn-open-invitation');

    if (!bgMusic) return;

    // Volume backsound lembut dan nyaman (70%)
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
                .catch((error) => {
                    updateUI(false);
                    console.info("Autoplay dicegah browser, menunggu interaksi Buka Undangan:", error.message);
                });
        }
    }

    function pauseAudio() {
        bgMusic.pause();
        updateUI(false);
    }

    // Fungsi membuka undangan dan memutar musik seketika
    let isOpened = false;
    function openInvitation() {
        if (isOpened) return;
        isOpened = true;

        // Putar audio seketika menggunakan event interaksi pengguna ini
        playAudio();

        // Buka cover dengan animasi geser ke atas
        if (cover) {
            cover.classList.add('opened');
        }
        document.body.classList.remove('locked-scroll');

        // Scroll mulus ke bagian atas halaman utama
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Event klik tombol "Buka Undangan"
    if (btnOpen) {
        btnOpen.addEventListener('click', (e) => {
            e.stopPropagation();
            openInvitation();
        });
    }

    // Fallback: Jika pengguna mengetuk area cover di luar tombol
    if (cover) {
        cover.addEventListener('click', () => {
            openInvitation();
        });
    }

    // Coba putar otomatis langsung jika browser mengizinkan
    playAudio();

    // Fallback interaksi pertama jika cover tidak terbuka (misal cover dinonaktifkan)
    const unlockAudio = () => {
        if (bgMusic.paused) {
            playAudio();
        }
        ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
            window.removeEventListener(evt, unlockAudio);
        });
    };

    ['click', 'touchstart', 'touchend', 'keydown'].forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { passive: true });
    });

    // Tombol manual Play / Pause di pojok layar
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