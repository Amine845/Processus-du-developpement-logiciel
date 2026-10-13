import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, PlusCircle, CalendarCheck, User } from 'lucide-react';
import './BottomNav.css';

export const BottomNav: React.FC = () => {
    return (
        <nav className="bottom-nav" aria-label="Navigation principale">
            <NavLink
                to="/recipes"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'is-active' : ''}`}
            >
                <BookOpen size={20} />
                <span>Recettes</span>
            </NavLink>

            <NavLink
                to="/planner"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'is-active' : ''}`}
            >
                <CalendarCheck size={20} />
                <span>Planning</span>
            </NavLink>

            <NavLink
                to="/recipes/new"
                className={({ isActive }) => `bottom-nav-item bottom-nav-item-primary ${isActive ? 'is-active' : ''}`}
            >
                <PlusCircle size={22} />
                <span>Créer</span>
            </NavLink>

            <NavLink
                to="/profile"
                className={({ isActive }) => `bottom-nav-item ${isActive ? 'is-active' : ''}`}
            >
                <User size={20} />
                <span>Profil</span>
            </NavLink>
        </nav>
    );
};