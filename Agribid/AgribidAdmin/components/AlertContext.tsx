import React, { createContext, useState, useContext, ReactNode } from 'react';
import CustomAlert from './customeAlert';

interface AlertContextProps {
  showAlert: (
    message: string,
    duration: number,
    color?: 'red' | 'green' | 'orange',
    title?: string // Optional title
  ) => void;
}

const AlertContext = createContext<AlertContextProps | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alert, setAlert] = useState<{
    message: string;
    duration: number;
    color: 'red' | 'green' | 'orange';
    title?: string;
  } | null>(null);

  const showAlert = (
    message: string,
    duration: number,
    color: 'red' | 'green' | 'orange' = 'green',
    title?: string
  ) => {
    setAlert({ message, duration, color, title });
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {alert && (
        <CustomAlert
          title={alert.title} // Pass the title to the CustomAlert
          message={alert.message}
          duration={alert.duration}
          color={alert.color} // Pass the color to the alert
          onDismiss={() => setAlert(null)}
        />
      )}
    </AlertContext.Provider>
  );
};
