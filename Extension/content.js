(() => {

    let currentVideo = null;
    let videoElement = null;
    let lastVideoId = null;
    let oldVideoTitle = null;
    let pauseTimeout = null;
    let fakePauseTimeout = null;
    const debugging = false;

    function getVideoIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    async function waitForValidTextTitle(selector, attempts = 5, delayMs = 300) {
        for (let i = 0; i < attempts; i++) {
            const elem = document.querySelector(selector);
            const text = elem?.textContent?.trim();
            if (
                text && 
                text !== "Unknown Channel" && 
                text !== "Unknown Title" && 
                text !== oldVideoTitle
            ) {
                oldVideoTitle = text;
                return text;
            }
            await new Promise(r => setTimeout(r, delayMs));
        }
        return null;
    }

    async function waitForValidTextChannel(selector, attempts = 5, delayMs = 300) {
        for (let i = 0; i < attempts; i++) {
            const elem = document.querySelector(selector);
            const text = elem?.textContent?.trim();
            if (text && text !== "Unknown Channel" && text !== "Unknown Title") {
                return text;
            }
            await new Promise(r => setTimeout(r, delayMs));
        }
        return null;
    }

    async function getYouTubeVideoTitle() {
        const sel = 'ytd-video-primary-info-renderer h1.title yt-formatted-string';
        const title = await waitForValidTextTitle(sel);
        if (title) return title;
        return document.title.replace(/\s*-\s*YouTube$/, '').trim();
    }

    async function getYouTubeChannelName() {
        let meta = document.querySelector('meta[itemprop="author"]');
        if (meta?.content) return meta.content.trim();

        const sel = 'ytd-channel-name .yt-simple-endpoint.style-scope';
        const channel = await waitForValidTextChannel(sel);
        if (channel) return channel;

        return "Unknown Channel";
    }

    function attachListeners(video) {
        if (!video) return;

        const events = [
            "play",
            "pause",
            "ended",
            "seeking",
            "seeked",
            "ratechange",
            "volumechange",
            "timeupdate"
        ];

        events.forEach(event => {
            video.addEventListener(event, () => {
                if (!currentVideo) return;

                if (event === 'seeked') {
                    if (debugging) console.log(`SKIPPED FORWARD OR BACKWARDS: NEW TIME: ${video.currentTime.toFixed(2)}`);
                    browser.runtime.sendMessage({
                        type: "skip_video",
                        timestamp: Date.now(),
                        extraData: { time: video.currentTime.toFixed(2) }
                    });
                }

                else if (event === 'pause') {
                    if (debugging) console.log(`PAUSED VIDEO (waiting 1.5s before confirming)`);

                    if (pauseTimeout) clearTimeout(pauseTimeout);

                    pauseTimeout = setTimeout(() => {
                        if (video.paused) {
                            if (debugging) console.log(`Confirmed PAUSED VIDEO after 1.5s`);
                            browser.runtime.sendMessage({
                                type: "pause",
                                timestamp: Date.now(),
                                extraData: { time: video.currentTime.toFixed(2) }
                            });
                        } else {
                            if (debugging) console.log(`Pause check after 1.5s: video is playing again, cancel pause message`);
                        }
                        pauseTimeout = null;
                    }, 1500);
                }

                else if (event === 'play') {
                    if (debugging) console.log(`RESUMED VIDEO`);

                    if (pauseTimeout) {
                        if (debugging) console.log(`Cancelled pending PAUSE due to PLAY`);
                        clearTimeout(pauseTimeout);
                        pauseTimeout = null;
                    }

                    browser.runtime.sendMessage({
                        type: "resume",
                        timestamp: Date.now(),
                        extraData: { time: video.currentTime.toFixed(2) }
                    });
                }
            });
        });
    }

    function findMainYouTubeVideo() {
        const videos = Array.from(document.querySelectorAll("video.video-stream.html5-main-video"));
        return videos[0] || null;
    }

    async function checkForVideoChange() {
        const vid = getVideoIdFromUrl();
        if (vid && vid !== lastVideoId) {
            lastVideoId = vid;
            const title = await getYouTubeVideoTitle();
            const channel = await getYouTubeChannelName();
            const video = findMainYouTubeVideo();
            const currentTime = video ? video.currentTime.toFixed(2) : 'N/A';
            currentVideo = title;
            if (debugging) console.log(`NEW VIDEO STARTED: Title: "${title}", Channel: "${channel}"; CURRENT TIME: ${currentTime}s`);
            browser.runtime.sendMessage({
                type: "new_video",
                timestamp: Date.now(),
                extraData: { title: title, channel: channel, currentTime: currentTime }
            });
            setTimeout(() => {
                browser.runtime.sendMessage({
                    type: "skip_video",
                    timestamp: Date.now(),
                    extraData: { time: video.currentTime.toFixed(2) }
                });
            }, 1000);
        }
    }

    let hadVideo = false;

    function checkForFakePause() {
        if (fakePauseTimeout) {
            clearTimeout(fakePauseTimeout);
        }

        fakePauseTimeout = setTimeout(() => {
            if (!video.paused) {
                if (debugging) console.log("Detected fake pause event. VIDEO IS ACTUALLY PLAYING.")
                browser.runtime.sendMessage({
                    type: "resume",
                    timestamp: Date.now(),
                    extraData: { time: video.currentTime.toFixed(2) }
                });
            } else {
                if (debugging) console.log("Confirm real pause");
            }
            fakePauseTimeout = null;
        }, 1000);
    }

    function checkForVideoPresenceChange() {
        const hasVideo = !!findMainYouTubeVideo();

        if (hadVideo && !hasVideo) {
            if (debugging) console.log("Video gone detected");
            currentVideo = null;
            lastVideoId = null;
            browser.runtime.sendMessage({
                type: "video_gone",
                timestamp: Date.now()
            });
        }
        hadVideo = hasVideo;
    }

    let lastHref = location.href;
    new MutationObserver(() => {
        if (location.href !== lastHref) {
            lastHref = location.href;
            checkForVideoChange();
            checkForVideoPresenceChange();
        }
    }).observe(document, {childList: true, subtree: true});

    setInterval(() => {
        const vidElem = findMainYouTubeVideo();
        if (vidElem !== videoElement) {
            videoElement = vidElem;
            attachListeners(videoElement);
            if (debugging) console.log("Listeners attached to video element");
        }
        checkForVideoPresenceChange();
    }, 1000);

    window.addEventListener("pagehide", () => {
        if (hadVideo) {
            if (debugging) console.log("Pagehide event - video gone");
            currentVideo = null;
            lastVideoId = null;
            hadVideo = false;
            browser.runtime.sendMessage({
                type: "video_gone",
                timestamp: Date.now()
            });
        }
    });

    checkForVideoChange();
    hadVideo = !!findMainYouTubeVideo();

})();
