# 📦 YouTube Discord Rich Presence

A native messaging bridge and extension integration that displays your current YouTube video activity as Discord Rich Presence — including video title, channel name, and playback status — directly in your Discord profile.


| ![Image 1](example1.png) | ![Image 2](example2.png) |
|:---------------------:|:---------------------|


## 📖 Table of Contents

- [Requirements](#️-requirements)
- [Installation](#installation)

## 🛠️ Requirements

- **[Node.js](https://nodejs.org/en)** (v16 or higher recommended)
- **npm** (comes with Node.js)
- **Firefox** (for native messaging extension)
- **Discord** desktop app (for Rich Presence)

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aqusorias/Youtube-Discord-Rich-Presence.git
   cd Youtube-Discord-Rich-Presence
   ```
2. **Run the setup script (Windows only)**
    ```bash
    setup.bat
    ```
    This will:
    - Check for Node.js and npm.
    - Install necessary dependencies.
    - Create the required Windows registry key for native messaging.
    - Generate the native messaging manifest file.
3. **Install the Extension from Firefox Add-ons**
Visit the offical extension page and install it directly: https://addons.mozilla.org/en-US/firefox/addon/youtube-discord-rich-presence/