// --- ui.js (UPGRADED WITH AUTO-RUN, HACKER, AND FINALITY) ---

const sim = new window.BlockchainSimulator();
let isNakamotoMode = true; 

// --- NEW STATE VARIABLES ---
let autoRunInterval = null;
let isAttackerActive = false;

const mineBtn = document.getElementById("mineBtn");
const toggleBtn = document.getElementById("toggleConsensusBtn");
const autoRunBtn = document.getElementById("autoRunBtn");
const hackerBtn = document.getElementById("hackerBtn");
const protocolText = document.getElementById("activeProtocol");
const blockCountText = document.getElementById("blockCount");
const orphanCountText = document.getElementById("orphanCount");

// Setup D3 Canvas
// ==========================================
// Setup D3 Canvas (UPGRADED FOR ZOOM/PAN)
// ==========================================
const width = 860;
const height = 550;

// 1. Select the base SVG and make it look draggable
const baseSvg = d3.select("#blockchain-tree")
    .attr("viewBox", [0, 0, width, height])
    .style("cursor", "grab");

// 2. Add D3 Zoom and Pan behavior
const zoom = d3.zoom()
    .scaleExtent([0.1, 5]) // Allow zooming out to 10% and in to 500%
    .on("zoom", (event) => {
        svgGroup.attr("transform", event.transform);
    });
baseSvg.call(zoom);

// 3. Create the inner group that holds the actual tree
const svgGroup = baseSvg.append("g");

// 4. Center the camera initially (moves the root block to the top middle)
baseSvg.call(zoom.transform, d3.zoomIdentity.translate(width / 2, 50));

// 5. THE MAGIC FIX: Use nodeSize instead of size!
// This forces blocks to ALWAYS stay 60px apart horizontally and 80px apart vertically.
const treeLayout = d3.tree().nodeSize([60, 80]);

// Ensure the rest of your code draws inside the new movable group
const svg = svgGroup; 

// ==========================================
// 1. BUTTON CONTROLS
// ==========================================
// ==========================================
// 1. BUTTON CONTROLS
// ==========================================

toggleBtn.addEventListener("click", () => {
    isNakamotoMode = !isNakamotoMode;
    toggleBtn.innerText = isNakamotoMode ? "Protocol: Nakamoto" : "Protocol: GHOST Protocol";
    protocolText.innerText = isNakamotoMode ? "Nakamoto" : "GHOST Protocol";
    protocolText.className = isNakamotoMode ? "metric-value nakamoto-color" : "metric-value ghost-color";
    updateVisuals(); 
});

mineBtn.addEventListener("click", () => {
    let winningTip = isNakamotoMode ? sim.getNakamotoTip() : sim.getGhostTip();
    sim.mineBlock(winningTip, "Manual_Miner");
    updateVisuals();
});

// UPGRADE 2: Toggle the Hacker
hackerBtn.addEventListener("click", () => {
    isAttackerActive = !isAttackerActive;
    if (isAttackerActive) {
        hackerBtn.innerText = "Hacker Active! (Click to Stop)";
        hackerBtn.className = "action-btn hacker-active";
    } else {
        hackerBtn.innerText = "Spawn 30% Attacker (Red)";
        hackerBtn.className = "action-btn hacker-btn";
    }
});

// UPGRADE 1: The Auto-Run Engine
autoRunBtn.addEventListener("click", () => {
    if (autoRunInterval) {
        // Stop the simulation
        clearInterval(autoRunInterval);
        autoRunInterval = null;
        autoRunBtn.innerText = "▶ Start Auto-Simulation";
        autoRunBtn.className = "action-btn start-btn";
    } else {
        // Start the simulation (Runs every 600 milliseconds)
        autoRunInterval = setInterval(simulateNetworkTick, 600);
        autoRunBtn.innerText = "⏸ Stop Simulation";
        autoRunBtn.className = "action-btn stop-btn";
    }
});

// ==========================================
// 2. THE SIMULATION AI (Chaos Engine)
// ==========================================

// Helper function to find the Hacker's private chain
function findHackerTip() {
    let maxDepth = -1;
    let hTip = null;
    for (let hash in sim.blocks) {
        if (sim.blocks[hash].minerId === "Hacker_Eve" && sim.blocks[hash].height > maxDepth) {
            maxDepth = sim.blocks[hash].height;
            hTip = hash;
        }
    }
    return hTip;
}

function simulateNetworkTick() {
    let rand = Math.random();

    // 30% chance the Hacker finds a block (If active)
    if (isAttackerActive && rand < 0.30) {
        // Hacker Strategy: Always mine on their own longest chain. 
        // If they don't have one, start from the current honest tip.
        let hackerTip = findHackerTip() || sim.getNakamotoTip();
        sim.mineBlock(hackerTip, "Hacker_Eve");
    } 
    // 70% chance Honest Network finds a block
    else {
        let currentTip = isNakamotoMode ? sim.getNakamotoTip() : sim.getGhostTip();
        let targetHash = currentTip;

        // Simulate Network Latency (15% chance they accidentally fork an older block)
        if (Math.random() < 0.15 && sim.blocks[currentTip].parentHash) {
            targetHash = sim.blocks[currentTip].parentHash; 
        }
        
        sim.mineBlock(targetHash, "Honest_Miner");
    }
    updateVisuals();
}

// ==========================================
// 3. VISUALIZATION & FINALITY
// ==========================================

function getWinningChainSet(tipHash) {
    let chain = new Set();
    let curr = sim.blocks[tipHash];
    while (curr) {
        chain.add(curr.hash);
        curr = sim.blocks[curr.parentHash];
    }
    return chain;
}

function buildD3Hierarchy(blockHash) {
    let block = sim.blocks[blockHash];
    let children = sim.childrenMap[blockHash].map(child => buildD3Hierarchy(child.hash));
    return { name: block.hash.substring(0,4), hash: block.hash, children: children.length > 0 ? children : null };
}

function updateVisuals() {
    let winningTip = isNakamotoMode ? sim.getNakamotoTip() : sim.getGhostTip();
    let winningChain = getWinningChainSet(winningTip);
    let tipBlockHeight = sim.blocks[winningTip].height; // Needed for Finality
    
    // Metrics Update
    let totalBlocks = Object.keys(sim.blocks).length;
    blockCountText.innerText = totalBlocks;
    orphanCountText.innerText = totalBlocks - winningChain.size;

    let rootData = buildD3Hierarchy(sim.genesis.hash);
    let rootNode = d3.hierarchy(rootData);
    treeLayout(rootNode);

    // Draw Links
    svg.selectAll(".link").remove(); 
    svg.selectAll(".link")
        .data(rootNode.links())
        .enter().append("path").attr("class", "link")
        .attr("d", d3.linkVertical().x(d => d.x).y(d => d.y))
        .attr("fill", "none")
        .attr("stroke", d => {
            if (winningChain.has(d.source.data.hash) && winningChain.has(d.target.data.hash)) {
                return isNakamotoMode ? "#3b82f6" : "#22c55e"; 
            }
            return "#334155"; // Gray for orphans
        }).attr("stroke-width", 3);

    // Draw Nodes
    svg.selectAll(".node").remove(); 
    let nodes = svg.selectAll(".node")
        .data(rootNode.descendants())
        .enter().append("g").attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    nodes.append("rect")
        .attr("width", 40).attr("height", 40).attr("x", -20).attr("y", -20).attr("rx", 6)
        .attr("fill", d => {
            let b = sim.blocks[d.data.hash];
            
            // UPGRADE 2: If the block belongs to the Hacker, paint it RED
            if (b.minerId === "Hacker_Eve") return "#ef4444"; 
            
            if (winningChain.has(d.data.hash)) {
                // UPGRADE 3: FINALITY CHECK (Gold if 6 blocks deep)
                if (tipBlockHeight - b.height >= 6) return "#eab308"; 
                
                // Otherwise normal active color
                return isNakamotoMode ? "#2563eb" : "#16a34a"; 
            }
            return "#334155"; // Gray for orphans
        })
        .style("cursor", "pointer")
        .on("click", (event, d) => {
            sim.mineBlock(d.data.hash, "Manual_Miner");
            updateVisuals();
        });

    nodes.append("text")
        .attr("dy", 4).attr("text-anchor", "middle").attr("fill", "white")
        .attr("font-size", "10px").attr("font-weight", "bold").style("pointer-events", "none")
        .text(d => d.data.name);
}

// Draw the initial Genesis block
updateVisuals();