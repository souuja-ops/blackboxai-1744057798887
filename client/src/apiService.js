const API_BASE_URL = 'http://localhost:8000/api';

export const calculateRoute = async (tripData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/route/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        start: {
          lat: tripData.pickup.lat,
          lng: tripData.pickup.lng
        },
        end: {
          lat: tripData.dropoff.lat,
          lng: tripData.dropoff.lng
        },
        cycle_hours: tripData.cycleHours
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Route calculation failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const generateLogs = async (tripId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/logs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trip_id: tripId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Log generation failed');
    }

    // Handle PDF response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eld_logs_trip_${tripId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
