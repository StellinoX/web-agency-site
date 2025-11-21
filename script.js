import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const CONFIG = {
        scrambleSpeed: 50,
        tiltMax: 15,
        tiltSpeed: 400,
        magneticStrength: 0.5,
        magneticRange: 100,
    };

    // --- AUDIO SYSTEM (Web Audio API) ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const gainNode = audioCtx.createGain();
    gainNode.connect(audioCtx.destination);
    gainNode.gain.value = 0.1; // Low volume

    const playSound = (type) => {
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const env = audioCtx.createGain();

        osc.connect(env);
        env.connect(gainNode);

        if (type === 'hover') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
            env.gain.setValueAtTime(0, audioCtx.currentTime);
            env.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
            env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'click') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(200, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
            env.gain.setValueAtTime(0.5, audioCtx.currentTime);
            env.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    };

    // --- PRELOADER ---
    const preloader = document.getElementById('preloader');
    const progressBar = document.querySelector('.loader-progress');
    const loaderText = document.querySelector('.loader-text');

    let progress = 0;
    const loadInterval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;
        progressBar.style.width = `${progress}%`;

        if (progress === 100) {
            clearInterval(loadInterval);
            loaderText.innerText = "SYSTEM READY";
            setTimeout(() => {
                preloader.style.opacity = '0';
                preloader.style.visibility = 'hidden';
                initEntranceAnimations();
            }, 500);
        }
    }, 80); // Faster load

    function initEntranceAnimations() {
        document.querySelectorAll('.hero-title, .hero-subtitle, .hero-cta').forEach(el => {
            el.style.animationPlayState = 'running';
        });
    }

    // --- THREE.JS SCENE WITH BLOOM & SHADERS ---
    const initThreeJS = () => {
        const canvas = document.getElementById('bg-canvas');
        if (!canvas) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });

        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.toneMapping = THREE.ReinhardToneMapping;

        // POST PROCESSING - BLOOM
        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
        bloomPass.threshold = 0;
        bloomPass.strength = 2.5; // High bloom
        bloomPass.radius = 0.5;

        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        // SHADER MATERIAL (Liquid Metal)
        const vertexShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float time;
            
            void main() {
                vUv = uv;
                vPosition = position;
                
                // Deform position based on time and noise-like sin waves
                vec3 newPos = position;
                newPos.x += sin(position.y * 4.0 + time) * 0.5;
                newPos.y += cos(position.x * 4.0 + time) * 0.5;
                newPos.z += sin(position.z * 4.0 + time) * 0.5;
                
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;
            varying vec3 vPosition;
            uniform float time;
            
            void main() {
                // Create a pulsing neon color pattern
                vec3 color1 = vec3(0.42, 0.16, 0.85); // Purple
                vec3 color2 = vec3(0.23, 0.51, 0.96); // Blue
                
                float noise = sin(vPosition.x * 10.0 + time) * sin(vPosition.y * 10.0 + time);
                vec3 finalColor = mix(color1, color2, noise * 0.5 + 0.5);
                
                // Add "hot" spots
                float glow = smoothstep(0.4, 0.6, noise);
                finalColor += vec3(glow * 0.5);

                gl_FragColor = vec4(finalColor, 0.6); // Semi-transparent
            }
        `;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            wireframe: true,
            transparent: true,
            side: THREE.DoubleSide
        });

        const geometry = new THREE.IcosahedronGeometry(8, 4);
        const sphere = new THREE.Mesh(geometry, material);
        scene.add(sphere);

        // Particles
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const posArray = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 60;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x3b82f6,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        camera.position.z = 20;

        // Interaction
        let mouseX = 0;
        let mouseY = 0;
        const windowHalfX = window.innerWidth / 2;
        const windowHalfY = window.innerHeight / 2;

        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX - windowHalfX);
            mouseY = (event.clientY - windowHalfY);
        });

        const clock = new THREE.Clock();

        const animate = () => {
            const elapsedTime = clock.getElapsedTime();

            // Update Shader Uniforms
            material.uniforms.time.value = elapsedTime;

            // Rotate sphere based on mouse
            sphere.rotation.y += 0.05 * (mouseX * 0.001 - sphere.rotation.y);
            sphere.rotation.x += 0.05 * (mouseY * 0.001 - sphere.rotation.x);

            // Rotate particles
            particlesMesh.rotation.y = -mouseX * 0.0002;
            particlesMesh.rotation.x = -mouseY * 0.0002;

            composer.render();
            requestAnimationFrame(animate);
        };

        animate();

        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        });
    };

    initThreeJS();


    // --- CUSTOM CURSOR & MAGNETIC BUTTONS ---
    const cursorDot = document.querySelector('[data-cursor-dot]');
    const cursorOutline = document.querySelector('[data-cursor-outline]');
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (!isTouchDevice) {
        window.addEventListener('mousemove', (e) => {
            const posX = e.clientX;
            const posY = e.clientY;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: "forwards" });
        });

        const magneticBtns = document.querySelectorAll('.btn-primary, .btn-glow, .btn-outline, .nav-link');

        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;

                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
                cursorOutline.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';

                // Play sound only if not already playing (debounce slightly)
                if (!btn.dataset.soundPlayed) {
                    playSound('hover');
                    btn.dataset.soundPlayed = "true";
                    setTimeout(() => btn.dataset.soundPlayed = "", 200);
                }
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0px, 0px)';
                cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
                cursorOutline.style.backgroundColor = 'transparent';
            });

            btn.addEventListener('click', () => {
                playSound('click');
            });
        });
    } else {
        cursorDot.style.display = 'none';
        cursorOutline.style.display = 'none';
    }

    // --- TEXT SCRAMBLE ---
    class TextScramble {
        constructor(el) {
            this.el = el;
            this.chars = '!<>-_\\/[]{}—=+*^?#________';
            this.update = this.update.bind(this);
        }
        setText(newText) {
            const oldText = this.el.innerText;
            const length = Math.max(oldText.length, newText.length);
            const promise = new Promise((resolve) => this.resolve = resolve);
            this.queue = [];
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 40);
                const end = start + Math.floor(Math.random() * 40);
                this.queue.push({ from, to, start, end });
            }
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
            return promise;
        }
        update() {
            let output = '';
            let complete = 0;
            for (let i = 0, n = this.queue.length; i < n; i++) {
                let { from, to, start, end, char } = this.queue[i];
                if (this.frame >= end) {
                    complete++;
                    output += to;
                } else if (this.frame >= start) {
                    if (!char || Math.random() < 0.28) {
                        char = this.randomChar();
                        this.queue[i].char = char;
                    }
                    output += `<span class="dud">${char}</span>`;
                } else {
                    output += from;
                }
            }
            this.el.innerHTML = output;
            if (complete === this.queue.length) {
                this.resolve();
            } else {
                this.frameRequest = requestAnimationFrame(this.update);
                this.frame++;
            }
        }
        randomChar() {
            return this.chars[Math.floor(Math.random() * this.chars.length)];
        }
    }

    const scrambleObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('scrambled')) {
                const el = entry.target;
                const text = el.innerText;
                el.setAttribute('data-text', text);
                el.classList.add('glitch-hover');

                const scrambler = new TextScramble(el);
                scrambler.setText(text);
                el.classList.add('scrambled');
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.hero-title, .section-title').forEach(el => {
        scrambleObserver.observe(el);
    });

    // --- 3D TILT ---
    const tiltElements = document.querySelectorAll('.service-card, .portfolio-item, .contact-wrapper');
    tiltElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -CONFIG.tiltMax;
            const rotateY = ((x - centerX) / centerX) * CONFIG.tiltMax;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    });

    // --- SCROLL REVEAL ---
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.service-card, .portfolio-item, .contact-wrapper').forEach(el => {
        el.classList.add('animate-on-scroll');
        revealObserver.observe(el);
    });

    // --- MOBILE MENU ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navList = document.querySelector('.nav-list');
    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('active');
            navList.classList.toggle('active');
        });
    }
});
