import { getTranslations } from "next-intl/server";

type TranslationFn = (key: string) => string;

export interface ErrorTranslator<K extends string = string> {
  locale?: string;
  fromKey: (key: K) => string;
  generic: () => string;
}

type GetErrorTranslatorOptions = {
  namespace: string;
  fallbackNamespace?: string;
  locale?: string;
  genericKey?: string;
};

function tryTranslate(translate: TranslationFn, key: string): string | null {
  try {
    return translate(key);
  } catch {
    return null;
  }
}

async function loadTranslator(
  namespace: string,
  locale?: string,
): Promise<TranslationFn> {
  return locale
    ? getTranslations({ locale, namespace })
    : getTranslations(namespace);
}

export async function getErrorTranslator<K extends string = string>(
  options: GetErrorTranslatorOptions,
): Promise<ErrorTranslator<K>> {
  const {
    namespace,
    fallbackNamespace = "common.errors",
    locale,
    genericKey = "generic",
  } = options;

  const primary = await loadTranslator(namespace, locale);
  const fallback = await loadTranslator(fallbackNamespace, locale);

  const generic = (): string => {
    return (
      tryTranslate(fallback, genericKey) ??
      tryTranslate(primary, genericKey) ??
      genericKey
    );
  };

  const fromKey = (key: K): string => {
    return (
      tryTranslate(primary, key) ?? tryTranslate(fallback, key) ?? generic()
    );
  };

  return {
    locale,
    fromKey,
    generic,
  };
}
