import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import Login from '../components/Auth/Login';
import Setup from '../components/Auth/Setup';
import { useState } from 'react';

export default function LoginPage() {
  const [setupRequired, setSetupRequired] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const response = await authAPI.checkSetupStatus();
      setSetupRequired(response.data.setup_required);
    } catch (error) {
      console.error('Failed to check setup status:', error);
      setSetupRequired(false);
    }
  };

  if (setupRequired === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return setupRequired ? <Setup /> : <Login />;
}
