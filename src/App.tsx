import UploadList from './components/image-upload/UploadList';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const App = () => {
    const { t } = useTranslation();

    return (
        <div className="flex h-screen flex-col">
            <header className="flex items-center justify-between px-6 py-4">
                <h1 className="font-nanum text-2xl font-semibold text-gray-900 dark:text-white">
                    {t('app.title')}
                </h1>
                <LanguageSwitcher />
            </header>
            <UploadList />
        </div>
    );
};

export default App;
