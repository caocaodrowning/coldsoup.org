document.addEventListener("DOMContentLoaded", () => {
    const bgAudio = document.getElementById("background");

    const DEFAULT_TRACK = "/assets/audio/i-was-a-prisoner-in-your-site.mp3";

    // Helper to safely clean up file extensions for comparison
    const getCleanName = (path) => {
        const file = path.split("/").pop() || "";
        return file.replace(".html", "");
    };

    // --- 1. INITIAL SILENT BOOT ---
    const initSite = async () => {
        const path = window.location.pathname;
        const cleanFile = getCleanName(path);
        
        // If they land on the root domain or index, fetch home.html into the wrapper
        if (path.endsWith("index.html") || path === "/" || path === "" || cleanFile === "index") {
            await handleNavigation("home.html");
            history.replaceState({ url: "home.html" }, "", "home");
        } else {
            // Re-fetch the current file cleanly based on whatever route they refreshed on
            if (path.endsWith(".html")) {
                await handleNavigation(cleanFile + ".html");
            } else if (cleanFile) {
                await handleNavigation(cleanFile + ".html");
            }
        }

        manageAudioTracks();
    };

    // --- 2. GLOBAL ENTER SITE OVERLAY TRIGGER ---
    document.addEventListener("click", (e) => {
        const enterBtn = e.target.closest("#enter-btn");
        const overlay = document.getElementById("intro-overlay");

        if (enterBtn && overlay) {
            e.preventDefault();

            overlay.style.opacity = "0";
            document.body.classList.add("animation-running");

            setTimeout(() => {
                overlay.remove();
                manageAudioTracks();
                syncStylesToBody();
            }, 500);
        }
    });

    // --- 3. DYNAMIC MUSIC TRACK MANAGER ---
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
                bgAudio.play().catch(err => console.log("Audio play blocked/delayed:", err));
            }
        } else {
            if (!document.getElementById("intro-overlay") && bgAudio.paused) {
                bgAudio.play().catch(err => console.log("Audio play blocked/delayed:", err));
            }
        }
    };

    // --- 4. BODY STYLE SYNCHRONIZER ---
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
            document.body.removeAttribute("style");
            document.body.classList.remove("custom-bg-active");
        }
    };

    // --- 5. CONTAINER ROUTER ENGINE ---
    const handleNavigation = async (fileUrl) => {
        try {
            // Prevent attempting to fetch empty or corrupt paths
            if (!fileUrl || fileUrl === ".html") return;

            const response = await fetch(fileUrl);
            if (!response.ok) throw new Error("Could not fetch file.");

            const htmlText = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, "text/html");

            const targetContainer = doc.getElementById("container");

            if (targetContainer) {
                document.getElementById("container").innerHTML = targetContainer.innerHTML;

                if (targetContainer.hasAttribute("style")) {
                    document.getElementById("container").setAttribute("style", targetContainer.getAttribute("style"));
                } else {
                    document.getElementById("container").removeAttribute("style");
                }

                if (targetContainer.hasAttribute("data-track")) {
                    document.getElementById("container").setAttribute("data-track", targetContainer.getAttribute("data-track"));
                } else {
                    document.getElementById("container").removeAttribute("data-track");
                }

                if (doc.title) document.title = doc.title;

                syncStylesToBody();
                manageAudioTracks();
                bindLinks();
            }
        } catch (error) {
            console.error("Router error handling navigation:", error);
            // FIXED: If we are already on a broken route, do NOT force an infinite reload loop.
            // Only force reload if the fileUrl isn't matching our current clean window location.
            const currentClean = getCleanName(window.location.pathname);
            const targetClean = getCleanName(fileUrl);
            if (currentClean !== targetClean) {
                window.location.href = fileUrl;
            }
        }
    };

    // --- 6. NAVIGATION LINK EVENT BINDERS ---
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