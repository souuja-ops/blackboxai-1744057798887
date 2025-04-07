export const validateTripForm = (formData) => {
  const errors = {};
  
  if (!formData.pickup?.lat || !formData.pickup?.lng) {
    errors.pickup = 'Valid pickup location is required';
  }
  
  if (!formData.dropoff?.lat || !formData.dropoff?.lng) {
    errors.dropoff = 'Valid dropoff location is required';
  }
  
  if (formData.cycleHours < 0 || formData.cycleHours > 70) {
    errors.cycleHours = 'Cycle hours must be between 0-70';
  }
  
  if (!formData.tripDate) {
    errors.tripDate = 'Trip date is required';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
