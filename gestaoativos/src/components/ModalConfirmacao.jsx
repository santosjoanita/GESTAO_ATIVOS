import React from 'react';
import { AlertCircle } from 'lucide-react';

const ModalConfirmacao = ({ isOpen, title, message, onConfirm, onCancel, confirmText="Confirmar", confirmColor="#e74c3c" }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(31, 58, 82, 0.6)', display: 'flex', justifyContent: 'center', 
            alignItems: 'center', zIndex: 10000, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: 'white', padding: '30px', borderRadius: '16px',
                width: '90%', maxWidth: '400px', textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}>
                <AlertCircle size={48} color={confirmColor} style={{marginBottom:'15px'}} />
                <h3 style={{margin:'0 0 10px 0', color:'#1f3a52', fontSize:'1.4rem'}}>{title}</h3>
                <p style={{color:'#666', margin:'0 0 25px 0', lineHeight:'1.5'}}>{message}</p>
                
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={onCancel} style={{
                        flex:1, padding:'12px', border:'none', background:'#f1f5f9', 
                        color:'#64748b', borderRadius:'8px', fontWeight:'700', cursor:'pointer'
                    }}>CANCELAR</button>
                    <button onClick={onConfirm} style={{
                        flex:1, padding:'12px', border:'none', background: confirmColor, 
                        color:'white', borderRadius:'8px', fontWeight:'700', cursor:'pointer'
                    }}>{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

export default ModalConfirmacao;