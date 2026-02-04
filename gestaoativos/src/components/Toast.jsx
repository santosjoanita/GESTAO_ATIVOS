import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 4000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        background: 'white',
        padding: '15px 20px',
        borderRadius: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderLeft: `6px solid ${
            type === 'success' ? '#27ae60' : 
            type === 'error' ? '#e74c3c' : '#f39c12'
        }`,
        animation: 'slideIn 0.3s ease-out',
        minWidth: '300px'
    };

    const icon = type === 'success' ? <CheckCircle color="#27ae60"/> : 
                 type === 'error' ? <XCircle color="#e74c3c"/> : <AlertTriangle color="#f39c12"/>;

    return (
        <div style={styles}>
            {icon}
            <span style={{flex:1, fontSize:'14px', color:'#333', fontWeight:'600'}}>{message}</span>
            <X size={16} style={{cursor:'pointer', color:'#999'}} onClick={onClose}/>
        </div>
    );
};

export default Toast;