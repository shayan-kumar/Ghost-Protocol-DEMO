# Blockchain Consensus Simulator: GHOST vs. Nakamoto

An interactive, visual simulation built to evaluate the impact of network latency on blockchain security, block propagation, and network performance.

**🌍 [CLICK HERE TO VIEW THE LIVE SIMULATOR](https://shayan-kumar.github.io/Ghost-Protocol-DEMO/)**

## Overview
As distributed networks attempt to scale by reducing block times (increasing TPS), they encounter the physical limits of network latency. High latency causes honest nodes to simultaneously mine conflicting blocks (forks), fracturing the network's hash power and opening the door to 51% attacks. 

This project is an event-driven simulation built in vanilla JavaScript and D3.js that visually compares how two different algorithms handle this chaos:
1. **Nakamoto Consensus (Longest Chain Rule):** Used by Bitcoin. Discards stale blocks (orphans), leading to massive hash power waste and security degradation at high speeds.
2. **GHOST Protocol (Greedy Heaviest Observed Subtree):** Used as the foundation for modern networks like Ethereum. Factors the mathematical weight of orphaned "Uncle" blocks into the canonical chain, aggregating honest hash power and maintaining strict security even at high speeds.

## Core Features
* **Interactive D3.js Visualization:** Watch the blockchain tree grow, branch, and resolve forks in real-time. Features infinite pan and zoom capabilities.
* **Auto-Run Chaos Engine:** Simulates realistic network latency, orphan block generation, and probabilistic mining.
* **The 51% Attack Scenario:** Spawn a malicious node with 30% hash power. Watch it easily outpace the fractured honest network under Nakamoto rules, and watch it instantly get crushed when switching to the GHOST protocol.
* **Block Finality Tracking:** Deep blocks automatically turn gold when they pass the 6-block depth threshold, illustrating cryptographic immutability.
* **Live Comparative Analysis:** A dynamic dashboard that calculates wasted hash power and effective security thresholds based on user-adjustable Block Time and Network Latency sliders.

## Tech Stack
* **Logic / Engine:** Vanilla JavaScript (ES6)
* **Visualization:** D3.js v7
* **UI / Styling:** HTML5, CSS3 (Custom Dark Theme)
* **Deployment:** GitHub Pages
