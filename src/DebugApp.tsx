export function DebugApp() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: 'white', 
      color: 'black',
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1>Debug App - React is Working!</h1>
      <p>If you can see this, React is mounting correctly.</p>
      <p>Current time: {new Date().toLocaleString()}</p>
    </div>
  );
}
