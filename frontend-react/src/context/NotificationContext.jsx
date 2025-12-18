import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    const showNotification = useCallback((message, type = 'info', title = '') => {
        const id = Date.now();
        let displayTitle = title;

        if (!displayTitle) {
            if (type === 'success') displayTitle = 'Success';
            else if (type === 'error') displayTitle = 'Error';
            else if (type === 'warning') displayTitle = 'Warning';
            else displayTitle = 'Info';
        }

        setNotifications(prev => [...prev, { id, message, type, title: displayTitle }]);

        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000); // 5 seconds to match original
    }, []);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            <div id="notification-container">
                {notifications.map(n => (
                    <div key={n.id} className={`notification-toast ${n.type}`}>
                        <i className={`fas notification-icon ${n.type === 'success' ? 'fa-check-circle' :
                                n.type === 'error' ? 'fa-exclamation-circle' :
                                    n.type === 'warning' ? 'fa-exclamation-triangle' :
                                        'fa-info-circle'
                            }`}></i>
                        <div className="notification-content">
                            <div className="notification-title">{n.title}</div>
                            <div className="notification-message">{n.message}</div>
                        </div>
                        <button
                            className="notification-close"
                            onClick={() => setNotifications(prev => prev.filter(nx => nx.id !== n.id))}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);
