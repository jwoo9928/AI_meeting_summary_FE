import React, { createContext, useContext } from 'react';

type Theme = 'light'; // Only light mode

interface ThemeContextType {
    theme: Theme;
    // toggleTheme is removed
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme: Theme = 'light';

    // toggleTheme function is removed

    // useMemo for contextValue is removed as theme is static
    const contextValue: ThemeContextType = { theme };

    return (
        <ThemeContext.Provider value={contextValue}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
