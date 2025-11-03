# Plan implementacji widoku: Lista Ofert

## 1. Przegląd

Celem jest stworzenie widoku `/offers`, który będzie główną stroną dla zalogowanych użytkowników. Widok ten zaprezentuje listę aktywnych ofert inwestycyjnych w formie responsywnej siatki kart. Każda karta będzie zawierać kluczowe informacje o ofercie i umożliwi nawigację do jej szczegółów. Widok będzie również obsługiwał stany ładowania i błędów, zapewniając pozytywne doświadczenie użytkownika.

## 2. Routing widoku

- **Ścieżka:** `/offers`
- **Dostęp:** Widok będzie dostępny tylko dla zalogowanych użytkowników (role `Signer` i `Admin`). Niezalogowani użytkownicy próbujący uzyskać dostęp do tej ścieżki zostaną przekierowani na stronę logowania (`/login`).

## 3. Struktura komponentów

Widok będzie zbudowany w oparciu o architekturę komponentową Astro z wykorzystaniem React do części interaktywnych.

```
/src/pages/offers/index.astro
└── OffersPage.tsx (komponent kliencki React)
    ├── BaseAlert.tsx (komponent UI do wyświetlania błędów)
    ├── OfferCard.tsx (komponent prezentacyjny oferty)
    │   └── BaseButton.tsx (przycisk nawigacyjny)
    └── Pagination.tsx (komponent do obsługi paginacji)
```

## 4. Szczegóły komponentów

### `offers/index.astro`

- **Opis:** Plik strony Astro, który renderuje główny layout i osadza kliencki komponent React `OffersPage`. Odpowiada za ochronę trasy przed niezalogowanymi użytkownikami.
- **Główne elementy:** `AuthenticatedLayout`, `<OffersPage client:load />`.
- **Propsy:** Brak.

### `OffersPage.tsx`

- **Opis:** Główny komponent React odpowiedzialny za pobieranie danych o ofertach, zarządzanie stanem (ładowanie, błędy, dane) i renderowanie listy ofert lub odpowiednich komunikatów.
- **Główne elementy:** `div` jako kontener, `BaseAlert` do wyświetlania błędów, `div` z siatką (`grid`) dla kart ofert, `OfferCard` (mapowanie po danych), `Pagination`.
- **Obsługiwane interakcje:** Zmiana strony w komponencie `Pagination`.
- **Typy:** `OfferDTO`, `PaginationMeta`, `OfferViewModel`.
- **Propsy:** Brak.

### `OfferCard.tsx`

- **Opis:** Komponent prezentacyjny dla pojedynczej oferty inwestycyjnej. Wyświetla kluczowe informacje i umożliwia przejście do szczegółów oferty.
- **Główne elementy:** `article` jako główny kontener, `img` dla obrazka oferty, `h3` dla nazwy, paragrafy (`p`) dla kluczowych danych (kwota docelowa, minimalna inwestycja), `BaseButton` lub `a` do nawigacji.
- **Obsługiwane interakcje:** Kliknięcie karty lub przycisku "Zobacz szczegóły" powoduje nawigację do `/offers/{offer.id}`.
- **Typy:** `OfferViewModel`.
- **Propsy:**
  - `offer: OfferViewModel` - Obiekt zawierający dane oferty do wyświetlenia.

### `Pagination.tsx`

- **Opis:** Komponent UI do nawigacji między stronami listy ofert.
- **Główne elementy:** Przyciski (`button`) "Poprzednia", "Następna" oraz wskaźniki numerów stron.
- **Obsługiwane interakcje:** Kliknięcie na numer strony lub przyciski nawigacyjne.
- **Warunki walidacji:** Przycisk "Poprzednia" jest wyłączony na pierwszej stronie. Przycisk "Następna" jest wyłączony na ostatniej stronie.
- **Typy:** `PaginationMeta`.
- **Propsy:**
  - `pagination: PaginationMeta` - Metadane paginacji z API.
  - `onPageChange: (page: number) => void` - Funkcja zwrotna wywoływana przy zmianie strony.

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy DTO oraz wprowadzony zostanie nowy typ ViewModel.

- **`OfferDTO` (z `src/types.ts`):** Obiekt transferu danych (DTO) bezpośrednio z API.

  ```typescript
  export type OfferDTO = Tables<"offers">;
  ```

- **`OfferViewModel` (nowy typ):** Uproszczony model widoku, zawierający tylko dane niezbędne do wyświetlenia na karcie oferty. Może również zawierać sformatowane dane (np. waluty).

  ```typescript
  export interface OfferViewModel {
    id: string;
    name: string;
    target_amount: string; // Sformatowana kwota
    minimum_investment: string; // Sformatowana kwota
    main_image_url?: string; // Opcjonalny URL obrazka
  }
  ```

- **`PaginationMeta` (z `src/types.ts`):** Typ dla metadanych paginacji.

  ```typescript
  export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem zostanie zrealizowane wewnątrz komponentu `OffersPage.tsx` przy użyciu hooków `useState` i `useEffect` z React. Nie ma potrzeby tworzenia customowego hooka dla tego widoku.

- **`offers: OfferViewModel[]`**: Przechowuje listę ofert do wyświetlenia.
- **`pagination: PaginationMeta | null`**: Przechowuje metadane paginacji.
- **`isLoading: boolean`**: Flaga informująca o stanie ładowania danych z API.
- **`error: string | null`**: Przechowuje komunikat błędu w przypadku niepowodzenia pobierania danych.
- **`currentPage: number`**: Przechowuje aktualny numer strony, kontrolowany przez komponent `Pagination`.

## 7. Integracja API

Integracja z API nastąpi w komponencie `OffersPage.tsx`.

- **Endpoint:** `GET /api/offers/available`
- **Żądanie:** Wywołanie `fetch` z parametrami zapytania `page` i `limit`.

  ```javascript
  // Przykład wywołania
  const response = await fetch(`/api/offers/available?page=${currentPage}&limit=10`);
  ```

- **Typy żądania:** Parametry `page` i `limit` są typu `number`.
- **Odpowiedź:** Oczekiwana odpowiedź to obiekt JSON zgodny z typem `PaginatedResponse<OfferDTO>`.

  ```typescript
  interface PaginatedResponse<OfferDTO> {
    data: OfferDTO[];
    pagination: PaginationMeta;
  }
  ```

- **Logika:**
  1. W `useEffect` (zależny od `currentPage`) wywoływane jest zapytanie do API.
  2. Przed zapytaniem `isLoading` jest ustawiane na `true`.
  3. Po otrzymaniu odpowiedzi dane `OfferDTO` są mapowane na `OfferViewModel`.
  4. Stany `offers` i `pagination` są aktualizowane.
  5. W przypadku błędu, stan `error` jest aktualizowany.
  6. Na końcu `isLoading` jest ustawiane na `false`.

## 8. Interakcje użytkownika

- **Przeglądanie ofert:** Użytkownik scrolluje stronę, aby zobaczyć załadowane oferty.
- **Nawigacja do szczegółów:** Użytkownik klika na kartę oferty lub przycisk "Zobacz szczegóły", co powoduje przekierowanie na stronę `/offers/{offer.id}`.
- **Zmiana strony:** Użytkownik klika na numer strony lub przyciski "Poprzednia"/"Następna" w komponencie `Pagination`, co powoduje ponowne pobranie danych dla wybranej strony.

## 9. Warunki i walidacja

- **Dostęp do widoku:** Strona `offers/index.astro` weryfikuje, czy `Astro.locals.user` istnieje. Jeśli nie, następuje przekierowanie do `/login`.
- **Paginacja:** Komponent `Pagination` deaktywuje przyciski nawigacyjne, gdy użytkownik jest na pierwszej lub ostatniej stronie, na podstawie danych z `pagination.page` i `pagination.totalPages`.

## 10. Obsługa błędów

- **Błąd pobierania danych:** Jeśli zapytanie do API zakończy się niepowodzeniem (np. błąd serwera 500), komponent `OffersPage.tsx` ustawi stan `error` z odpowiednim komunikatem. Komponent `BaseAlert` wyświetli ten błąd użytkownikowi.
- **Brak ofert:** Jeśli API zwróci pustą tablicę ofert, na ekranie zostanie wyświetlony komunikat informujący o braku dostępnych ofert (np. "Obecnie nie ma żadnych aktywnych ofert.").
- **Stan ładowania:** Podczas pobierania danych z API, na ekranie będzie wyświetlany wskaźnik ładowania (np. "spinner" lub szkielet interfejsu - "skeleton"), aby poinformować użytkownika o trwającym procesie.

## 11. Kroki implementacji

1. **Stworzenie plików:** Utwórz pliki `src/pages/offers/index.astro`, `src/components/pages/OffersPage.tsx`, `src/components/OfferCard.tsx` oraz `src/components/Pagination.tsx`.
2. **Ochrona trasy:** W `offers/index.astro` zaimplementuj logikę sprawdzania sesji użytkownika i przekierowania w przypadku jej braku. Osadź komponent `OffersPage` z dyrektywą `client:load`.
3. **Implementacja `OffersPage.tsx`:**
   - Dodaj stany dla `offers`, `pagination`, `isLoading`, `error` i `currentPage`.
   - Zaimplementuj logikę pobierania danych w `useEffect`, w tym obsługę ładowania i błędów.
   - Zaimplementuj mapowanie `OfferDTO` na `OfferViewModel`.
   - Wyrenderuj warunkowo: stan ładowania, komunikat o błędzie, komunikat o braku ofert lub listę ofert.
4. **Implementacja `OfferCard.tsx`:**
   - Stwórz komponent przyjmujący `offer: OfferViewModel` jako prop.
   - Wyświetl dane oferty, używając odpowiednich tagów HTML i stylów Tailwind CSS.
   - Dodaj element `<a>` lub `BaseButton` do nawigacji.
5. **Implementacja `Pagination.tsx`:**
   - Stwórz komponent przyjmujący `pagination` i `onPageChange` jako propsy.
   - Wyrenderuj przyciski i logikę do przełączania stron.
   - Zadbaj o deaktywację przycisków na skrajnych stronach.
6. **Stylowanie:** Użyj Tailwind CSS do ostylowania wszystkich komponentów, zapewniając responsywność i zgodność z designem aplikacji.
7. **Testowanie:**
   - Napisz testy jednostkowe dla `OfferCard.tsx` i `Pagination.tsx`, sprawdzając poprawne renderowanie na podstawie propsów.
   - Napisz test integracyjny dla `OffersPage.tsx`, mockując API za pomocą MSW, aby przetestować pobieranie danych, stany ładowania, błędu i renderowanie listy.
8. **Weryfikacja końcowa:** Sprawdź działanie widoku w przeglądarce, testując wszystkie interakcje, responsywność i obsługę przypadków brzegowych.
