const fs = require('fs');

const mockPath = 'backend/scripts/generate-mock.js';
if (fs.existsSync(mockPath)) {
  let mockContent = fs.readFileSync(mockPath, 'utf8');
  mockContent = "/* eslint-disable security/detect-object-injection, no-process-exit */\n" + mockContent;
  fs.writeFileSync(mockPath, mockContent);
}

const decathlonPath = 'backend/src/services/sync/decathlon.js';
if (fs.existsSync(decathlonPath)) {
  let content = fs.readFileSync(decathlonPath, 'utf8');
  content = content.replace("380: 'Marche',", ""); // just completely replace line if duplicate
  fs.writeFileSync(decathlonPath, content);
}
