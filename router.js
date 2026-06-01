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
        
        // Check if the HTML file natively served by Neocities/hosting is your 404 container
        const activeContainer = document.getElementById("container");
        const isReal404Page = activeContainer && activeContainer.getAttribute("data-track") === "/assets/audio/lily.mp3";

        // If the server served our 404 page due to a broken URL, do NOT try to fetch the broken URL file!
        if (isReal404Page) {
            console.log("Real 404 error detected via server layout. Halting silent navigation boot.");
            manageAudioTracks();
            syncStylesToBody();
            bindLinks(); // Ensures navbar links still work on the 404 screen
            return;
        }

        // Proceed with normal single-page application booting rules
        if (path.endsWith("index.html") || path === "/" || path === "" || cleanFile === "index") {
            await handleNavigation("home.html");
            history.replaceState({ url: "home.html" }, "", "home");
        } else {
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
            
            // Break infinite rapid-refresh loops by cross-checking locations before a hard redirect
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

        history.pushState({ url: targetFile }, "", cleanUrl);
        handleNavigation(targetFile);
    };

    // Run launcher initialization on document setup ready
    initSite();

    // --- 7. BROWSER BUTTON EVENT BINDING (Back & Forward arrows) ---
    window.addEventListener("popstate", (e) => {
        if (e.state && e.state.url) {
            handleNavigation(e.state.url);
        } else {
            const cleanFile = getCleanName(window.location.pathname);
            if (cleanFile && cleanFile !== "home") {
                handleNavigation(cleanFile + ".html");
            } else {
                handleNavigation("home.html");
            }
        }
    });
});