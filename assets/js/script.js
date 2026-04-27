// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach(anchor => {
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

// Supabase guestbook and visit counter
document.addEventListener('DOMContentLoaded', function() {
    const config = window.SUPABASE_CONFIG;
    const hasSupabase = window.supabase && config && !config.anonKey.includes('PASTE_');
    const form = document.getElementById('guestbook-form');
    const nameInput = document.getElementById('guestbook-name');
    const messageInput = document.getElementById('guestbook-message');
    const status = document.getElementById('guestbook-status');
    const list = document.getElementById('guestbook-list');
    const visitorCount = document.getElementById('visitor-count');

    if (!form || !list) {
        return;
    }

    if (!hasSupabase) {
        status.textContent = 'Add your Supabase anon key in assets/js/supabase-config.js to enable the guestbook.';
        list.innerHTML = '<div class="guestbook-empty">Notes will show up here once the guestbook is connected.</div>';
        return;
    }

    const client = window.supabase.createClient(config.url, config.anonKey);

    const escapeHtml = (value) => value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');

    const formatDate = (value) => new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(new Date(value));

    const moderationMessage = 'Keep it friendly please. I am not saving NSFW notes here.';
    const blockedWords = [
        'anal', 'arse', 'asshole', 'bastard', 'bitch', 'blowjob', 'bollock', 'boner',
        'boob', 'buttplug', 'clit', 'cock', 'cunt', 'dick', 'dildo', 'ejaculate',
        'fag', 'fuck', 'fucker', 'fucking', 'genital', 'handjob', 'hentai', 'horny',
        'incest', 'jizz', 'masturbate', 'milf', 'naked', 'nazi', 'nigger', 'nigga',
        'nipple', 'nude', 'orgasm', 'penis', 'porn', 'porno', 'pussy', 'rape',
        'rapist', 'retard', 'semen', 'sex', 'sexy', 'slut', 'sperm', 'testicle',
        'tits', 'vagina', 'viagra', 'whore', 'xxx',
        'aand', 'bawasir', 'bhenchod', 'bhadwa', 'bhosada', 'bhosadi', 'bhosadika',
        'bhosdika', 'bhosdike', 'bsdk', 'chinal', 'chod', 'choda', 'chodna',
        'chodu', 'chutiya', 'gaand', 'gand', 'gandu', 'harami', 'jhaat', 'jhant',
        'kamina', 'kutti', 'lavda', 'lavde', 'lund', 'madarchod', 'randi',
        'suar', 'tatti', 'bc', 'bkl', 'bkc', 'bklol', 'bsdk', 'mc', 'mkc',
        'अश्लील', 'चोद', 'चोदा', 'चोदना', 'चूत', 'चूतिया', 'गांड', 'गंदू',
        'झाट', 'लंड', 'मादरचोद', 'रंडी', 'हरामी'
    ];
    const blockedPhrases = [
        'mother fuck', 'only fans', 'send nudes', 'suck my', 'baap ke lavde',
        'behen chod', 'bhen chod', 'bhosdi ke', 'maa chod', 'madar chod'
    ];
    const leetMap = {
        '0': 'o',
        '1': 'i',
        '3': 'e',
        '4': 'a',
        '5': 's',
        '7': 't',
        '@': 'a',
        '$': 's',
        '!': 'i'
    };

    const normalizeForModeration = (value) => value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[013457@$!]/g, character => leetMap[character] || character)
        .replace(/(.)\1{2,}/g, '$1$1')
        .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
        .trim();

    const hasUnsafeContent = (value) => {
        const normalized = normalizeForModeration(value);
        const compact = normalized.replace(/\s+/g, '');
        const tokens = normalized.split(/\s+/).filter(Boolean);

        return blockedPhrases.some(phrase => {
            const normalizedPhrase = normalizeForModeration(phrase);
            return normalized.includes(normalizedPhrase) || compact.includes(normalizedPhrase.replace(/\s+/g, ''));
        }) || blockedWords.some(word => {
            const normalizedWord = normalizeForModeration(word);
            if (tokens.includes(normalizedWord)) {
                return true;
            }

            return normalizedWord.length >= 4 && compact.includes(normalizedWord);
        });
    };

    function createVisitorId() {
        if (crypto.randomUUID) {
            return crypto.randomUUID();
        }

        return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, character =>
            (Number(character) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> Number(character) / 4).toString(16)
        );
    }

    async function recordPageVisit(visitorId) {
        const { error: rpcError } = await client.rpc('log_page_visit', {
            input_visitor_id: visitorId,
            input_page: 'home'
        });

        if (!rpcError) {
            return true;
        }

        console.warn('Could not log visit through RPC. Trying table insert fallback.', rpcError);

        const { error: insertError } = await client
            .from('page_visits')
            .insert({ visitor_id: visitorId, page: 'home' });

        if (insertError) {
            console.warn('Could not log visit through table fallback.', insertError);
            return false;
        }

        return true;
    }

    async function loadVisitCount() {
        const { data: rpcCount, error: rpcError } = await client.rpc('page_visit_count');

        if (!rpcError && rpcCount !== null) {
            return Number(rpcCount);
        }

        console.warn('Could not load visit count through RPC. Trying table count fallback.', rpcError);

        const { count, error: countError } = await client
            .from('page_visits')
            .select('id', { count: 'exact', head: true });

        if (countError) {
            console.warn('Could not load visit count through table fallback.', countError);
            return null;
        }

        return count;
    }

    async function loadMessages() {
        const { data, error } = await client
            .from('guestbook')
            .select('name, message, created_at')
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) {
            list.innerHTML = '<div class="guestbook-empty">Could not load notes right now. Please check back in a bit.</div>';
            return;
        }

        if (!data.length) {
            list.innerHTML = '<div class="guestbook-empty">No notes yet. Yours can be the first.</div>';
            return;
        }

        list.innerHTML = data.map((entry, index) => `
            <article class="guestbook-entry" style="--entry-index: ${index}">
                <div class="guestbook-entry-meta">
                    <strong>${escapeHtml(entry.name)}</strong>
                    <time>${formatDate(entry.created_at)}</time>
                </div>
                <p>${escapeHtml(entry.message)}</p>
            </article>
        `).join('');
    }

    async function logVisit() {
        try {
            let visitorId = localStorage.getItem('visitorId');
            if (!visitorId) {
                visitorId = createVisitorId();
                localStorage.setItem('visitorId', visitorId);
            }

            const visitKey = `visitLogged:${new Date().toISOString().slice(0, 10)}`;
            if (!localStorage.getItem(visitKey)) {
                const didLogVisit = await recordPageVisit(visitorId);
                if (didLogVisit) {
                    localStorage.setItem(visitKey, 'true');
                }
            }

            const count = await loadVisitCount();
            if (count !== null) {
                visitorCount.textContent = count.toLocaleString();
            } else {
                visitorCount.textContent = '--';
            }
        } catch (error) {
            console.warn('Could not update visit counter.', error);
            visitorCount.textContent = '--';
        }
    }

    form.addEventListener('submit', async function(event) {
        event.preventDefault();

        const name = nameInput.value.trim();
        const message = messageInput.value.trim();

        if (!name || !message) {
            status.textContent = 'Add your name and a quick note.';
            return;
        }

        if (hasUnsafeContent(`${name} ${message}`)) {
            status.textContent = moderationMessage;
            return;
        }

        status.textContent = 'Adding your note...';
        form.querySelector('button').disabled = true;

        const { error } = await client.from('guestbook').insert({ name, message });

        form.querySelector('button').disabled = false;

        if (error) {
            status.textContent = 'Could not save that note. Mind trying again?';
            return;
        }

        form.reset();
        status.textContent = 'Thanks for leaving a note.';
        await loadMessages();
    });

    loadMessages();
    logVisit();
});
