# HouseRules

A web-based social party game platform for friend groups to play and customize classic games like fishbowl and charades — no physical supplies needed.

Built for INFO Capstone by Girleez @ CU Boulder.

## 🔗 Live Site
[https://kfischer93.github.io/HouseRules](https://kfischer93.github.io/HouseRules)

## 🎮 How to Play
1. One person hits **host a game** and picks a game or enters custom words
2. Hit **start game + open lobby** — Playroom will generate a QR code / room link
3. Everyone else hits **join a game** or scans the QR code
4. Host hits **Launch** and the game starts!
5. Host controls the cards — hit **got it** or **skip** to move through words
6. All players see the current word update in real time on their device

## ✨ Features
- Fishbowl and charades pre-loaded with CU Boulder / Colorado themed words
- Custom word builder — type any words separated by commas
- Real-time multiplayer via Playroom (no account needed)
- Mobile friendly

## 🛠️ Built With
- HTML, CSS, JavaScript
- [Playroom](https://joinplayroom.com/) for multiplayer
- Google Fonts: Baloo Bhai 2 + Sarala
- Hosted on GitHub Pages

## 🚧 Known Issues
- Cannot exit the Playroom lobby without refreshing the browser — fix in progress

## 📁 File Structure
```
HouseRules/
├── index.html    — all screens and layout
├── style.css     — brand styles, colors, animations
└── script.js     — game logic and Playroom integration
```

## 🗺️ Roadmap
- [ ] Fix lobby cancel button
- [ ] Add more pre-loaded game templates
- [ ] Timer feature per word
- [ ] Score tracking across rounds
- [ ] Mobile layout polish