document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const cursor = document.querySelector('.cursor');

    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // Hover effect for cursor
    const hoverables = document.querySelectorAll('a, button, .bento-item');
    hoverables.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
    });

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Animate Bento Items
    document.querySelectorAll('.bento-item').forEach((item, index) => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = `all 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) ${index * 0.1}s`; // Staggered delay
        observer.observe(item);
    });

    // Translation Logic
    const translations = {
        en: {
            nav_experience: "Experience",
            nav_selection: "Selection",
            nav_reserve: "Book Now",
            hero_title: "Taste the<br>Future",
            hero_subtitle: "Molecular Mixology & Digital Atmosphere",
            hero_cta: "Enter the Grid",
            drink_cyber_punk: "Cyber Punk",
            drink_neon_flux: "Neon Flux",
            drink_quantum_sol: "Quantum Sol",
            food_zero_g: "Zero-G Bites",
            drink_plasma_fizz: "Plasma Fizz",
            menu_pdf: "View Full Menu PDF",
            location_title: "Where We Are",
            reserve_title: "Secure Your Spot",
            reserve_subtitle: "Reservations are required for the full sensory experience.",
            reserve_btn: "Confirm Reservation",
            footer_address: "Via del Futuro 2077, Milano"
        },
        it: {
            nav_experience: "Esperienza",
            nav_selection: "Selezione",
            nav_reserve: "Prenota",
            hero_title: "Assaggia il<br>Futuro",
            hero_subtitle: "Mixologia Molecolare & Atmosfera Digitale",
            hero_cta: "Entra nella Griglia",
            drink_cyber_punk: "Cyber Punk",
            drink_neon_flux: "Neon Flux",
            drink_quantum_sol: "Quantum Sol",
            food_zero_g: "Bocconcini Zero-G",
            drink_plasma_fizz: "Plasma Fizz",
            menu_pdf: "Vedi Menu Completo PDF",
            location_title: "Dove Siamo",
            reserve_title: "Assicura il tuo Posto",
            reserve_subtitle: "La prenotazione è richiesta per l'esperienza sensoriale completa.",
            reserve_btn: "Conferma Prenotazione",
            footer_address: "Via del Futuro 2077, Milano"
        }
    };

    const langToggle = document.getElementById('lang-toggle');
    let currentLang = 'en'; // Default to English as per current content (mostly)

    langToggle.addEventListener('click', () => {
        // Toggle language
        currentLang = currentLang === 'en' ? 'it' : 'en';
        
        // Update button text
        langToggle.textContent = currentLang === 'en' ? 'IT' : 'EN'; // Show what you can switch TO, or current? Usually current. Let's show current.
        // Actually, usually buttons show the language you are switching TO, or the current language code. 
        // If I click EN, it switches to EN. If I click IT, it switches to IT.
        // But this is a toggle.
        // If current is EN, button should probably say "IT" (switch to Italian).
        // If current is IT, button should say "EN" (switch to English).
        langToggle.textContent = currentLang === 'en' ? 'IT' : 'EN';

        // Update text content
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[currentLang][key]) {
                if (key === 'hero_title') {
                     el.innerHTML = translations[currentLang][key]; // Handle HTML for <br>
                } else {
                    el.textContent = translations[currentLang][key];
                }
            }
        });
    });
});
