document.addEventListener("DOMContentLoaded", () => {
    const bgAudio = document.getElementById("background");

    const DEFAULT_TRACK = "/assets/audio/i-was-a-prisoner-in-your-site.mp3";

    const pageCache = {};
    const imageCache = new Set();

    const preloadImages = (htmlString) => {

        const parser = new DOMParser();

        const doc = parser.parseFromString(htmlString, "text/html");
    

        doc.querySelectorAll("img").forEach((img) => {

            const src = img.getAttribute("src");
        
            if (src && !imageCache.has(src)) {
                imageCache.add(src);
                const imgObject = new Image(); 
                imgObject.src = src;
                console.log(`we done got: ${src}`);
            }
        });
    };

    const getCleanName = (path) => {
        const file = path.split("/").pop() || "";
        return file.replace(".html", "");
    };

const initSite = async () => {
        const path = window.location.pathname;
        const cleanFile = getCleanName(path);
        
        const activeContainer = document.getElementById("container");
        const isReal404Page = activeContainer && activeContainer.getAttribute("data-track") === "/assets/audio/lily.mp3";

        if (isReal404Page) {
            console.log("bruh");
            manageAudioTracks();
            
            syncStylesToBody(); 
            
            bindLinks(); 
            prefetchPages(); 
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
        prefetchPages(); 
    };

const prefetchPages = () => {
    document.querySelectorAll(".nav-link").forEach(async (link) => {
        const fileUrl = link.getAttribute("href");
        
        if (!fileUrl || fileUrl.startsWith("http") || pageCache[fileUrl]) return;

        try {
            const response = await fetch(fileUrl);
            if (response.ok) {
                const htmlText = await response.text();
                pageCache[fileUrl] = htmlText;
                console.log(`we done got: ${fileUrl}`);
                
                preloadImages(htmlText); 
            }
        } catch (err) {
            console.log(`we did not get ${fileUrl}:`, err);
        }
    });
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

            let htmlText = "";

            if (pageCache[fileUrl]) {
                htmlText = pageCache[fileUrl];
            } else {
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    console.warn("not a real country");
                    await handleNavigation("/404.html");
                    return;
                }
                htmlText = await response.text();
            }

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
                
                prefetchPages();
            }
        } catch (error) {
            console.error("bruh:", error);
            
            const currentClean = getCleanName(window.location.pathname);
            const targetClean = getCleanName(fileUrl);
            if (currentClean !== targetClean) {
                window.location.href = fileUrl;
            }
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
            const cleanFile = getCleanName(window.location.pathname);
            if (cleanFile && cleanFile !== "root") {
                handleNavigation(cleanFile + ".html");
            } else {
                handleNavigation("root.html");
            }
        }
    });
});