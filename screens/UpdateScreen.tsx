
import React from 'react';
import ScreenHeader from '../components/ScreenHeader';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { CheckCircle, CloudDownload, Info } from 'lucide-react';

const UpdateScreen: React.FC = () => {
    const { isUpdateAvailable, currentVersion, latestVersionInfo, performUpdate } = useUpdateCheck();

    return (
        <div>
            <ScreenHeader title="Atualização" subtitle="Gerencie a versão do seu app" />
            <div className="p-4 space-y-6">
                <div className="bg-base-200 p-4 rounded-lg shadow-md flex justify-between items-center">
                    <div>
                        <p className="text-sm text-content-200">Versão Atual</p>
                        <p className="text-xl font-bold text-content-100">{currentVersion}</p>
                    </div>
                    <CheckCircle className="w-10 h-10 text-green-400" />
                </div>

                {isUpdateAvailable ? (
                    <div className="bg-base-200 p-4 rounded-lg shadow-md animate-fade-in-up">
                        <div className="flex items-center mb-3">
                            <CloudDownload className="w-8 h-8 text-brand-primary mr-3" />
                            <div>
                                <h3 className="text-xl font-bold text-content-100">Nova Versão Disponível!</h3>
                                <p className="text-lg font-semibold text-brand-secondary">{latestVersionInfo.version}</p>
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
                    <div className="bg-base-200 p-4 rounded-lg shadow-md flex items-center">
                        <Info className="w-6 h-6 text-brand-primary mr-3 flex-shrink-0" />
                        <p className="text-content-100">Você já está com a versão mais recente do aplicativo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UpdateScreen;
