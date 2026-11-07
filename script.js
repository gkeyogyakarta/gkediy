// 1. Inisialisasi & Setup Salju Alami (JS Canvas)
const canvas = document.getElementById('snow-canvas');
const ctx = canvas.getContext('2d');

let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
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
    const hiddenNameInput = document.getElementById('nama-hidden');

    if (guestName) {
        guestNameElement.textContent = guestName;
        hiddenNameInput.value = guestName;
    } else {
        guestNameElement.textContent = "Tamu Undangan";
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
