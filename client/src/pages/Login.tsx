import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2 } from 'lucide-react';
import { authApi } from '../services/api';
import { useUserStore } from '../store/userStore';
import toast from 'react-hot-toast';

type Mode = 'login' | 'register' | 'guest';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('guest');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useUserStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let data: any;
      if (mode === 'guest') {
        ({ data } = await authApi.guest({ name: name || 'Anonymous' }));
      } else if (mode === 'register') {
        ({ data } = await authApi.register({ name, email, password }));
      } else {
        ({ data } = await authApi.login({ email, password }));
      }
      setUser(data.user, data.token);
      toast.success('Welcome!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-editor-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Code2 size={40} className="text-blue-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">CollabCode</h1>
        </div>

        <div className="panel p-6">
          <div className="flex rounded-lg overflow-hidden mb-5 border border-editor-border">
            {(['guest', 'login', 'register'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-colors ${
                  mode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {m === 'guest' ? 'Quick Start' : m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {(mode === 'guest' || mode === 'register') && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={mode === 'guest' ? 'Your display name' : 'Full name'}
                className="input"
                required={mode === 'register'}
              />
            )}
            {(mode === 'login' || mode === 'register') && (
              <>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="input"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="input"
                  required
                  minLength={6}
                />
              </>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
              {loading ? 'Please wait...' : mode === 'guest' ? 'Start Coding →' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
