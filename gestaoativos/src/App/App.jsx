import React, { useState } from 'react';
import { LogIn, ChevronRight } from 'lucide-react'; 
import EsposendeLogo from '../assets/img/esposende.png';
// Caminho corrigido para a capitalização da pasta Autenticação
import AuthModal from "../Autenticação/AuthModal.jsx"; 
import './App.css'; 


const content = {
    pt: {
        welcomeTitle: "BEM-VINDO AO ..",
        description: "Plataforma de Gestão de Inventário e Eventos, onde a comunidade requisita e controla o stock disponível em tempo real, em regime self-service.",
        buttonText: "ENTRAR NA PLATAFORMA",
        selfService: "self-service"
    },
    en: {
        welcomeTitle: "WELCOME TO ..",
        description: "Inventory and Events Management Platform, where the community requests and controls available stock in real-time, on a self-service basis.",
        buttonText: "ACCESS PLATFORM",
        selfService: "self-service"
    }
};

const App = () => {
    const [language, setLanguage] = useState('pt');
    const currentContent = content[language];
    const [showAuthModal, setShowAuthModal] = useState(false);

    const handleAccessClick = () => {
        setShowAuthModal(true); // Abre o modal
    };

    const handleCloseAuthModal = () => {
        setShowAuthModal(false); // Fecha o modal
    };
    
    return (
        <div className="app-container">
            <header className="app-header py-4 px-8">
                <img 
                    src={EsposendeLogo} 
                    alt="Logotipo da Câmara Municipal de Esposende" 
                    className="app-logo"
                />
            </header>

            {/* O app-main agora usa margens para alinhar o botão */}
            <main className="app-main">
                
                <h1 className="app-h1 text-5xl font-extrabold mb-6">{currentContent.welcomeTitle}</h1>
                
                <p className="app-p text-xl max-w-3xl mb-12">
                    {currentContent.description.split(currentContent.selfService)[0]}
                    <span className="app-self-service font-semibold">{currentContent.selfService}</span>.
                </p>

                {/* Botão embrulhado numa div para centralização horizontal */}
                <div className="button-wrapper"> 
                    <button
                        onClick={handleAccessClick}
                        className="app-button"
                    >
                        <LogIn className="w-6 h-6" /> 
                        <span>{currentContent.buttonText}</span>
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

            </main>

        
            <footer className="app-footer py-4 px-8 mt-auto">
                <div className="text-white text-sm">
                    <span 
                        onClick={() => setLanguage('pt')} 
                        className={`lang-link ${language === 'pt' ? 'active-lang' : ''}`}
                    >
                        PT
                    </span>
                    {' | '}
                    <span 
                        onClick={() => setLanguage('en')} 
                        className={`lang-link ${language === 'en' ? 'active-lang' : ''}`}
                    >
                        EN
                    </span>
                </div>
            </footer>

      
            {showAuthModal && <AuthModal onClose={handleCloseAuthModal} />}
        </div>
    );
};

export default App;