export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <main style={{ padding: '5rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>404 — Page Not Found</h1>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        The page you’re looking for doesn’t exist or was moved.
      </p>
    </main>
  );
}
