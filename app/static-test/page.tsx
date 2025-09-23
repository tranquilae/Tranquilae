export default function StaticTestPage() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Static File Test</h1>
      <p>Testing if static files from /public are being served correctly:</p>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Logo SVG:</h2>
        <img src="/logo.svg" alt="Logo" style={{ height: '60px', border: '1px solid red' }} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test SVG:</h2>
        <img src="/test.svg" alt="Test" style={{ height: '60px', border: '1px solid blue' }} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Favicon SVG:</h2>
        <img src="/favicon.svg" alt="Favicon" style={{ height: '30px', border: '1px solid green' }} />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>JPG Image:</h2>
        <img src="/placeholder-user.jpg" alt="User" style={{ height: '60px', border: '1px solid purple' }} />
      </div>
      
      <div>
        <h2>Direct Links (right-click to test):</h2>
        <ul>
          <li><a href="/logo.svg" target="_blank">Logo SVG</a></li>
          <li><a href="/test.svg" target="_blank">Test SVG</a></li>
          <li><a href="/test.html" target="_blank">Test HTML</a></li>
          <li><a href="/favicon.ico" target="_blank">Favicon ICO</a></li>
        </ul>
      </div>
    </div>
  )
}
