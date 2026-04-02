// Simple test to verify text2video functionality
const http = require('http');
const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'test-screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

// Create a simple HTML page with Playwright
const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>OpenCut Text2Video Test</title>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    .result { margin: 20px 0; padding: 10px; border-radius: 5px; }
    .pass { background: #d4edda; border: 1px solid #c3e6cb; }
    .fail { background: #f8d7da; border: 1px solid #f5c6cb; }
    pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>🎬 OpenCut Text2Video 功能测试报告</h1>
  <div id="results"></div>
  <script>
    const results = document.getElementById('results');
    
    // Add test results
    const addResult = (title, status, details) => {
      const div = document.createElement('div');
      div.className = 'result ' + status;
      div.innerHTML = '<h3>' + title + '</h3>' + '<pre>' + details + '</pre>';
      results.appendChild(div);
    };
    
    // Check API endpoints
    async function checkAPI() {
      try {
        const resp = await fetch('http://localhost:3000/api/ai/generate');
        addResult('API 可用性', resp.ok ? '✅ 通过' : '❌ 未找到', 'HTTP ' + resp.status);
      } catch (e) {
        addResult('API 可用性', '❌ 失败', e.message);
      }
    }
    
    checkAPI();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(screenshotsDir, 'test-report.html'), testHTML);
console.log('📄 测试报告已生成：test-screenshots/test-report.html');

// Start a simple test server
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHTML);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(8080, () => {
  console.log('🌐 测试服务器运行在 http://localhost:8080');
});
