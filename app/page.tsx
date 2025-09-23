export default function HomePage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>Tranquilae - Working!</h1>
      <p>This is the homepage</p>
      <div>
        <h2>Navigation:</h2>
        <ul>
          <li><a href="/simple-test">Simple Test Page</a></li>
          <li><a href="/static-test">Static Test Page</a></li>
          <li><a href="/dashboard">Dashboard</a></li>
        </ul>
      </div>
      <div>
        <h2>Logo Test:</h2>
        <img src="/logo.svg" alt="Logo" style={{ height: '50px' }} />
      </div>
    </div>
  )
}
