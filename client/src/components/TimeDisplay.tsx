import React, { useState, useEffect } from 'react';

const TimeDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true);
    
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(timer);
  }, []);
  
  // Function to get time in GMT+6
  const getGMT6Time = (date: Date): Date => {
    // Get UTC time in milliseconds
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    
    // Create new date object for GMT+6 (UTC+6)
    return new Date(utcTime + (3600000 * 6));
  };
  
  // Only render the time on the client
  if (!isClient) {
    return <div className="text-sm"><p>Loading time...</p></div>;
  }
  
  // Get GMT+6 time
  const gmt6Time = getGMT6Time(currentTime);
  
  // Format the time and date
  const timeString = gmt6Time.toLocaleTimeString();
  const dateString = gmt6Time.toLocaleDateString();
  
  return (
    <div className="text-sm">
      <p>Current Time (GMT+6): {timeString}</p>
      <p>Date: {dateString}</p>
    </div>
  );
};

export default TimeDisplay;