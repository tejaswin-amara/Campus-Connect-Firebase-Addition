import { render, screen, act } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from '../hooks/useAuth';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Firebase SDKs for decoupled testing
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
  })),
  onAuthStateChanged: vi.fn((_, callback) => {
    setTimeout(() => callback(null), 0);
    return vi.fn(); // return unsubscribe mock
  }),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithPopup: vi.fn(() => Promise.resolve()),
  GoogleAuthProvider: vi.fn(),
  connectAuthEmulator: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  connectFirestoreEmulator: vi.fn(),
  enableIndexedDbPersistence: vi.fn(() => Promise.resolve()),
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(),
  connectStorageEmulator: vi.fn(),
}));

// A test component to consume the hook
function TestComponent() {
  const { user, isLoading, login, logout } = useAuth();
  if (isLoading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'Guest'}</div>
      <button data-testid="login-btn" onClick={() => login({ id: '1', username: 'john_doe', role: 'STUDENT' })}>Login</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
    </div>
  );
}

describe('AuthContext Integration', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('provides authentication state and actions', async () => {
    // Mock the global fetch for active session check auth endpoint
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: false,
      } as Response)
    );
    globalThis.fetch = fetchMock;

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state is loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for the auth check effect to complete
    const userElement = await screen.findByTestId('user');
    expect(userElement).toBeInTheDocument();
    expect(userElement.textContent).toBe('Guest');

    // Perform Login
    const loginButton = screen.getByTestId('login-btn');
    await act(async () => {
      loginButton.click();
    });

    expect(screen.getByTestId('user').textContent).toBe('john_doe');

    // Perform Logout
    // Mock logout API call
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
      } as Response)
    );
    const logoutButton = screen.getByTestId('logout-btn');
    await act(async () => {
      logoutButton.click();
    });

    expect(screen.getByTestId('user').textContent).toBe('Guest');
  });
});
