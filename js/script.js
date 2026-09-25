// IMPORTANT: Update JS version number in dairy.html every time you make changes to this file

document.addEventListener("DOMContentLoaded", () => {

    // =================================================
    // DOM
    // =================================================
    const DOM = {
        musicContainer: document.getElementById("musicContainer"),
        artContainer: document.getElementById("artContainer"),

        player: document.getElementById("player"),
        nowPlayingText: document.getElementById("nowPlayingText"),
        progressBar: document.querySelector(".progress-bar"),
        volumeSlider: document.getElementById("volumeSlider"),
        currentTime: document.getElementById("currentTime"),
        duration: document.getElementById("duration"),

        logContainer: document.getElementById("logContainer"),

        overlay: document.getElementById("transitionOverlay"),

        imageViewer: document.getElementById("imageViewer"),
        viewerImage: document.getElementById("viewerImage"),

        terminalContainer: document.getElementById("terminalOutput")
    };

    // =================================================
    // STATE
    // =================================================
    const STATE = {
        currentTrack: null,
        logQueue: [],
        isTyping: false,
        isPlaying: false,
        systemMemory: {
            playCounts: {},
            totalPlays: 0
        }
    };

    // =================================================
    // LOG SYSTEM
    // =================================================
    const LogSystem = {

        add(message, type = "event") {
            STATE.logQueue.push({ message, type });
            if (!STATE.isTyping) this.process();
        },

        process() {

            if (!DOM.logContainer) return;

            if (STATE.logQueue.length === 0) {
                STATE.isTyping = false;
                return;
            }

            STATE.isTyping = true;

            const { message, type } = STATE.logQueue.shift();

            const entry = document.createElement("div");
            entry.className = `log-entry ${type}`;

            const time = new Date().toLocaleTimeString();
            entry.textContent = `[${time}] `;

            DOM.logContainer.appendChild(entry);

            this.type(entry, message, () => this.process());
        },

        type(element, text, done, speed = 20) {

            let i = 0;

            const interval = setInterval(() => {

                element.textContent += text[i];
                i++;

                if (i >= text.length) {
                    clearInterval(interval);
                    done?.();
                }

            }, speed);
        }
    };

    // =================================================
    // SENTIENT ANALYSIS MODULE
    // =================================================
    const Brain = {

        analyze(trackName) {

            const plays = STATE.systemMemory.playCounts[trackName];

            if (plays === 1)
                LogSystem.add("new signal registered in archive", "event");

            if (plays === 3)
                LogSystem.add(`pattern forming: ${trackName}`, "warn");

            if (plays === 5)
                LogSystem.add("high-frequency signal detected", "warn");

            if (STATE.systemMemory.totalPlays === 10)
                LogSystem.add("system observing user behavior...", "warn");

            if (STATE.systemMemory.totalPlays === 20)
                LogSystem.add("archive self-adjusting to usage patterns", "warn");
        }
    };

    // =================================================
    // MUSIC MODULE
    // =================================================
const MusicModule = {

    formatTime(seconds) {

        if (isNaN(seconds)) return "0:00";

        const mins = Math.floor(seconds / 60);

        const secs = Math.floor(seconds % 60)
            .toString()
            .padStart(2, "0");

        return `${mins}:${secs}`;
    },

    init() {
        if (!DOM.musicContainer || !DOM.player) return;

        fetch("assets/json/lainavian/music.json")
            .then(r => r.json())
            .then(data => this.build(data))
            .catch(() => LogSystem.add("music load failed", "warn"));
    },

    build(data) {

        data.forEach(album => {

            const albumDiv = document.createElement("div");
            albumDiv.className = "album";

            const title = document.createElement("h3");
            title.className = "album-title";
            title.textContent = album.album;

            title.addEventListener("click", () => {
                albumDiv.classList.toggle("collapsed");
            });

            const trackContainer = document.createElement("div");
            trackContainer.className = "track-container";

            album.tracks.forEach(track => {

                track.albumName = album.album;

                const trackDiv = document.createElement("div");
                trackDiv.className = "track";
                trackDiv.setAttribute("data-audio", track.file);

                trackDiv.innerHTML = `
                    <img class="cover" src="${track.cover}">
                    <div class="info">
                        <span class="track-name">${track.title}</span>
                        <span class="track-meta">${track.meta}</span>
                    </div>
                    <button class="play">▶</button>
                `;

                const button = trackDiv.querySelector(".play");

                button.addEventListener("click", () => {
                    this.playTrack(trackDiv, track, button);
                });

                trackContainer.appendChild(trackDiv);
            });

            albumDiv.appendChild(title);
            albumDiv.appendChild(trackContainer);

            DOM.musicContainer.appendChild(albumDiv);
        });

        this.bindPlayer();
    },

    playTrack(trackDiv, track, button) {

        const album = track.albumName || "unknown";
        const src = track.file;
        const name = track.title;

        STATE.systemMemory.totalPlays++;

        STATE.systemMemory.playCounts[name] =
            (STATE.systemMemory.playCounts[name] || 0) + 1;

        Brain.analyze(name);

        if (STATE.currentTrack === trackDiv) {

            if (DOM.player.paused) {
                DOM.player.play();
                button.textContent = "⏸";
            } else {
                DOM.player.pause();
                button.textContent = "▶";
            }

            return;
        }

        document.querySelectorAll(".play").forEach(b => b.textContent = "▶");

        DOM.player.src = src;
        DOM.player.load();
        DOM.player.play();

        button.textContent = "⏸";
        STATE.currentTrack = trackDiv;

        // =========================
        // NOW PLAYING TEXT
        // =========================
        if (DOM.nowPlayingText) {
            DOM.nowPlayingText.textContent = name;
        }

        // =========================
        // NOW PLAYING ALBUM
        // =========================
        const albumEl = document.getElementById("nowAlbum");

        if (albumEl) {
            albumEl.textContent = album;
        }

        // =========================
        // NOW PLAYING COVER
        // =========================
        const coverEl = document.getElementById("nowCover");

        if (coverEl) {
            coverEl.src = track.cover;
        }

        LogSystem.add(`track loaded: ${name}`, "event");
    },

    bindPlayer() {

        DOM.player.addEventListener("loadedmetadata", () => {

            if (DOM.duration) {

                DOM.duration.textContent =
                    this.formatTime(DOM.player.duration);
            }
        });

        if (!DOM.player) return;

        DOM.player.addEventListener("timeupdate", () => {

            if (DOM.currentTime) {

                DOM.currentTime.textContent =
                    this.formatTime(DOM.player.currentTime);
            }

            if (DOM.duration) {

                DOM.duration.textContent =
                    this.formatTime(DOM.player.duration);
            }

            if (!DOM.player.duration || !DOM.progressBar) return;

            const percent =
                (DOM.player.currentTime / DOM.player.duration) * 100;

            DOM.progressBar.style.width = percent + "%";
        });

        const container = DOM.progressBar?.parentElement;

        if (container) {

            container.addEventListener("click", (e) => {

                const rect = container.getBoundingClientRect();
                const clickX = e.clientX - rect.left;

                const percent = clickX / rect.width;

                DOM.player.currentTime = percent * DOM.player.duration;
            });
        }

        if (DOM.volumeSlider) {

            DOM.volumeSlider.addEventListener("input", () => {

                DOM.player.volume = DOM.volumeSlider.value;
            });
        }

        DOM.player.addEventListener("play", () => {

            const name =
                STATE.currentTrack?.querySelector(".track-name")?.textContent
                || "unknown";

            // new play
            if (!STATE.isPlaying) {
                LogSystem.add(`audio started: ${name}`, "event");
                STATE.isPlaying = true;
                return;
            }

            // resumed
            LogSystem.add(`audio resumed: ${name}`, "event");
        });

        DOM.player.addEventListener("pause", () => {

            const name =
                STATE.currentTrack?.querySelector(".track-name")?.textContent
                || "unknown";

            LogSystem.add(`audio paused: ${name}`, "warn");

            STATE.isPlaying = false;
        });
    }
};

    // =================================================
    // ART MODULE
    // =================================================
    const ArtModule = {

        _initialized: false,

        init() {

            if (this._initialized) return;
            this._initialized = true;

            if (!DOM.artContainer) return;

            fetch("assets/json/lainavian/art.json")
                .then(r => r.json())
                .then(data => this.build(data))
                .catch(() => LogSystem.add("art load failed", "warn"));
        },

        build(data) {

            DOM.artContainer.innerHTML = ""; // safety against duplicates

            data.forEach((piece, i) => {

                const div = document.createElement("div");
                div.className = "art-piece";

                div.innerHTML = `
                    <img src="${piece.image}">
                    <div class="art-overlay">${piece.title}</div>
                `;

                div.addEventListener("click", () => {

                    if (!DOM.imageViewer || !DOM.viewerImage) return;

                    DOM.viewerImage.src = piece.image;
                    DOM.imageViewer.classList.add("active");

                    LogSystem.add(`opened: ${piece.title}`, "event");
                });

                DOM.artContainer.appendChild(div);

                setTimeout(() => {
                    div.classList.add("loaded");
                }, i * 60);
            });
        }
    };
    
// =================================================
    // DIARY MODULE (WITH ACCORDION HIERARCHY & ENCRYPTION)
    // =================================================
    const DiaryModule = {
        entries: [],
        isTyping: false,
        typeInterval: null,
        glitchChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#",
        
        // Session key memory (persists across entries)
        globalPassword: null, 

        // Helper method to convert "DD-MM-YYYY" strings into valid Date objects
        parseDate(dateString) {
            if (!dateString) return new Date(0);
            const [day, month, year] = dateString.split("-");
            return new Date(year, month - 1, day);
        },

        init() {
            const listContainer = document.getElementById("diaryListContainer");
            if (!listContainer) return;

            fetch("assets/json/lainavian/diary.json")
                .then(r => r.json())
                .then(data => {
                    // Sort entries automatically by date (Oldest first)
                    this.entries = data.sort((a, b) => this.parseDate(a.date) - this.parseDate(b.date));

                    this.renderList(this.entries);
                    this.bindSearch();
                })
                .catch(() => {
                    if (typeof LogSystem !== 'undefined') {
                        LogSystem.add("diary database connection lost", "warn");
                    }
                });

            // Loop for continuous glitch effect on active censored words
            setInterval(() => {
                document.querySelectorAll('.censor-glitch:not(.decrypted-inline)').forEach(el => {
                    const placeholder = el.getAttribute('data-text') || "XXXXXX";
                    let glitchedText = "";
                    for (let i = 0; i < placeholder.length; i++) {
                        const randomChar = this.glitchChars[Math.floor(Math.random() * this.glitchChars.length)];
                        glitchedText += randomChar;
                    }
                    el.textContent = glitchedText;
                });
            }, 100);
        },

        async renderList(data) {
            const listContainer = document.getElementById("diaryListContainer");
            if (!listContainer) return;

            listContainer.innerHTML = ""; 

            if (!data || data.length === 0) {
                listContainer.innerHTML = `<div class="diary-date">NO LOGS ENCOUNTERED...</div>`;
                return;
            }

            const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

            // 1. Group entries by Year -> Month
            const grouped = {};
            data.forEach(entry => {
                if (!entry.date) return;
                const [day, monthStr, yearStr] = entry.date.split("-");
                
                if (!grouped[yearStr]) grouped[yearStr] = {};
                if (!grouped[yearStr][monthStr]) grouped[yearStr][monthStr] = [];

                grouped[yearStr][monthStr].push(entry);
            });

            // 2. Build accordion UI
            for (const year of Object.keys(grouped).sort((a, b) => b - a)) {
                // Year Header
                const yearHeader = document.createElement("div");
                yearHeader.className = "accordion-header year-header";
                yearHeader.innerHTML = `<span class="accordion-arrow">></span> ${year}`;
                
                const yearContent = document.createElement("div");
                yearContent.className = "accordion-content year-content";
                yearContent.style.display = "none"; // Collapsed by default

                // Toggle Year
                yearHeader.addEventListener("click", () => {
                    const isOpen = yearContent.style.display === "block";
                    yearContent.style.display = isOpen ? "none" : "block";
                    yearHeader.querySelector(".accordion-arrow").textContent = isOpen ? ">" : "v";
                });

                // Month Groups inside Year
                for (const monthStr of Object.keys(grouped[year]).sort((a, b) => Number(b) - Number(a))) {
                    const monthName = monthNames[parseInt(monthStr, 10) - 1] || `MONTH ${monthStr}`;
                    
                    const monthHeader = document.createElement("div");
                    monthHeader.className = "accordion-header month-header";
                    monthHeader.innerHTML = `<span class="accordion-arrow">></span> ${monthName}`;

                    const monthContent = document.createElement("div");
                    monthContent.className = "accordion-content month-content";
                    monthContent.style.display = "none";

                    // Toggle Month
                    monthHeader.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const isOpen = monthContent.style.display === "block";
                        monthContent.style.display = isOpen ? "none" : "block";
                        monthHeader.querySelector(".accordion-arrow").textContent = isOpen ? ">" : "v";
                    });

                    // Log Items inside Month
                    for (const entry of grouped[year][monthStr]) {
                        const div = document.createElement("div");
                        div.className = "diary-entry-item";

                        const userColor = entry.userColor || "rgba(180, 120, 255, 0.4)";
                        const titleColor = entry.titleColor || "#ffffff";
                        const dateColor = entry.dateColor || "#a8b2ff";
                        const entryColor = entry.entryColor || "rgba(180, 120, 255, 0.4)";

                        //Important Varible Names
                        div.style.setProperty("--user-color", userColor);
                        div.style.setProperty("--title-color", titleColor);
                        div.style.setProperty("--date-color", dateColor);
                        div.style.setProperty("--entry-color", entryColor);

                        let displayTitle = entry.title;
                        if (entry.isTitleEncrypted) {
                            if (this.globalPassword) {
                                const decryptedTitle = await this.decryptData(entry.title, entry.titleIv, this.globalPassword);
                                displayTitle = decryptedTitle || "[ DECRYPTION FAILED ]";
                            } else {
                                displayTitle = "[ ENCRYPTED ENTRY ]";
                            }
                        }

                        div.innerHTML = `
                            <span class="diary-date">[ ${entry.date} ] <span class="diary-color-badge"></span></span>
                            <span class="diary-title">${displayTitle}</span>
                        `;

                        div.addEventListener("click", (e) => {
                            e.stopPropagation();
                            this.displayEntry(entry);
                        });

                        monthContent.appendChild(div);
                    }

                    yearContent.appendChild(monthHeader);
                    yearContent.appendChild(monthContent);
                }

                listContainer.appendChild(yearHeader);
                listContainer.appendChild(yearContent);
            }
        },

        bindSearch() {
            const searchInput = document.getElementById("diarySearch");
            if (!searchInput) return;

            searchInput.addEventListener("input", (e) => {
                const query = e.target.value.toLowerCase().trim();
                const filtered = this.entries.filter(entry => {
                    const titleMatch = entry.title && entry.title.toLowerCase().includes(query);
                    const dateMatch = entry.date && entry.date.toLowerCase().includes(query);
                    const contentMatch = entry.content && entry.content.toLowerCase().includes(query);
                    const colorMatch = entry.color && entry.color.toLowerCase().includes(query);

                    return titleMatch || dateMatch || contentMatch || colorMatch;
                });
                
                this.renderList(filtered);
            });
        },

        async getKey(password) {
            const enc = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveKey"]
            );
            return window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: enc.encode("system_archive_salt_phrase"),
                    iterations: 100000,
                    hash: "SHA-256"
                },
                keyMaterial,
                { name: "AES-GCM", length: 256 },
                false,
                ["decrypt"]
            );
        },

        async decryptData(ciphertextBase64, ivBase64, password) {
            try {
                const key = await this.getKey(password);
                const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));
                
                const decrypted = await window.crypto.subtle.decrypt(
                    { name: "AES-GCM", iv: iv },
                    key,
                    ciphertext
                );
                return new TextDecoder().decode(decrypted);
            } catch (e) {
                return null;
            }
        },

        async displayEntry(entry) {
            if (this.isTyping) {
                clearInterval(this.typeInterval);
                this.isTyping = false;
            }

            const terminal = document.getElementById("diaryTerminal");
            if (!terminal) return;

            terminal.innerHTML = ""; 

            // Set the dynamic glow color on the terminal container
            const glowColor = entry.entryColor || "rgba(180, 120, 255, 0.4)";
            terminal.style.setProperty("--terminal-glow", glowColor);

            const header = document.createElement("div");
            header.className = "log-entry event";
            header.textContent = `> ACCESSING SUB_CONSCIOUS LOG: [${entry.date}]...`;
            terminal.appendChild(header);

            // 1. Unencrypted entry path
            if (!entry.isEncrypted && !entry.isTitleEncrypted) {
                this.renderStream(entry.content, entry.date, terminal);
                return;
            }

            // 2. Encrypted path using cached session password
            if (this.globalPassword) {
                header.textContent = `> VAULT KEY ALREADY IN CACHE BUFFER... RUNNING PIPELINE`;
                
                let finalContent = entry.content;
                if (entry.isEncrypted) {
                    finalContent = await this.decryptData(entry.content, entry.iv, this.globalPassword);
                }

                if (finalContent) {
                    // Refresh sidebar list to reveal decrypted titles
                    this.renderList(this.entries);
                    this.renderStream(finalContent, entry.date, terminal);
                } else {
                    this.renderAuthScreen(entry, terminal, header);
                }
                return;
            }

            // 3. Fallback: Prompt for passphrase
            this.renderAuthScreen(entry, terminal, header);
        },

        renderAuthScreen(entry, terminal, header) {
            const authContainer = document.createElement("div");
            authContainer.className = "diary-auth-screen";
            
            authContainer.innerHTML = `
                <div class="diary-auth-prompt">> CRITICAL WARNING: ENCRYPTED STORAGE LOG DETECTED.<br>> AWAITING PASSPHRASE...</div>
                <div class="password-input-row">
                    <span>$</span>
                    <input type="password" class="diary-pass-input" placeholder="ENTER PASSPHRASE..." autocomplete="off">
                    <button class="diary-pass-btn">SUBMIT</button>
                </div>
            `;

            terminal.appendChild(authContainer);
            terminal.scrollTop = terminal.scrollHeight;

            const input = authContainer.querySelector(".diary-pass-input");
            const btn = authContainer.querySelector(".diary-pass-btn");

            const handleAuthSubmit = async () => {
                const passAttempt = input.value;
                if (!passAttempt) return;

                header.textContent = `> ATTEMPTING DECRYPTION VIA ARCHIVE KEY STRATUM...`;
                
                let finalContent = entry.content;
                if (entry.isEncrypted) {
                    finalContent = await this.decryptData(entry.content, entry.iv, passAttempt);
                }
                
                if (!finalContent) {
                    header.textContent = `> DECRYPTION FAILED: INVALID CRITICAL ARCHIVE MATRIX PASSKEY.`;
                    header.className = "log-entry warn";
                    input.value = "";
                    input.style.borderColor = "rgb(255, 75, 84)";
                    return;
                }

                this.globalPassword = passAttempt; 
                authContainer.remove();
                
                // Refresh sidebar list to reveal decrypted titles
                await this.renderList(this.entries);
                this.renderStream(finalContent, entry.date, terminal);
            };

            btn.addEventListener("click", handleAuthSubmit);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") handleAuthSubmit();
            });
            input.focus();
        },

        async decryptAllInlineWords(password) {
            const inlineWords = document.querySelectorAll('.encrypted-word:not(.decrypted-inline)');
            let anySuccess = false;

            for (const el of inlineWords) {
                const cipher = el.getAttribute('data-cipher');
                const iv = el.getAttribute('data-iv');

                if (cipher && iv) {
                    const decryptedText = await this.decryptData(cipher, iv, password);
                    if (decryptedText) {
                        el.textContent = decryptedText;
                        el.classList.add('decrypted-inline');
                        anySuccess = true;
                    }
                }
            }
            return anySuccess;
        },

        renderStream(content, date, terminal) {
            const contentBody = document.createElement("div");
            contentBody.className = "log-entry system";
            contentBody.style.marginTop = "15px";
            terminal.appendChild(contentBody);

            if (typeof LogSystem !== 'undefined') {
                LogSystem.add(`streaming memory trace: ${date}`, "event");
            }
            
            this.typeText(contentBody, content, terminal);
        },

        typeText(element, text, container, speed = 15) {
            this.isTyping = true;
            let i = 0;
            element.innerHTML = ""; 

            this.typeInterval = setInterval(() => {
                if (i >= text.length) {
                    clearInterval(this.typeInterval);
                    this.isTyping = false;
                    
                    const footer = document.createElement("div");
                    footer.className = "log-entry event";
                    footer.style.marginTop = "15px";
                    footer.textContent = "> END OF DATA STREAM.";
                    container.appendChild(footer);
                    container.scrollTop = container.scrollHeight;

                    // Bind word interactions
                    this.bindInlineWordListeners(container);

                    // Persistent auto-decryption on load!
                    if (this.globalPassword) {
                        this.decryptAllInlineWords(this.globalPassword);
                    }
                    return;
                }

                if (text[i] === '<') {
                    let tag = "";
                    while (i < text.length && text[i] !== '>') {
                        tag += text[i];
                        i++;
                    }
                    if (i < text.length) {
                        tag += '>'; 
                        i++;        
                    }
                    element.innerHTML += tag;
                } else {
                    element.innerHTML += text[i];
                    i++;
                }

                container.scrollTop = container.scrollHeight;
            }, speed);
        },

        bindInlineWordListeners(container) {
            const encryptedWords = container.querySelectorAll('.encrypted-word');
            
            encryptedWords.forEach(word => {
                word.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    
                    if (word.classList.contains('decrypted-inline')) return;

                    // If password is already cached, unlock instantly
                    if (this.globalPassword) {
                        const success = await this.decryptAllInlineWords(this.globalPassword);
                        if (success) return;
                    }

                    // Otherwise, render custom terminal password box
                    this.renderInlineAuthPrompt(container);
                });
            });
        },

        renderInlineAuthPrompt(container) {
            // Avoid generating duplicate input fields
            if (container.querySelector(".inline-pass-box")) return;

            const inlineAuth = document.createElement("div");
            inlineAuth.className = "diary-auth-screen inline-pass-box";
            
            inlineAuth.innerHTML = `
                <div class="diary-auth-prompt">> INLINE DATA ENCRYPTED. ENTER DECRYPTION MATRIX PASSPHRASE:</div>
                <div class="password-input-row">
                    <span>$</span>
                    <input type="password" class="diary-pass-input inline-input" placeholder="ENTER PASSPHRASE..." autocomplete="off">
                    <button class="diary-pass-btn inline-btn">UNLOCK</button>
                </div>
            `;

            container.appendChild(inlineAuth);
            container.scrollTop = container.scrollHeight;

            const input = inlineAuth.querySelector(".inline-input");
            const btn = inlineAuth.querySelector(".inline-btn");

            const handleInlineAuthSubmit = async () => {
                const passAttempt = input.value;
                if (!passAttempt) return;

                const success = await this.decryptAllInlineWords(passAttempt);
                
                if (success) {
                    this.globalPassword = passAttempt; // Save key for session persistence
                    inlineAuth.remove(); // Clear input prompt
                } else {
                    input.value = "";
                    input.style.borderColor = "rgb(255, 75, 84)";
                }
            };

            btn.addEventListener("click", handleInlineAuthSubmit);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") handleInlineAuthSubmit();
            });
            input.focus();
        }
    };
    
    // =================================================
    // IMAGE VIEWER
    // =================================================
    const ViewerModule = {

        init() {

            if (!DOM.imageViewer) return;

            DOM.imageViewer.addEventListener("click", () => {
                DOM.imageViewer.classList.remove("active");
            });
        }
    };

    // =================================================
    // TRANSITIONS
    // =================================================
    const TransitionModule = {

        init() {

            document.querySelectorAll("[data-transition]").forEach(link => {

                link.addEventListener("click", (e) => {

                    e.preventDefault();

                    const url = link.getAttribute("href");
                    if (!url) return;

                    if (DOM.overlay) {
                        DOM.overlay.classList.add("active");
                    }

                    setTimeout(() => {
                        window.location.href = url;
                    }, 500);
                });
            });
        }
    };

    // =================================================
    // LOG IDLE SYSTEM
    // =================================================
    const IdleSystem = {

    timer: null,
    idleMessageTimer: null,

    lastInteraction: Date.now(),
    isIdle: false,

    init() {

        ["keydown", "click", "scroll"].forEach(evt => {
            window.addEventListener(evt, () => this.reset());
        });

        this.loop();
    },

    reset() {

        this.lastInteraction = Date.now();

        if (this.isIdle) {
            this.isIdle = false;
            LogSystem.add("user activity resumed", "event");
        }

        // stop idle message loop immediately
        if (this.idleMessageTimer) {
            clearTimeout(this.idleMessageTimer);
            this.idleMessageTimer = null;
        }
    },

    loop() {

        this.timer = setInterval(() => {

            const now = Date.now();
            const diff = now - this.lastInteraction;

            if (diff > 15000 && !this.isIdle) {
                this.isIdle = true;
                this.startIdleMessages();
            }

        }, 1000);
    },

    startIdleMessages() {

        if (!this.isIdle) return;

        const msgs = [
            "monitoring user interaction patterns...",
            "system idle but active",
            "archive enters low-power observation mode"
        ];

        const send = () => {

            if (!this.isIdle) return;

            const msg = msgs[Math.floor(Math.random() * msgs.length)];
            LogSystem.add(msg, "event");

            // schedule next idle message (random delay feels more human)
            const delay = Math.random() * 2000 + 15000;

            this.idleMessageTimer = setTimeout(send, delay);
        };

        send();
    }
};;

    // =================================================
    // BOOT SEQUENCE & AUDIO MODULE
    // =================================================
    const BootSequenceModule = {
        init() {
            const bootScreen = document.getElementById("bootScreen");
            const bgm = document.getElementById("bgm-player");

            // If there's no boot screen on this page, abort module
            if (!bootScreen) return; 

            // Prep ambient volume
            if (bgm) bgm.volume = 0.15; 

            const initializeSystem = () => {
                // 1. boot audio
                if (bgm) {
                    bgm.play().then(() => {
                        LogSystem.add("audio subsystem initialized", "event");
                    }).catch(e => console.log("Audio blocked.", e));
                }

                // 2. Log the login
                LogSystem.add("user authenticated. system online.", "event");

                // 3. Fade out the shield
                bootScreen.classList.add("hidden");

                // 4. Clean up (remove listener and remove from DOM after fade)
                bootScreen.removeEventListener("click", initializeSystem);
                setTimeout(() => bootScreen.remove(), 800);
            };

            // Wait for the user to click the boot screen
            bootScreen.addEventListener("click", initializeSystem);
        }
    };

    // =================================================
    // TERMINAL
    // =================================================
        const Terminal = {

    active: false,
    inputBufferRunning: false,

    index: 0,
    charIndex: 0,

    currentLine: null,
    currentType: null,

    waitingForInput: false,
    typing: false, 

    script: [],

    init() {
        fetch("assets/json/lainavian/terminal.json")
            .then(r => r.json())
            .then(data => {
                this.script = data;
                this.start();
            })
            .catch(() => {
                console.error("failed to load terminal.json");
            });
    },

    get output() {
        return document.getElementById("terminalOutput");
    },

    startLine() {
        const out = this.output;
        if (!out) return;

        const line = document.createElement("div");
        line.className = `log-entry ${this.currentType || "event"}`;
        line.textContent = "";

        out.appendChild(line);

        this.currentLine = line;
        this.scroll();
    },

    scroll() {
        const out = this.output;
        if (!out) return;
        out.scrollTop = out.scrollHeight;
    },

    // =========================
    // AUTO TYPE
    // =========================
    autoType(step) {

        if (this.typing) return;
        this.typing = true;

        this.waitingForInput = false;

        const msg = step.text;
        this.currentType = step.type || "event";

        this.startLine();

        let i = 0;

        const typeNext = () => {

            if (i >= msg.length) {
                this.typing = false;
                this.index++;
                this.next();
                return;
            }

            // delay tag [1500]
            if (msg[i] === "[") {
                const end = msg.indexOf("]", i);

                if (end !== -1) {
                    const pause = parseInt(msg.slice(i + 1, end));

                    if (!isNaN(pause)) {
                        i = end + 1;
                        setTimeout(typeNext, pause);
                        return;
                    }
                }
            }

            this.currentLine.textContent += msg[i];
            i++;

            this.scroll();
            setTimeout(typeNext, 50);
        };

        typeNext();
    },

    // =========================
    // INPUT TYPE
    // =========================
    inputType() {

    if (this.typing) return;
    this.typing = true;

    const step = this.script[this.index];
    if (!step) return;

    this.currentType = step.type || "event";

    if (!this.currentLine) {
        this.startLine();
    }

    const msg = step.text;

    const loop = () => {

        // finished line
        if (this.charIndex >= msg.length) {

            this.typing = false;

            this.index++;
            this.charIndex = 0;
            this.currentLine = null;
            this.waitingForInput = false;

            this.next();
            return;
        }

        // delay tags [1500]
        if (msg[this.charIndex] === "[") {
            const end = msg.indexOf("]", this.charIndex);

            if (end !== -1) {
                const pause = parseInt(msg.slice(this.charIndex + 1, end));

                if (!isNaN(pause)) {
                    this.charIndex = end + 1;
                    setTimeout(loop, pause);
                    return;
                }
            }
        }

        // chars per keypress trigger
        const chunkSize = Math.floor(Math.random() * 3) + 1;

        const chunk = msg.slice(this.charIndex, this.charIndex + chunkSize);

        this.currentLine.textContent += chunk;
        this.charIndex += chunkSize;

        this.scroll();

        this.typing = false; // unlock so next keypress continues
    };

    loop();
},

    // =========================
    // FLOW CONTROL 
    // =========================
    next() {

        if (this.typing) return; // prevents double triggers

        const step = this.script[this.index];
        if (!step) return;

        if (step.mode === "auto") {
            this.autoType(step);
            return;
        }

        if (step.mode === "input") {
            this.waitingForInput = true;
            this.currentLine = null;
            this.charIndex = 0;
            return;
        }
    },

    start() {
        this.index = 0;
        this.charIndex = 0;
        this.currentLine = null;
        this.waitingForInput = false;
        this.typing = false;

        this.next();
    }
};

// =========================
// INPUT TRIGGER
// =========================
document.addEventListener("keydown", () => {

    const terminalEl = document.getElementById("terminal");
    if (!terminalEl) return;

    if (!Terminal.active) return;
    if (!Terminal.waitingForInput) return;

    if (!Terminal.typing && Terminal.waitingForInput) {
    Terminal.inputType();
}
});

const terminalEl = document.getElementById("terminal");

if (terminalEl) {
    terminalEl.addEventListener("click", () => {
        Terminal.active = true;
        terminalEl.focus();
    });
}

Terminal.init();
    // =================================================
    // INIT
    // =================================================
    MusicModule.init();
    ArtModule.init();
    ViewerModule.init();
    TransitionModule.init();
    IdleSystem.init();
    DiaryModule.init();
    BootSequenceModule.init();
    CensorModule.init();
});