export default function SimpleTest() {
  return (
    <div>
      <h1>Simple Test Page</h1>
      <p>If you can see this, Next.js is working!</p>
      <hr />
      <h2>Image Tests:</h2>
      <div>
        <h3>Logo SVG (regular img tag):</h3>
        <img src="/logo.svg" alt="Logo" width="200" />
      </div>
      <div>
        <h3>Test SVG:</h3>
        <img src="/test.svg" alt="Test" width="100" />
      </div>
      <div>
        <h3>Direct links:</h3>
        <ul>
          <li><a href="/logo.svg">Logo SVG</a></li>
          <li><a href="/test.svg">Test SVG</a></li>
          <li><a href="/favicon.ico">Favicon</a></li>
        </ul>
      </div>
    </div>
  )
}
