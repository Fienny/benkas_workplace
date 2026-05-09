import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './en'
import ru from './ru'

const saved = localStorage.getItem('lang') || 'en'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setLanguage(lang: 'en' | 'ru') {
  i18n.changeLanguage(lang)
  localStorage.setItem('lang', lang)
}

export default i18n
