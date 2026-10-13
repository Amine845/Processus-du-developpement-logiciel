import React from 'react';
import { BottomNav } from './BottomNav';
import './layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="layout">
            <header className="layout-header">
                <div className="layout-header-inner">
                    <h1 className="app-title">Assiette</h1>
                </div>
            </header>

            <main className="layout-main">
                {children}
            </main>

            <BottomNav />
        </div>
    );
};