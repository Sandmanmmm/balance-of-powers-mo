

const path = require('path');

// Read the simulation engine file
const filePath = path.join(__dirname, 'src/hooks/useSimulationEngine.ts');
const content = fs.readFileSync(filePath, 'utf8');

// Check for any unguarded 'resources' references
const lines = content.split('\n');



  // Look for 'resources' not followed by '||' or '?'
  if (line.includes('resources') && 
      !line.includes('resources ||') && 




















}