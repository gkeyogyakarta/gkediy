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


// 2. Dynamic Guest Name
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guestName = urlParams.get('to');
    
    const guestNameElement = document.getElementById('guest-name');
    const coverGuestNameElement = document.getElementById('cover-guest-name');
    const hiddenNameInput = document.getElementById('nama-hidden');

    if (guestName) {
        guestNameElement.textContent = guestName;
        if (coverGuestNameElement) coverGuestNameElement.textContent = guestName;
        hiddenNameInput.value = guestName;
    } else {
        guestNameElement.textContent = "Tamu Undangan";
        if (coverGuestNameElement) coverGuestNameElement.textContent = "Tamu Undangan";
        hiddenNameInput.value = "Tamu Undangan (Tanpa Parameter)";
    }
    
    // Smooth Fade-in effect saat halaman terbuka
    document.querySelectorAll('section').forEach((sec, idx) => {
        sec.style.opacity = '0';
        sec.style.transform = 'translateY(20px)';
        sec.style.transition = `opacity 0.8s ease ${idx * 0.15}s, transform 0.8s ease ${idx * 0.15}s`;
        
        setTimeout(() => {
            sec.style.opacity = '1';
            sec.style.transform = 'translateY(0)';
        }, 100);
    });
});

// 3. Integrasi form RSVP ke Google Sheet (Sama dengan sebelumnya, masukkan URL Apps Script Anda)
const URL_APPS_SCRIPT = 'URL_WEB_APP_GOOGLE_SCRIPT_ANDA_DI_SINI'; 
// (Tetap gunakan alur script.js sebelumnya untuk memproses Form & Push API)


/* =========================================
   GALERI FOTO BERGERAK OTOMATIS
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const galleryTrack = document.querySelector(".gallery-track");

    if (galleryTrack) {

        // Menggandakan seluruh foto
        const galleryImages = Array.from(galleryTrack.children);

        galleryImages.forEach((image) => {

            const clone = image.cloneNode(true);

            // Foto duplikat hanya untuk animasi
            clone.setAttribute("aria-hidden", "true");

            galleryTrack.appendChild(clone);

        });

    }

});

/* =========================================
   4. KONTROL AUDIO & COVER BUKA UNDANGAN
========================================= */
document.addEventListener("DOMContentLoaded", () => {
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');
    const cover = document.getElementById('invitation-cover');
    const btnOpen = document.getElementById('btn-open-invitation');

    if (!bgMusic) return;

    // Volume backsound diatur nyaman dan lembut (70%)
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

