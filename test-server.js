const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log('Request for:', req.url);
  
  // Handle root
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head><title>Static File Test</title></head>
        <body>
          <h1>Static File Test Server</h1>
          <p>Testing if files from public folder can be served:</p>
          <div>
            <h2>Logo SVG:</h2>
            <img src="/logo.svg" alt="Logo" style="height: 100px; border: 2px solid red;">
          </div>
          <div>
            <h2>Test SVG:</h2>
            <img src="/test.svg" alt="Test" style="height: 50px; border: 2px solid blue;">
          </div>
          <div>
            <h2>Direct links:</h2>
            <ul>
              <li><a href="/logo.svg">Logo SVG</a></li>
              <li><a href="/test.svg">Test SVG</a></li>
              <li><a href="/favicon.ico">Favicon</a></li>
            </ul>
          </div>
        </body>
      </html>
    `);
    return;
  }
  
  // Serve static files from public folder
  const filePath = path.join(__dirname, 'public', req.url);
  console.log('Looking for file:', filePath);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    
    switch (ext) {
      case '.svg': contentType = 'image/svg+xml'; break;
      case '.jpg': 
      case '.jpeg': contentType = 'image/jpeg'; break;
      case '.png': contentType = 'image/png'; break;
      case '.ico': contentType = 'image/x-icon'; break;
      case '.html': contentType = 'text/html'; break;
    }
    
    const fileContent = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(fileContent);
    console.log('✅ Served:', filePath);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('File not found: ' + filePath);
    console.log('❌ File not found:', filePath);
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 Test server running at http://localhost:${PORT}`);
  console.log('📁 Serving files from public/ folder');
});
