import { useState, useEffect } from 'react';
import apiClient from '../lib/api';

export const useLocation = () => {
  const [location, setLocation] = useState({
    country: 'IN',
    currency: 'INR',
    detected: false,
    loading: true
  });

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await apiClient.get('/users/location');
        setLocation({
          ...response.data,
          loading: false
        });

        // Auto-update user's location if detected
        if (response.data.detected) {
          await apiClient.post('/users/update-location', {
            country: response.data.country
          });
        }
      } catch (error) {
        console.error('Error detecting location:', error);
        setLocation(prev => ({ ...prev, loading: false }));
      }
    };

    detectLocation();
  }, []);

  const updateLocation = async (country) => {
    try {
      const response = await apiClient.post('/users/update-location', { country });
      setLocation({
        country: response.data.country,
        currency: response.data.currency,
        detected: true,
        loading: false
      });
      return true;
    } catch (error) {
      console.error('Error updating location:', error);
      return false;
    }
  };

  return { location, updateLocation };
};
