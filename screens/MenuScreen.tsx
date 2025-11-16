import React, { useState } from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { User, Bell, Shield, LogOut, ChevronRight, KeyRound, CheckCircle, AlertCircle, Download, Upload, CloudDownload, Info } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import ApiKeyModal from '../components/ApiKeyModal';
import { TRANSACTIONS_STORAGE_KEY } from '../constants';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import UpdateModal from '../components/UpdateModal';

const MenuItem: React.FC<{ icon: React.ElementType; text: string; onClick?: () => void; status?: React.ReactNode; disabled?: boolean; }> = ({ icon: Icon, text, onClick, status, disabled = false }) => (
  <button onClick={onClick} disabled={disabled} className={`w-full flex items-center justify-between p-4 bg-base-200 rounded-lg transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-base-300'}`}>
    <div className="flex items-center">
      <Icon className="w-6 h-6 text-brand-primary mr-4" />
      <span className="text-lg text-content-100">{text}</span>
    </div>
    <div className="flex items-center gap-2">
      {disabled ? <span className="text-xs text-content-200">Em breve</span> : status}
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
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const { apiKey, isLoading } = useSettings();
    const { isUpdateAvailable } = useUpdateCheck();

    const handleNotificationToggle = () => {
        setNotificationsEnabled(prevState => !prevState);
    };

    const handleExport = () => {
        try {
            const transactions = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
            if (!transactions || JSON.parse(transactions).length === 0) {
                alert("Nenhuma transação para exportar.");
                return;
            }
            const blob = new Blob([transactions], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `meu-fii-app-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao exportar dados:", error);
            alert("Ocorreu um erro ao exportar seus dados.");
        }
    };
    
    const handleImport = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;
    
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text !== 'string') throw new Error("File content is not text.");
                    
                    const data = JSON.parse(text);
                    if (!Array.isArray(data) || (data.length > 0 && (typeof data[0].id === 'undefined' || typeof data[0].ticker === 'undefined'))) {
                         throw new Error("Formato de arquivo inválido.");
                    }
    
                    if (window.confirm("Atenção: Isso substituirá todas as suas transações atuais pelos dados do arquivo. Deseja continuar?")) {
                        localStorage.setItem(TRANSACTIONS_STORAGE_KEY, text);
                        alert("Dados importados com sucesso! O aplicativo será recarregado para aplicar as mudanças.");
                        window.location.reload();
                    }
                } catch (error) {
                    console.error("Erro ao importar dados:", error);
                    alert(`Ocorreu um erro ao importar o arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                }
            };
            reader.readAsText(file);
        };
        input.click();
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

    const updateStatus = isUpdateAvailable ? (
        <span className="flex items-center gap-1 text-xs text-blue-400">
            <Info size={14} /> Nova versão
        </span>
    ) : (
        <span className="flex items-center gap-1 text-xs text-content-200">
            <CheckCircle size={14} /> Atualizado
        </span>
    );

    return (
        <>
            <div>
                <ScreenHeader title="Menu" subtitle="Configurações e opções" />
                <div className="p-2">
                    <MenuSection title="Conta">
                        <MenuItem icon={User} text="Meu Perfil" disabled />
                        <MenuItem icon={Shield} text="Segurança" disabled />
                    </MenuSection>

                    <MenuSection title="Configurações">
                         <MenuItem 
                            icon={KeyRound} 
                            text="Chave de API do Gemini" 
                            onClick={() => setIsApiModalOpen(true)}
                            status={apiKeyStatus}
                         />
                         <MenuItem 
                            icon={CloudDownload} 
                            text="Verificar Atualização" 
                            onClick={() => setIsUpdateModalOpen(true)}
                            status={updateStatus}
                         />
                    </MenuSection>

                    <MenuSection title="Gerenciamento de Dados">
                        <MenuItem icon={Download} text="Exportar Dados" onClick={handleExport} />
                        <MenuItem icon={Upload} text="Importar Dados" onClick={handleImport} />
                    </MenuSection>
                    
                    <MenuSection title="Geral">
                        <MenuItem icon={LogOut} text="Sair" disabled />
                    </MenuSection>
                </div>
            </div>
            {isApiModalOpen && <ApiKeyModal onClose={() => setIsApiModalOpen(false)} />}
            {isUpdateModalOpen && <UpdateModal onClose={() => setIsUpdateModalOpen(false)} />}
        </>
    );
};

export default MenuScreen;