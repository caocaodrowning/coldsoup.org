document.addEventListener("DOMContentLoaded", () => {
    const bgAudio = document.getElementById("background");

    const DEFAULT_TRACK = "/assets/audio/swans_i_was_a_prisoner_in_your_skull_snippet.mp3";

    const getCleanName = (path) => {
        const file = path.split("/").pop() || "";
        return file.replace(".html", "");
    };

    const initSite = async () => {
        const path = window.location.pathname;
        const cleanFile = getCleanName(path);
        
        const activeContainer = document.getElementById("container");
        const isReal404Page = activeContainer && activeContainer.getAttribute("data-track") === "/assets/audio/lily_chou_chou_detune.mp3";

        if (isReal404Page) {
            manageAudioTracks();
            syncStylesToBody(); 
            bindLinks(); 
            return;
        }

        if (path.endsWith("index.html") || path === "/" || path === "" || cleanFile === "index") {
            await handleNavigation("root.html");
            history.replaceState({ url: "root.html" }, "", "root");
        } else {
            if (path.endsWith(".html")) {
                await handleNavigation(cleanFile + ".html");
            } else if (cleanFile) {
                await handleNavigation(cleanFile + ".html");
            }
        }

        manageAudioTracks();
    };

    document.addEventListener("click", (e) => {
        const enterBtn = e.target.closest("#enter-btn");
        const overlay = document.getElementById("intro-overlay");

        if (enterBtn && overlay) {
            e.preventDefault(); 

            overlay.style.opacity = "0";

            setTimeout(() => {
                document.body.classList.add("animation-running");
                syncStylesToBody(); 
            }, 300); 

            setTimeout(() => {
                overlay.remove();
                manageAudioTracks();
            }, 500);
        }
    });

    const manageAudioTracks = () => {
        const activeContainer = document.getElementById("container");
        if (!activeContainer) return;

        const targetTrack = activeContainer.getAttribute("data-track") || DEFAULT_TRACK;
        const sourceElement = bgAudio.querySelector("source");
        const currentTrackSource = sourceElement.getAttribute("src");

        if (currentTrackSource !== targetTrack) {
            sourceElement.setAttribute("src", targetTrack);
            bgAudio.load();

            if (!document.getElementById("intro-overlay")) {
                bgAudio.play().catch(err => console.log("audio play blocked:", err));
            }
        } else {
            if (!document.getElementById("intro-overlay") && bgAudio.paused) {
                bgAudio.play().catch(err => console.log("audio play blocked:", err));
            }
        }
    };

    const syncStylesToBody = () => {
        const activeContainer = document.getElementById("container");

        if (activeContainer && activeContainer.hasAttribute("style")) {
            const styleAttr = activeContainer.getAttribute("style");
            document.body.setAttribute("style", styleAttr);

            if (styleAttr.includes("--bg-image")) {
                document.body.classList.add("custom-bg-active");
            } else {
                document.body.classList.remove("custom-bg-active");
            }
        } else {
            document.body.classList.remove("custom-bg-active");
            
            document.body.style.removeProperty("--bg-image");
            document.body.style.removeProperty("--bg-size");
            document.body.style.removeProperty("--bg-position-start");
        }
    };

    const handleNavigation = async (fileUrl) => {
        try {
            if (!fileUrl || fileUrl === ".html") return;

            const response = await fetch(fileUrl);
            if (!response.ok) {
                await handleNavigation("/404.html");
                return;
            }
            const htmlText = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            const targetContainer = doc.getElementById("container");

            if (targetContainer) {
                const currentContainer = document.getElementById("container");
                currentContainer.replaceWith(targetContainer);

                if (doc.title) document.title = doc.title;

                syncStylesToBody(); 
                manageAudioTracks();
                bindLinks();
            } else {
                throw new Error("Missing container in target page.");
            }
        } catch (error) {
            console.error("Navigation error:", error);
            window.location.href = fileUrl;
        }
    };

    const bindLinks = () => {
        document.querySelectorAll(".nav-link").forEach(link => {
            link.removeEventListener("click", linkClickEvent);
            link.addEventListener("click", linkClickEvent);
        });
    };

    const linkClickEvent = (e) => {
        e.preventDefault();
        const targetFile = e.currentTarget.getAttribute("href");
        const cleanUrl = targetFile.replace(".html", "");

        history.pushState({ url: targetFile }, "", cleanUrl);
        handleNavigation(targetFile);
    };

    const friendsList = [
        { name: "JACKPOT !!", url: "https://www.youtube.com/@carpmachinegun" },
        { name: "romnk", url: "https://www.youtube.com/@lonk7500" },
        { name: "dan hibiki", url: "https://bitehand.bandcamp.com/" },
        { name: "michigan state", url: "https://overcastharbor.bandcamp.com/" },
        { name: "benjo", url: "https://gnarville.nekoweb.org/" },
        { name: "john l4d2", url: "https://thereall4d2ellis.neocities.org/" },
        { name: "big nurf", url: "https://www.youtube.com/@hurfnurf2487" },
        { name: "THE GOAT", url: "https://www.youtube.com/@k00z3r" },
        { name: "lequint dickey mining co", url: "https://www.youtube.com/@ShitterGamingYT" },
        { name: "whensthefullversioncomingout", url: "https://www.twitch.tv/demodestroier" },
    ];

    document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "lotto-btn") {
            const btn = e.target;
            const display = document.getElementById("lotto-display");
            const resultContainer = document.getElementById("result-link");

            if (!display || !resultContainer) return;

            btn.disabled = true; 
            resultContainer.innerHTML = ""; 
            display.style.color = "#00ff00"; 
            
            let spins = 0;
            const maxSpins = 40; 
            let speed = 40; 
            
            function spin() {
                const randomIndex = Math.floor(Math.random() * friendsList.length);
                display.innerText = friendsList[randomIndex].name;
                spins++;
                
                if (spins < maxSpins) {
                    if (spins > 25) speed += 15;
                    if (spins > 35) speed += 50;
                    setTimeout(spin, speed);
                } else {
                    const winner = friendsList[randomIndex];
                    display.innerText = winner.name;
                    display.style.color = "red"; 
                    resultContainer.innerHTML = `<a href="${winner.url}" style="color: red; text-decoration: none; border-bottom: 1px dashed red;">>>> OFF YOU GO <<<</a>`;
                    btn.disabled = false;
                }
            }
            spin();
        }
    });

    initSite();

    window.addEventListener("popstate", (e) => {
        if (e.state && e.state.url) {
            handleNavigation(e.state.url);
        } else {
            const cleanFile = getCleanName(window.location.pathname);
            if (cleanFile && cleanFile !== "root") {
                handleNavigation(cleanFile + ".html");
            } else {
                handleNavigation("root.html");
            }
        }
    });
});