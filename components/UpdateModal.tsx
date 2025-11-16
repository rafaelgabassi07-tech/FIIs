
import React from 'react';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { CheckCircle, CloudDownload, Info, X } from 'lucide-react';

interface UpdateModalProps {
    onClose: () => void;
}

const UpdateModal: React.FC<UpdateModalProps> = ({ onClose }) => {
    const { isUpdateAvailable, currentVersion, latestVersionInfo, performUpdate } = useUpdateCheck();

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-base-200 rounded-lg shadow-xl w-full max-w-md relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-3 right-3 text-content-200 hover:text-content-100">
                    <X size={24} />
                </button>
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-4 text-content-100">Atualização do App</h2>
                    <div className="space-y-6">
                        <div className="bg-base-300 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-sm text-content-200">Sua Versão Atual</p>
                                <p className="text-xl font-bold text-content-100">{currentVersion}</p>
                            </div>
                            <CheckCircle className="w-10 h-10 text-green-400" />
                        </div>

                        {isUpdateAvailable ? (
                            <div className="bg-base-300 p-4 rounded-lg">
                                <div className="flex items-center mb-3">
                                    <CloudDownload className="w-8 h-8 text-brand-primary mr-3" />
                                    <div>
                                        <h3 className="text-lg font-bold text-content-100">Nova Versão Disponível!</h3>
                                        <p className="text-md font-semibold text-brand-secondary">{latestVersionInfo.version}</p>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h4 className="font-semibold text-content-100 mb-2">O que há de novo:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-content-200 text-sm">
                                        {latestVersionInfo.changelog.map((item, index) => (
                                            <li key={index}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <button
                                    onClick={performUpdate}
                                    className="w-full bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 shadow-lg flex items-center justify-center"
                                >
                                    <CloudDownload size={20} className="mr-2" />
                                    Atualizar Agora
                                </button>
                            </div>
                        ) : (
                            <div className="bg-base-300 p-4 rounded-lg flex items-center">
                                <Info className="w-6 h-6 text-brand-primary mr-3 flex-shrink-0" />
                                <p className="text-content-100">Você já está com a versão mais recente.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateModal;