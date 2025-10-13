

export type CountryDisplayInfo = {
  type: 'iso';
  code: string;
} | {
  type: 'icon';
} | null;

export const PREDEFINED_COUNTRIES = [
    // Europe
    { name: 'Россия', code: 'ru' },
    { name: 'СССР', code: 'su' },
    { name: 'Германия', code: 'de' },
    { name: 'Пруссия', code: 'scroll' },
    { name: 'Франция', code: 'fr' },
    { name: 'Великобритания', code: 'gb' },
    { name: 'Англия', code: 'gb-eng' },
    { name: 'Шотландия', code: 'gb-sct' },
    { name: 'Уэльс', code: 'gb-wls' },
    { name: 'Северная Ирландия', code: 'gb-nir' },
    { name: 'Италия', code: 'it' },
    { name: 'Испания', code: 'es' },
    { name: 'Португалия', code: 'pt' },
    { name: 'Украина', code: 'ua' },
    { name: 'Беларусь', code: 'by' },
    { name: 'Польша', code: 'pl' },
    { name: 'Чехия', code: 'cz' },
    { name: 'Австрия', code: 'at' },
    { name: 'Австро-Венгрия', code: 'scroll' },
    { name: 'Швейцария', code: 'ch' },
    { name: 'Нидерланды', code: 'nl' },
    { name: 'Бельгия', code: 'be' },
    { name: 'Швеция', code: 'se' },
    { name: 'Норвегия', code: 'no' },
    { name: 'Финляндия', code: 'fi' },
    { name: 'Дания', code: 'dk' },
    { name: 'Греция', code: 'gr' },
    // Americas
    { name: 'США', code: 'us' },
    { name: 'Канада', code: 'ca' },
    { name: 'Мексика', code: 'mx' },
    { name: 'Бразилия', code: 'br' },
    { name: 'Аргентина', code: 'ar' },
    // Asia
    { name: 'Китай', code: 'cn' },
    { name: 'Япония', code: 'jp' },
    { name: 'Индия', code: 'in' },
    { name: 'Южная Корея', code: 'kr' },
    { name: 'Казахстан', code: 'kz' },
    // Africa
    { name: 'Египет', code: 'eg' },
    { name: 'ЮАР', code: 'za' },
    { name: 'Нигерия', code: 'ng' },
    // Oceania
    { name: 'Австралия', code: 'au' },
    { name: 'Новая Зеландия', code: 'nz' },
    // Ancient
    { name: 'Римская империя', code: 'scroll' },
];


// This map now supports either a two-letter ISO code for a flag,
// or the special string 'scroll' for a historical entity icon.
const countryNameToCodeMap: { [key: string]: string } = PREDEFINED_COUNTRIES.reduce((acc, country) => {
    acc[country.name.toLowerCase()] = country.code;
    return acc;
}, {} as { [key: string]: string });

// Add aliases for backward compatibility and convenience
Object.assign(countryNameToCodeMap, {
  'российская федерация': 'ru',
});


export const getCountryDisplayData = (countryName: string): CountryDisplayInfo => {
  if (!countryName) return null;
  const code = countryNameToCodeMap[countryName.toLowerCase()];
  if (!code) return null;

  if (code === 'scroll') {
    return { type: 'icon' };
  }
  return { type: 'iso', code };
};
