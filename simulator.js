// --- simulator.js ---

// A helper to generate random mock cryptographic hashes
function generateHash() {
    return Math.random().toString(36).substring(2, 10);
}

class Block {
    constructor(height, parentHash, minerId) {
        this.hash = generateHash();
        this.height = height;
        this.parentHash = parentHash;
        this.minerId = minerId;
    }
}

class BlockchainSimulator {
    constructor() {
        this.blocks = {}; // Stores every block by its hash
        
        // Setup Genesis Block
        this.genesis = new Block(0, null, "Genesis");
        this.genesis.hash = "00000000"; 
        this.blocks[this.genesis.hash] = this.genesis;
        
        // This map keeps track of branches (Parent -> Array of Children)
        // It is crucial for visualizing the tree later!
        this.childrenMap = {}; 
        this.childrenMap[this.genesis.hash] = [];
    }

    // Function to add a new block to the network
    mineBlock(parentHash, minerId) {
        const parent = this.blocks[parentHash];
        if (!parent) return null;

        const newBlock = new Block(parent.height + 1, parentHash, minerId);
        this.blocks[newBlock.hash] = newBlock;
        
        // Update the branching map
        if (!this.childrenMap[parentHash]) {
            this.childrenMap[parentHash] = [];
        }
        this.childrenMap[parentHash].push(newBlock);
        this.childrenMap[newBlock.hash] = []; // Give the new block an empty children array

        return newBlock;
    }

    // ==========================================
    // ALGORITHM 1: Nakamoto (Longest Chain)
    // ==========================================
    getNakamotoTip() {
        let maxDepth = -1;
        let deepestBlockHash = this.genesis.hash;

        // Search through every single block to find the highest 'height'
        for (let hash in this.blocks) {
            if (this.blocks[hash].height > maxDepth) {
                maxDepth = this.blocks[hash].height;
                deepestBlockHash = hash;
            }
        }
        return deepestBlockHash;
    }

    // ==========================================
    // ALGORITHM 2: GHOST (Heaviest Subtree)
    // ==========================================
    getGhostTip() {
        let currentHash = this.genesis.hash;

        // Walk down the tree from the Genesis block
        while (true) {
            const children = this.childrenMap[currentHash];
            
            // If we hit a block with no children, we found the tip!
            if (!children || children.length === 0) break; 
            
            // If there is no fork, just move to the only child
            if (children.length === 1) {
                currentHash = children[0].hash;
                continue;
            }

            // FORK DETECTED! Calculate the weight of each branch
            let maxWeight = -1;
            let heaviestChildHash = null;

            for (let child of children) {
                let weight = this.getSubtreeWeight(child.hash);
                if (weight > maxWeight) {
                    maxWeight = weight;
                    heaviestChildHash = child.hash;
                }
            }
            // Move down the heaviest path
            currentHash = heaviestChildHash;
        }

        return currentHash;
    }

    // Helper function for GHOST to count blocks in a branch
    getSubtreeWeight(blockHash) {
        let weight = 1; // Count the block itself
        const children = this.childrenMap[blockHash] || [];
        for (let child of children) {
            weight += this.getSubtreeWeight(child.hash); // Recursively count all descendants
        }
        return weight;
    }
}

// Attach the simulator to the browser window so our UI file can talk to it
window.BlockchainSimulator = BlockchainSimulator;
console.log("Brain loaded: Blockchain logic initialized.");
// ==========================================
// EVALUATION DASHBOARD LOGIC
// ==========================================

const blockTimeSlider = document.getElementById("blockTimeSlider");
const latencySlider = document.getElementById("latencySlider");
const blockTimeVal = document.getElementById("blockTimeVal");
const latencyVal = document.getElementById("latencyVal");

const nakOrphan = document.getElementById("nakOrphan");
const nakSecurity = document.getElementById("nakSecurity");

// The mathematical function to calculate blockchain metrics
function calculateMetrics() {
    let blockTime = parseInt(blockTimeSlider.value);
    let latency = parseInt(latencySlider.value);
    
    // Update Slider UI Text
    blockTimeVal.innerText = blockTime;
    latencyVal.innerText = latency;

    // 1. Calculate Fork Probability (Latency divided by Block Time)
    // The longer it takes to propagate relative to block time, the more forks occur.
    let forkProbability = latency / blockTime;
    
    // 2. Nakamoto Math: Orphans waste hash power
    let nakamotoOrphanRate = Math.min(forkProbability * 100, 85); // Cap at 85% for realism
    
    // If 30% of honest blocks are orphaned, honest power drops, attacker needs less than 51%
    let nakamotoSecurityThreshold = 51.0 - (nakamotoOrphanRate / 2.5); 

    // Update Nakamoto UI
    nakOrphan.innerText = nakamotoOrphanRate.toFixed(1) + "%";
    nakSecurity.innerText = nakamotoSecurityThreshold.toFixed(1) + "%";

    // Add warning colors if Nakamoto becomes insecure
    if (nakamotoSecurityThreshold < 40) {
        nakSecurity.className = "data-value danger-text";
        nakOrphan.className = "data-value danger-text";
    } else {
        nakSecurity.className = "data-value";
        nakOrphan.className = "data-value";
    }
}

// Listen for slider movements
blockTimeSlider.addEventListener("input", calculateMetrics);
latencySlider.addEventListener("input", calculateMetrics);

// Run once on load to set initial values
calculateMetrics();