document.addEventListener("DOMContentLoaded", () => {
    const bgAudio = document.getElementById("background");

    const DEFAULT_TRACK = "/assets/audio/i-was-a-prisoner-in-your-site.mp3";

    const initSite = async () => {
        const path = window.location.pathname;

        if (path.endsWith("index.html") || path === "/" || path === "") {
            await handleNavigation("home.html");
            history.replaceState({ url: "home.html" }, "", "home");
        } else {
            const currentFile = path.split("/").pop();
            if (currentFile && currentFile.endsWith(".html")) {
                await handleNavigation(currentFile);
            } else if (currentFile) {
                await handleNavigation(currentFile + ".html");
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
            document.body.classList.add("animation-running");

            setTimeout(() => {
                overlay.remove();
                manageAudioTracks();
                syncStylesToBody();
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
                bgAudio.play().catch(err => console.log("Audio play blocked/delayed:", err));
            }
        } else {
            if (!document.getElementById("intro-overlay") && bgAudio.paused) {
                bgAudio.play().catch(err => console.log("Audio play blocked/delayed:", err));
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
            document.body.removeAttribute("style");
            document.body.classList.remove("custom-bg-active");
        }
    };

    const handleNavigation = async (fileUrl) => {
        try {
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
            console.error("Router error:", error);
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

    initSite();

    window.addEventListener("popstate", (e) => {
        if (e.state && e.state.url) {
            handleNavigation(e.state.url);
        } else {
            handleNavigation("home.html");
        }
    });
});