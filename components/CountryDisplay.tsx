

import React from 'react';
import { getCountryDisplayData } from '../utils/countryUtils';
import ScrollIcon from './icons/ScrollIcon';

interface CountryDisplayProps {
    countryName: string;
    className?: string;
    flagUrl?: string | null;
}

const CountryDisplay: React.FC<CountryDisplayProps> = ({ countryName, className, flagUrl }) => {
    const iconContainerClasses = `flex-shrink-0 w-5 h-auto text-base-content/80 flex items-center justify-center ${className || ''}`;

    if (flagUrl) {
        return (
            <div className={iconContainerClasses}>
                <img 
                    src={flagUrl} 
                    alt={`${countryName} flag`} 
                    className="w-5 h-auto max-h-5 object-contain rounded-sm" 
                />
            </div>
        );
    }

    const displayData = getCountryDisplayData(countryName);

    if (!displayData) {
        return null;
    }

    if (displayData.type === 'iso') {
        return (
             <div className={iconContainerClasses}>
                <img 
                    src={`https://flagcdn.com/w20/${displayData.code}.png`} 
                    width="20" 
                    alt={`${countryName} flag`} 
                    className="rounded-sm" 
                />
            </div>
        );
    }

    if (displayData.type === 'icon') {
        return (
            <div className={iconContainerClasses} title="Историческое государство">
                <ScrollIcon className="w-5 h-5" />
            </div>
        );
    }
    
    return null;
};

export default CountryDisplay;
