
import React from 'react';
import { ChevronDown, Plus, Home, Calendar, User, Search } from 'lucide-react'; 
import { Link } from 'react-router-dom'; 

const mockUserData = {
    nome: "Bruno Ribeiro",
    email: "bruno.ribeiro@cm-esposende.pt",
    projetoAtual: "FEIRA DO LIVRO"
};

const StatusButton = ({ status, color }) => (
    <button className={`px-4 py-1.5 text-sm font-semibold rounded-full text-white ${color}`}>
        {status}
    </button>
);

const EventItem = ({ title, date, color }) => (
    <div className={`p-4 mb-3 rounded-lg shadow-md ${color} flex justify-between items-center cursor-pointer`}>
        <div>
            <p className="font-bold text-gray-800">{title}</p>
            <p className="text-sm text-gray-600">Data: {date}</p>
        </div>
        <ChevronDown size={20} className="text-gray-700" />
    </div>
);


const Perfil = () => {
    
    return (
        <div className="container mx-auto p-4 bg-white">
            
            <header className="fixed top-0 left-0 right-0 z-10 bg-blue-900 text-white shadow-lg">
                <div className="container mx-auto flex justify-between items-center p-4">
                    
                    <div className="flex items-center space-x-2">
                        <span className="text-2xl font-extrabold tracking-tight">ESPOSENDE</span>
                        <span className="text-sm">câmara municipal</span>
                    </div>

                    <nav className="flex space-x-6 text-sm font-semibold">
                        <Link to="/requisicao/nova" className="hover:text-yellow-400 flex items-center"><Plus size={16} className="mr-1" /> NOVA REQUISIÇÃO</Link>
                        <Link to="/perfil" className="hover:text-yellow-400 flex items-center"><Home size={16} className="mr-1" /> PÁGINA INICIAL</Link>
                        <Link to="/evento/novo" className="hover:text-yellow-400 flex items-center"><Calendar size={16} className="mr-1" /> NOVO EVENTO</Link>
                    </nav>

                    <div className="flex items-center space-x-4">
                        <Link to="/carrinho" className="hover:text-yellow-400"><Search size={24} /></Link> 
                        <Link to="/perfil" className="hover:text-yellow-400"><User size={24} /></Link>
                    </div>
                </div>
            </header>

            <main className="pt-20 pb-20"> 
                <div className="flex">
                    
                    <div className="w-1/4 p-6 border-r border-gray-200">
                        <div className="flex items-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                                <User size={32} className="text-gray-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold">Olá, {mockUserData.nome}.</h2>
                                <p className="text-sm text-gray-500">{mockUserData.email}</p>
                            </div>
                        </div>
                        <button className="text-sm font-semibold text-gray-700 border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-100">
                            EDITAR DADOS PESSOAIS
                        </button>
                    </div>

                    <div className="w-3/4 p-6">
                        
                        <div className="flex border-b border-gray-300 mb-6">
                            <button className="px-4 py-2 text-blue-900 font-bold border-b-2 border-blue-900">EVENTOS</button>
                            <button className="px-4 py-2 text-gray-500 font-bold hover:text-blue-900">REQUISIÇÕES</button>
                        </div>
                        
                        <div className="flex space-x-3 mb-6">
                            <StatusButton status="TODOS" color="bg-blue-500" />
                            <StatusButton status="APROVADO" color="bg-green-500" />
                            <StatusButton status="PENDENTE" color="bg-yellow-500" />
                            <StatusButton status="AGENDADO" color="bg-purple-500" />
                            <StatusButton status="REJEITADO" color="bg-red-500" />
                        </div>

                        <div className="space-y-4">
                            <EventItem 
                                title="Feira do livro" 
                                date="dd/mm/aaaa - dd/mm/aaaa" 
                                color="bg-green-300" 
                            />
                            <EventItem 
                                title='Concerto "Singing Christmas' 
                                date="dd/mm/aaaa - dd/mm/aaaa" 
                                color="bg-purple-300" 
                            />
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 z-10 bg-blue-900 text-white shadow-lg">
                <div className="container mx-auto flex justify-between items-center p-3 text-sm font-semibold">
                    <span className="text-white">PT | EN</span>
                    <Link to="/explorar" className="bg-yellow-500 text-blue-900 px-4 py-2 rounded-full hover:bg-yellow-400">
                        EXPLORAR MATERIAL
                    </Link>
                    <span className="text-white">
                        ATUALMENTE A TRABALHAR EM: {mockUserData.projetoAtual}
                    </span>
                </div>
            </footer>
        </div>
    );
};

export default Perfil;