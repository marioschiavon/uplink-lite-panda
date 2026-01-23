import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const languages = [
  { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  
  const currentLang = i18n.language.startsWith('pt') ? 'pt-BR' : 'en';
  
  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
  };

  return (
    <Select value={currentLang} onValueChange={handleChange}>
      <SelectTrigger className="w-auto gap-2 border-border/50 bg-transparent hover:bg-muted/50">
        <Globe className="h-4 w-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default LanguageSelector;
