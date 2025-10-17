

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { CustomCountry } from '../types';
import { PREDEFINED_COUNTRIES } from '../utils/countryUtils';
import CountryDisplay from './CountryDisplay';
import ChevronDownIcon from './icons/ChevronDownIcon';
import SearchIcon from './icons/SearchIcon';
import PlusIcon from './icons/PlusIcon';
import ImageIcon from './icons/ImageIcon';
import SpinnerIcon from './icons/SpinnerIcon';

type CountryOption = {
  name: string;
  type: 'predefined' | 'custom';
  flagData: {
    type: 'iso' | 'icon' | 'url';
    value: string;
  };
};

interface CountrySelectProps {
  value: string;
  onChange: (countryName: string) => void;
  onCustomChange: (name: string, file: File | null) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, onCustomChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [customCountries, setCustomCountries] = useState<CustomCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCustomCountries = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from('custom_countries').select('*').eq('user_id', user.id);
      if (error) {
        console.error("Error fetching custom countries:", error);
      } else {
        setCustomCountries(data || []);
      }
      setLoading(false);
    };
    fetchCustomCountries();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const allCountries: CountryOption[] = useMemo(() => {
    const predefined: CountryOption[] = PREDEFINED_COUNTRIES.map(c => ({
      name: c.name,
      type: 'predefined',
      flagData: c.code === 'scroll' ? { type: 'icon', value: 'scroll' } : { type: 'iso', value: c.code },
    }));
    const custom: CountryOption[] = customCountries.map(c => ({
      name: c.name,
      type: 'custom',
      flagData: { type: 'url', value: c.flag_url },
    }));
    return [...predefined, ...custom].sort((a, b) => a.name.localeCompare(b.name, 'ru'));
  }, [customCountries]);

  const filteredCountries = useMemo(() => {
    if (!searchTerm) return allCountries;
    return allCountries.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allCountries, searchTerm]);
  
  const selectedCountry = useMemo(() => {
    if (showCustomForm) {
        return {
            name: customName || 'Новая страна...',
            type: 'custom' as const,
            flagData: {
                type: 'url' as const,
                value: customFilePreview || ''
            }
        };
    }
    return allCountries.find(c => c.name === value);
  }, [allCountries, value, showCustomForm, customName, customFilePreview]);

  const handleSelect = (country: CountryOption) => {
    setShowCustomForm(false);
    setCustomName('');
    setCustomFile(null);
    setCustomFilePreview(null);
    onCustomChange('', null);
    onChange(country.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleShowCustomForm = () => {
    setShowCustomForm(true);
    onChange(''); // Clear standard selection
    setIsOpen(false);
  };
  
  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files?.[0]) {
          const file = e.target.files[0];
          setCustomFile(file);
          setCustomFilePreview(URL.createObjectURL(file));
          onCustomChange(customName, file);
      }
  };
  
  const handleCustomNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCustomName(e.target.value);
      onCustomChange(e.target.value, customFile);
  };


  return (
    <div className="relative" ref={containerRef}>
      <label className="text-sm font-medium text-base-content/80">Страна</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-1 w-full flex items-center justify-between px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      >
        <span className="flex items-center gap-2">
            {selectedCountry?.flagData?.type === 'url' && <CountryDisplay countryName={selectedCountry.name} flagUrl={selectedCountry.flagData.value} />}
            {selectedCountry?.flagData?.type !== 'url' && <CountryDisplay countryName={selectedCountry?.name || ''} />}
            {selectedCountry?.name || 'Выберите страну'}
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-base-content/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-base-200 border border-base-300 rounded-lg shadow-lg max-h-60 flex flex-col">
          <div className="p-2 border-b border-base-300">
            <div className="relative">
              <SearchIcon className="w-4 h-4 text-base-content/50 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Поиск страны..."
                className="w-full pl-9 pr-3 py-1.5 bg-base-100 rounded-md text-sm"
              />
            </div>
          </div>
          <ul className="overflow-y-auto flex-1">
            {loading ? (
                <li className="px-3 py-2 text-sm text-center text-base-content/70">Загрузка...</li>
            ) : (
                filteredCountries.map(country => (
                    <li key={country.name} onClick={() => handleSelect(country)} className="px-3 py-2 text-sm hover:bg-base-300 cursor-pointer flex items-center gap-2">
                        {country.flagData.type === 'url' && <CountryDisplay countryName={country.name} flagUrl={country.flagData.value} />}
                        {country.flagData.type !== 'url' && <CountryDisplay countryName={country.name} />}
                        {country.name}
                    </li>
                ))
            )}
             <li onClick={handleShowCustomForm} className="px-3 py-2 text-sm hover:bg-base-300 cursor-pointer flex items-center gap-2 text-primary font-semibold border-t border-base-300">
                <PlusIcon className="w-5 h-5"/>
                Добавить новую страну
            </li>
          </ul>
        </div>
      )}

      {showCustomForm && (
        <div className="mt-2 p-3 bg-base-100 border border-base-300 rounded-lg space-y-3">
             <input
                id="custom_country_name"
                type="text"
                value={customName}
                onChange={handleCustomNameChange}
                placeholder="Введите название страны"
                required
                className="block w-full px-3 py-2 bg-base-200 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary"
            />
            <div className="relative flex items-center justify-center w-full h-24 bg-base-200 border-2 border-dashed border-base-300 rounded-md">
                 {customFilePreview ? (
                    <img src={customFilePreview} alt="Preview" className="h-full w-full object-contain p-1 rounded-md" />
                ) : (
                    <div className="text-center text-base-content/60">
                        <ImageIcon className="w-8 h-8 mx-auto" />
                        <p className="text-xs">Загрузить флаг</p>
                    </div>
                )}
                 <input type="file" onChange={handleCustomFileChange} required accept="image/*" className="absolute h-full w-full opacity-0 cursor-pointer"/>
            </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelect;