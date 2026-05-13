import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function LanguageSelector() {
  const { language, setLanguage, supportedLanguages } = useTranslation();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-colors"
        data-testid="language-selector"
      >
        <Globe className="w-3.5 h-3.5" />
        <span className="uppercase">{language}</span>
      </button>
      <div className="absolute right-0 top-full mt-1 bg-zinc-900 border border-zinc-800 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
        {supportedLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center gap-2 transition-colors ${
              language === lang.code
                ? 'bg-amber-500/20 text-amber-500'
                : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
            }`}
            data-testid={`language-${lang.code}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSelector;
