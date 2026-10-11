import React from 'react';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="layout-container">
            <header className="app-header">
                <div className="header-content">
                    <h1 className="app-title">Gestionnaire de recettes</h1>
                </div>
            </header>

            <main className="main-content">
                {children}
            </main>
        </div>
    );
};


