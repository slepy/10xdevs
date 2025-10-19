# Tech Stack

## Frontend - Astro z React dla komponentów interaktywnych

- **Astro 5:** Pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript.
- **React 19:** Zapewnia interaktywność tam, gdzie jest potrzebna.
- **TypeScript 5:** Umożliwia statyczne typowanie kodu i lepsze wsparcie IDE.
- **Tailwind 4:** Ułatwia stylowanie aplikacji.
- **Shadcn/ui:** Dostarcza bibliotekę dostępnych komponentów React, na których oprzemy UI.

## Testowanie

### Testy jednostkowe i integracyjne

- **Vitest:** Nowoczesny, niezwykle szybki framework do testowania, który doskonale integruje się z Astro (opartym na Vite).
- **React Testing Library:** Narzędzie do testowania komponentów React w sposób, w jaki używają ich użytkownicy.
- **Mock Service Worker (MSW):** Biblioteka do przechwytywania i mockowania zapytań API na poziomie sieci dla testów integracyjnych.
- **@axe-core/react:** Biblioteka do wykrywania problemów z dostępnością zintegrowana z React Testing Library.

### Testy End-to-End

- **Playwright:** Nowoczesne, szybkie i niezawodne narzędzie od Microsoftu do testowania E2E. Oferuje funkcje takie jak auto-waits, nagrywanie testów (Codegen) i testowanie w różnych przeglądarkach. Rekomendowane przez zespół Astro.

## Backend - Supabase jako kompleksowe rozwiązanie backendowe

- Zapewnia bazę danych PostgreSQL.
- Umożliwia korzystanie z SDK w wielu językach w roli Backend-as-a-Service.
- Rozwiązanie open source, które można hostować lokalnie lub na własnym serwerze.
- Posiada wbudowaną autentykację użytkowników.

## AI - Komunikacja z modelami przez usługę Openrouter.ai

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), co pozwala na osiągnięcie wysokiej efektywności przy niskich kosztach.
- Umożliwia ustawianie limitów finansowych na klucze API.

## CI/CD i Hosting

- **Github Actions:** Służy do tworzenia pipeline’ów CI/CD.
- **DigitalOcean:** Hostuje aplikację za pośrednictwem obrazu docker.
