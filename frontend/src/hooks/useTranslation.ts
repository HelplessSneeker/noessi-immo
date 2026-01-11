import { useTranslation as useI18nTranslation } from 'react-i18next';
import type { TransactionCategory, DocumentCategory } from '../types';

/**
 * Custom translation hook with helpers for category translations
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  /**
   * Get translated label for transaction category
   */
  const getTransactionCategoryLabel = (category: TransactionCategory): string => {
    return t(`categories.transaction.${category}`);
  };

  /**
   * Get translated label for document category
   */
  const getDocumentCategoryLabel = (category: DocumentCategory): string => {
    return t(`categories.document.${category}`);
  };

  return {
    t,
    i18n,
    getTransactionCategoryLabel,
    getDocumentCategoryLabel,
  };
}
