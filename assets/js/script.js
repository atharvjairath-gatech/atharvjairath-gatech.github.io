// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70, // Account for fixed navbar
                behavior: 'smooth'
            });
        }
    });
});

// Highlight active section in navbar
window.addEventListener('scroll', function() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('#navbar a');

    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;

        if (pageYOffset >= (sectionTop - 100) && pageYOffset < (sectionTop + sectionHeight - 100)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Dark mode toggle functionality
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// Check for saved theme preference or respect OS preference
const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark' || (!currentTheme && prefersDarkScheme.matches)) {
    body.classList.add('dark-mode');
}

// Toggle dark mode
themeToggle.addEventListener('click', function(e) {
    e.preventDefault();
    body.classList.toggle('dark-mode');

    // Save the current theme to localStorage
    if (body.classList.contains('dark-mode')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});

// Music player functionality
document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('bg-audio');
    const toggleBtn = document.getElementById('toggle-music');
    let isPlaying = false;

    // Try to autoplay music on page load
    const musicEnabled = localStorage.getItem('musicEnabled');
    if (musicEnabled === null || musicEnabled === 'true') {
        // Attempt to play music immediately
        setTimeout(() => {
            toggleMusic(true);
        }, 1000); // Small delay to ensure DOM is ready
    }

    toggleBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // Prevent any default behavior
        toggleMusic(!isPlaying);
    });

    function toggleMusic(shouldPlay) {
        if (shouldPlay) {
            audio.play()
                .then(() => {
                    isPlaying = true;
                    document.body.classList.add('music-playing');
                    localStorage.setItem('musicEnabled', 'true');
                })
                .catch(e => {
                    console.log("Audio play prevented by browser policy:", e);
                    // If autoplay fails, wait for user interaction
                    if (!isPlaying) {
                        document.body.addEventListener('click', function enableMusicOnInteraction() {
                            audio.play()
                                .then(() => {
                                    isPlaying = true;
                                    document.body.classList.add('music-playing');
                                    localStorage.setItem('musicEnabled', 'true');
                                })
                                .catch(err => console.log("Still blocked:", err));
                            document.body.removeEventListener('click', enableMusicOnInteraction);
                        }, { once: true });
                    }
                    isPlaying = false;
                    document.body.classList.remove('music-playing');
                    localStorage.setItem('musicEnabled', 'false');
                });
        } else {
            audio.pause();
            isPlaying = false;
            document.body.classList.remove('music-playing');
            localStorage.setItem('musicEnabled', 'false');
        }
    }

    // Set initial volume to a comfortable level
    audio.volume = 0.3;
});