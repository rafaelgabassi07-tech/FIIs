
import React, { useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { User, Bell, Shield, LogOut, ChevronRight, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import ApiKeyModal from '../components/ApiKeyModal';

const MenuItem: React.FC<{ icon: React.ElementType; text: string; onClick?: () => void; status?: React.ReactNode }> = ({ icon: Icon, text, onClick, status }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors duration-200">
    <div className="flex items-center">
      <Icon className="w-6 h-6 text-brand-primary mr-4" />
      <span className="text-lg text-content-100">{text}</span>
    </div>
    <div className="flex items-center gap-2">
      {status}
      <ChevronRight className="w-5 h-5 text-content-200" />
    </div>
  </button>
);

const ToggleSwitch: React.FC<{ isOn: boolean; onToggle: () => void; }> = ({ isOn, onToggle }) => (
  <button
    role="switch"
    aria-checked={isOn}
    onClick={onToggle}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary ${
      isOn ? 'bg-brand-primary' : 'bg-base-300'
    }`}
  >
    <span
      className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${
        isOn ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const MenuSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-4">
        <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-content-200 uppercase tracking-wider">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);


const MenuScreen: React.FC = () => {
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [isApiModalOpen, setIsApiModalOpen] = useState(false);
    const { apiKey, isLoading } = useSettings();

    const handleNotificationToggle = () => {
        setNotificationsEnabled(prevState => !prevState);
    };
    
    const apiKeyStatus = isLoading ? (
        <span className="text-xs text-content-200">Verificando...</span>
    ) : apiKey ? (
        <span className="flex items-center gap-1 text-xs text-green-400">
            <CheckCircle size={14} /> Configurada
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs text-yellow-400">
            <AlertCircle size={14} /> Necessária
        </span>
    );

    return (
        <>
            <div>
                <ScreenHeader title="Menu" subtitle="Configurações e opções" />
                <div className="p-2">
                    <MenuSection title="Conta">
                        <MenuItem icon={User} text="Meu Perfil" />
                        <MenuItem icon={Shield} text="Segurança" />
                    </MenuSection>

                    <MenuSection title="Configurações">
                         <MenuItem 
                            icon={KeyRound} 
                            text="Chave de API do Gemini" 
                            onClick={() => setIsApiModalOpen(true)}
                            status={apiKeyStatus}
                         />
                    </MenuSection>

                    <MenuSection title="Notificações">
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                            <div className="flex items-center">
                                <Bell className="w-6 h-6 text-brand-primary mr-4" />
                                <span className="text-lg text-content-100">Alertas de Novas Notícias</span>
                            </div>
                            <ToggleSwitch isOn={notificationsEnabled} onToggle={handleNotificationToggle} />
                        </div>
                    </MenuSection>
                    
                    <MenuSection title="Geral">
                        <MenuItem icon={LogOut} text="Sair" />
                    </MenuSection>
                </div>
            </div>
            {isApiModalOpen && <ApiKeyModal onClose={() => setIsApiModalOpen(false)} />}
        </>
    );
};

export default MenuScreen;
