const { stdin, stdout } = process;

function readMessage() {
    return new Promise((resolve) => {
        let lengthBuffer = Buffer.alloc(4);
        let lengthRead = 0;
        let chunks = [];

        function readLength() {
            const chunk = stdin.read(4 - lengthRead);
            if (chunk) {
                chunk.copy(lengthBuffer, lengthRead);
                lengthRead += chunk.length;
                if (lengthRead === 4) {
                    const msgLength = lengthBuffer.readUInt32LE(0);
                    readPayload(msgLength);
                } else {
                    stdin.once('readable', readLength);
                }
            } else {
                stdin.once('readable', readLength);
            }
        }

        let msgLength = 0;
        let payloadLength = 0;
        function readPayload(len) {
            msgLength = len;
            function readBody() {
                const chunk = stdin.read(msgLength - payloadLength);
                if (chunk) {
                    chunks.push(chunk);
                    payloadLength += chunk.length;
                    if (payloadLength === msgLength) {
                        const messageBuffer = Buffer.concat(chunks);
                        const messageText = messageBuffer.toString('utf8');
                        resolve(JSON.parse(messageText));
                    } else {
                        stdin.once('readable', readBody);
                    }
                } else {
                    stdin.once('readable', readBody);
                }
            }
            readBody();
        }

        readLength();
    });
}

function sendMessage(msg) {
    const json = JSON.stringify(msg);
    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32LE(Buffer.byteLength(json), 0);
    stdout.write(lengthBuffer);
    stdout.write(json);
}

const RPC = require('discord-rpc');
const clientId = '1388736304560214167';

RPC.register(clientId);

let title = '';
let channel = '';
let rpc;
let time;
let paused = false;
let videoStartUnixTime = null;

async function updateDiscordRpc() {
    if (rpc) {
        let activity;
        if (paused) {
            activity = {
                details: `PAUSED: ${title}`,
                state: `by ${channel}`,
                startTimestamp: null,
                largeImageKey: 'yotube',
                largeImageText: title,
                instance: false,
            };
        } else {
            activity = {
                details: `${title}`,
                state: `by ${channel}`,
                startTimestamp: videoStartUnixTime,
                largeImageKey: 'yotube',
                largeImageText: title,
                instance: false,
            };
        }
        rpc.setActivity(activity);
    }
}

async function closeDiscordRpc() {
    if (rpc) {
        try {
            rpc.removeAllListeners();
            rpc.clearActivity();
            rpc.destroy();
        } catch (e) {
            if (e.message !== 'connection closed') {
            }
        }
        rpc = null;
    }
}

async function main() {
    while (true) {
        try {
            const msg = await readMessage();

            switch (msg.type) {
                case "new_video":
                    title = msg.extraData.title;
                    channel = msg.extraData.channel;

                    sendMessage({ reply: "Received your NEW VIDEO", original: msg });

                    if (!rpc) {
                        rpc = new RPC.Client({ transport: 'ipc' });

                        rpc.on('ready', () => {
                            if (!rpc) {
                                console.warn("Discord RPC was closed before ready event.");
                                return;
                            }

                            sendMessage({ reply: "RPC CONNECTED" });

                            rpc.setActivity({
                                details: `${title}`,
                                state: `by ${channel}`,
                                startTimestamp: Date.now(),
                                largeImageKey: 'yotube',
                                largeImageText: title,
                                instance: false,
                            });
                        });

                        rpc.on('disconnected', () => {
                            console.warn("Discord RPC connection lost. Attempting to reconnect...");
                            sendMessage({ reply: "RPC DISCONNECTED" });
                            rpc = null;
                            setTimeout(() => {
                                main();
                            }, 100);
                        });

                        rpc.login({ clientId }).catch(console.error);
                    } else {
                        videoStartUnixTime = Math.floor(Date.now() / 1000);
                        paused = false;
                        updateDiscordRpc();
                    }
                    break;

                case "video_gone":
                    closeDiscordRpc();
                    sendMessage({ reply: "Cleared Video", original: msg });
                    break;

                case "resume":
                    time = Math.floor(msg.extraData.time);
                    sendMessage({ reply: "Received your PLAY VIDEO", original: msg });
                    videoStartUnixTime = Math.floor(Date.now() / 1000) - time;
                    paused = false;
                    updateDiscordRpc();
                    break;

                case "pause":
                    time = Math.floor(msg.extraData.time);
                    sendMessage({ reply: "Received your STOP VIDEO", original: msg });
                    paused = true;
                    updateDiscordRpc();
                    break;

                case "skip_video":
                    time = Math.floor(msg.extraData.time);
                    videoStartUnixTime = Math.floor(Date.now() / 1000) - time;
                    updateDiscordRpc(time);
                    break;
            }
        } catch (e) {
            console.error(e);
            break;
        }
    }
}

main();
