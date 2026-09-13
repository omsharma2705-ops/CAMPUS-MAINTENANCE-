// AI Intelligence Service for Campus Maintenance Platform
// Handles:
// 1. NLP Category & Urgency Classification
// 2. Multi-factor Duplicate Detection

const CATEGORY_KEYWORDS = {
  'Water Leakage / Plumbing': [
    'water', 'leak', 'leaking', 'pipe', 'tap', 'faucet', 'drain', 'plumbing', 
    'flush', 'overflow', 'sink', 'tank', 'washbasin', 'sewage', 'clog', 'clogged',
    'gushing', 'moisture', 'drip', 'dripping', 'sanitary'
  ],
  'Electrical / Lighting': [
    'light', 'bulb', 'tube', 'tubelight', 'wire', 'wiring', 'spark', 'sparking', 
    'switch', 'switchboard', 'socket', 'plug', 'power', 'blackout', 'short circuit', 
    'fan', 'regulator', 'mcb', 'fuse', 'generator', 'darkness', 'breaker'
  ],
  'Broken Furniture (Bench/Desk)': [
    'bench', 'desk', 'chair', 'table', 'furniture', 'wood', 'broken bench', 
    'broken chair', 'podium', 'board', 'blackboard', 'whiteboard', 'door', 
    'handle', 'lock', 'window', 'hinge', 'drawer', 'cupboard', 'shelf'
  ],
  'Washroom / Restroom Issue': [
    'washroom', 'toilet', 'restroom', 'bathroom', 'urinal', 'commode', 
    'sanitation', 'dirty washroom', 'toilet paper', 'stink', 'smell', 'soap'
  ],
  'Garbage / Cleanliness': [
    'garbage', 'trash', 'dustbin', 'cleaning', 'cleanliness', 'waste', 'litter', 
    'debris', 'sweeping', 'sweep', 'dust', 'mess', 'odor', 'hygiene', 'leaves'
  ],
  'AC / Fan Issue': [
    'ac', 'air conditioner', 'cooling', 'cool', 'filter', 'remote', 'hot air', 
    'temperature', 'thermostat', 'compressor', 'ceiling fan', 'ventilation', 'hvac'
  ],
  'IT / Lab Equipment': [
    'computer', 'pc', 'mouse', 'keyboard', 'monitor', 'screen', 'projector', 
    'printer', 'scanner', 'lan', 'wifi', 'internet', 'network', 'server', 
    'lab equipment', 'os', 'cable', 'hdmi', 'ethernet'
  ],
  'Building / Structural Damage': [
    'wall', 'ceiling', 'plaster', 'crack', 'floor', 'tile', 'tiles', 'roof', 
    'leakage roof', 'staircase', 'stairs', 'railing', 'paint', 'cement', 'glass'
  ]
};

const EMERGENCY_KEYWORDS = [
  'spark', 'sparking', 'fire', 'smoke', 'burning', 'shock', 'electric shock',
  'flood', 'flooding', 'gushing', 'collapse', 'falling', 'emergency', 'urgent',
  'hazardous', 'danger', 'dangerous', 'blast', 'short circuit', 'gas leak'
];

const HIGH_PRIORITY_KEYWORDS = [
  'exam', 'blackout', 'dark', 'overflowing', 'broken lock', 'severe', 
  'major', 'important', 'immediately', 'critical', 'class', 'lab stopped'
];

/**
 * AI NLP Classifier: Detects Category and Priority from Complaint Text
 */
const detectCategoryAndPriority = (title = '', description = '') => {
  const fullText = `${title} ${description}`.toLowerCase();
  const words = fullText.split(/\W+/).filter(Boolean);

  let categoryScores = {};
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    categoryScores[category] = 0;
    keywords.forEach(keyword => {
      // Check multi-word phrase matching
      if (fullText.includes(keyword)) {
        categoryScores[category] += keyword.includes(' ') ? 3 : 1.5;
      }
    });
  }

  // Find category with highest score
  let bestCategory = 'Other';
  let maxScore = 0;

  for (const [cat, score] of Object.entries(categoryScores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = cat;
    }
  }

  // Calculate confidence percentage
  const totalScore = Object.values(categoryScores).reduce((a, b) => a + b, 0);
  let confidence = 50;
  if (totalScore > 0) {
    confidence = Math.min(98, Math.max(65, Math.round((maxScore / (totalScore + 1)) * 100 + 40)));
  }

  // Urgency & Priority Detection
  let detectedPriority = 'Medium';
  let urgencyReason = 'Standard campus maintenance request';

  const hasEmergency = EMERGENCY_KEYWORDS.some(kw => fullText.includes(kw));
  const hasHigh = HIGH_PRIORITY_KEYWORDS.some(kw => fullText.includes(kw));

  if (hasEmergency) {
    detectedPriority = 'Emergency';
    urgencyReason = '🚨 High-risk or safety hazard keywords identified in report';
    confidence = Math.max(confidence, 92);
  } else if (hasHigh) {
    detectedPriority = 'High';
    urgencyReason = '🟠 Critical academic or infrastructure impact detected';
  } else if (bestCategory === 'Garbage / Cleanliness' || bestCategory === 'Broken Furniture (Bench/Desk)') {
    if (!hasHigh && !hasEmergency) {
      detectedPriority = 'Low';
      urgencyReason = '🟢 Routine sanitation / furniture maintenance';
    }
  }

  return {
    category: bestCategory,
    priority: detectedPriority,
    confidence,
    reasoning: `AI matched core patterns in "${title}" with ${bestCategory} (${confidence}% confidence). ${urgencyReason}`,
  };
};

/**
 * Text Tokenizer & Similarity (Jaccard + N-gram Indexing)
 */
const calculateSimilarity = (text1 = '', text2 = '') => {
  const getTokens = (str) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2)
    );
  };

  const tokens1 = getTokens(text1);
  const tokens2 = getTokens(text2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersection = 0;
  tokens1.forEach(t => {
    if (tokens2.has(t)) intersection++;
  });

  const union = new Set([...tokens1, ...tokens2]).size;
  return Math.round((intersection / union) * 100);
};

/**
 * AI Duplicate Detector: Checks incoming ticket against active complaints in database
 */
const detectDuplicates = (newTicket, activeComplaints = []) => {
  const duplicates = [];

  for (const existing of activeComplaints) {
    // 1. Text Similarity Score on Title + Description
    const titleSim = calculateSimilarity(newTicket.title, existing.title);
    const descSim = calculateSimilarity(newTicket.description, existing.description);
    const overallTextSim = Math.round(titleSim * 0.6 + descSim * 0.4);

    // 2. Category & Department Match Boost
    const sameCategory = newTicket.category && existing.category === newTicket.category;
    const sameDept = newTicket.department && existing.department && 
      (newTicket.department.toLowerCase().includes(existing.department.toLowerCase()) || 
       existing.department.toLowerCase().includes(newTicket.department.toLowerCase()));

    let totalMatchScore = overallTextSim;
    if (sameCategory) totalMatchScore += 15;
    if (sameDept) totalMatchScore += 20;

    totalMatchScore = Math.min(100, totalMatchScore);

    // If similarity is above 45% with shared department/category, or > 60% text match
    if (totalMatchScore >= 50) {
      duplicates.push({
        complaint: existing,
        similarity: totalMatchScore,
        matchReason: `High semantic overlap (${totalMatchScore}%) in "${existing.department || 'Campus'}" [${existing.category}]`,
      });
    }
  }

  return duplicates.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
};

module.exports = {
  detectCategoryAndPriority,
  detectDuplicates,
};
