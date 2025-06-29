let port = browser.runtime.connectNative("youtube_discord_rich_presence");

port.onMessage.addListener((msg) => {
    console.log("Received from native:", msg);
});

port.onDisconnect.addListener(() => {
    console.log("Native app disconnected");
});

browser.runtime.onMessage.addListener((message, sender) => {
    console.log("Received from content script:", message);
    port.postMessage(message);
});
