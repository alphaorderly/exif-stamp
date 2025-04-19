import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const LanguageSwitcher: React.FC = () => {
    const { i18n, t } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'ko' : 'en';
        i18n.changeLanguage(newLang);
    };
    return (
        <Button
            onClick={toggleLanguage}
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-xs"
        >
            <Globe className="h-3.5 w-3.5" />
            {i18n.language === 'en' ? t('language.en') : t('language.ko')}
        </Button>
    );
};

export default LanguageSwitcher;
