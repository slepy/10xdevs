# Plan implementacji widoku: Szczegóły Oferty

## 1. Przegląd

Celem tego widoku jest szczegółowa prezentacja pojedynczej oferty inwestycyjnej. Użytkownik będzie mógł zapoznać się z pełnym opisem, warunkami finansowymi, statusem oraz powiązanymi obrazami. Dla zalogowanych użytkowników z rolą `Signer` widok ten będzie również punktem wyjścia do procesu inwestycyjnego poprzez dedykowany przycisk akcji.

Zgodnie z implementacją endpointu API (`/api/offers/:offerId`), dostęp do tego widoku jest ograniczony wyłącznie dla zalogowanych użytkowników. Próba dostępu przez osobę niezalogowaną powinna skutkować przekierowaniem do strony logowania.

## 2. Routing widoku

Widok będzie dostępny pod dynamiczną ścieżką, która zawiera identyfikator oferty.

- **Ścieżka:** `/offers/[offerId]`
- **Plik:** `src/pages/offers/[offerId].astro`

## 3. Struktura komponentów

Widok zostanie zaimplementowany jako strona Astro, która będzie renderować komponenty React po stronie serwera (SSR) w celu zapewnienia optymalnej wydajności i SEO.

```text
AuthenticatedLayout (Astro)
└── OfferDetailsPage (React, client:load)
    ├── OfferHeader (React)
    ├── OfferImageGallery (React)
    ├── OfferFinancials (React)
    ├── OfferDescription (React)
    ├── OfferInvestmentCTA (React)
    └── BaseButton (React)
```

## 4. Szczegóły komponentów

### `OfferDetailsPage.tsx` (Komponent główny)

- **Opis komponentu:** Główny kontener widoku, odpowiedzialny za pobranie danych oferty, zarządzanie stanem (ładowanie, błąd, dane) i koordynację podkomponentów.
- **Główne elementy:**
  - Kontener `div` z obsługą stanów ładowania (np. szkielet UI) i błędów (komunikat błędu).
  - Komponenty `OfferHeader`, `OfferImageGallery`, `OfferFinancials`, `OfferDescription`, `OfferInvestmentCTA` renderowane warunkowo po pomyślnym załadowaniu danych.
- **Obsługiwane interakcje:** Brak bezpośrednich interakcji, komponent zarządza przepływem danych.
- **Obsługiwana walidacja:** Sprawdza, czy `offerId` jest dostępne.
- **Typy:** `OfferWithImagesDTO`, `OfferDetailsViewModel`.
- **Propsy:**
  - `offerId: string` - ID oferty pobrane z URL.

### `OfferHeader.tsx`

- **Opis komponentu:** Wyświetla kluczowe, nagłówkowe informacje o ofercie.
- **Główne elementy:**
  - `h1` dla nazwy oferty (`name`).
  - Komponent `Badge` lub podobny do wyświetlenia statusu (`status`).
  - `p` lub `div` na krótki opis lub podtytuł (`short_description`).
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `OfferDetailsViewModel`.
- **Propsy:**
  - `offer: OfferDetailsViewModel` - Obiekt z danymi oferty.

### `OfferImageGallery.tsx`

- **Opis komponentu:** Prezentuje galerię zdjęć powiązanych z ofertą.
- **Główne elementy:**
  - Główny obrazek `img`.
  - Opcjonalna siatka mniejszych miniaturek `img` do przełączania głównego obrazu.
- **Obsługiwane interakcje:** Kliknięcie na miniaturkę zmienia główny obraz.
- **Obsługiwana walidacja:** Renderuje komponent tylko, jeśli `images` nie jest pustą tablicą.
- **Typy:** `OfferDetailsViewModel['images']`.
- **Propsy:**
  - `images: string[]` - Tablica URL-i do obrazów.
  - `offerName: string` - Tekst alternatywny dla obrazów.

### `OfferFinancials.tsx`

- **Opis komponentu:** Wyświetla kluczowe dane finansowe oferty w przejrzystej formie.
- **Główne elementy:**
  - Lista (`dl`, `ul`) lub siatka (`div` z gridem) prezentująca metryki.
  - Elementy listy dla: `target_amount`, `min_investment`, `max_investment`, `funding_goal_achieved_percent`.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `OfferDetailsViewModel`.
- **Propsy:**
  - `offer: OfferDetailsViewModel` - Obiekt z danymi oferty.

### `OfferDescription.tsx`

- **Opis komponentu:** Wyświetla pełny, sformatowany opis oferty.
- **Główne elementy:**
  - `div` lub `article` zawierający `description`.
  - Warto rozważyć użycie biblioteki do parsowania Markdown, jeśli opisy mogą go zawierać.
- **Obsługiwane interakcje:** Brak.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `OfferDetailsViewModel['description']`.
- **Propsy:**
  - `description: string` - Pełny opis oferty.

### `OfferInvestmentCTA.tsx`

- **Opis komponentu:** Komponent "Call to Action", który umożliwia użytkownikowi rozpoczęcie procesu inwestycyjnego.
- **Główne elementy:**
  - Komponent `BaseButton` z etykietą "Inwestuj".
  - Renderowany warunkowo, tylko dla użytkowników z rolą `Signer` i gdy oferta ma status `active`.
- **Obsługiwane interakcje:** Kliknięcie przycisku "Inwestuj" przekierowuje użytkownika do formularza inwestycyjnego (np. `/offers/:offerId/invest`).
- **Obsługiwana walidacja:**
  - Sprawdza rolę użytkownika (musi być `Signer`).
  - Sprawdza status oferty (musi być `active`).
- **Typy:** `UserRole`, `OfferStatus`.
- **Propsy:**
  - `offerId: string`
  - `offerStatus: OfferStatus`
  - `userRole: UserRole`

## 5. Typy

Do implementacji widoku wykorzystane zostaną istniejące typy DTO. Dodatkowo, stworzony zostanie dedykowany `ViewModel` w celu przygotowania danych do wyświetlenia w komponentach.

- **`OfferWithImagesDTO` (istniejący):** Typ danych zwracany bezpośrednio przez API.
  ```typescript
  export interface OfferWithImagesDTO extends Tables<"offers"> {
    images?: string[];
  }
  ```

- **`OfferDetailsViewModel` (nowy):** Typ ten będzie transformacją `OfferWithImagesDTO`. Jego celem jest sformatowanie danych (np. walut, procentów) i przygotowanie ich do bezpośredniego użycia w komponentach, odciążając je z logiki formatującej.

  ```typescript
  export interface OfferDetailsViewModel {
    id: string;
    name: string;
    status: OfferStatus;
    short_description: string;
    description: string;
    images: string[];
    // Sformatowane wartości finansowe
    target_amount: string; // np. "500 000,00 zł"
    min_investment: string; // np. "1 000,00 zł"
    max_investment: string; // np. "50 000,00 zł"
    // Wartości numeryczne do logiki
    funding_goal_achieved_percent: number; // np. 75
  }
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane wewnątrz głównego komponentu `OfferDetailsPage.tsx` przy użyciu standardowych hooków React. Nie ma potrzeby tworzenia globalnego stanu ani złożonych bibliotek.

- **`useState`:**
  - `offer: OfferDetailsViewModel | null` - Przechowuje dane oferty po pobraniu.
  - `isLoading: boolean` - Flaga informująca o stanie ładowania danych z API.
  - `error: string | null` - Przechowuje komunikat błędu w przypadku problemów z API.

- **`useEffect`:**
  - Użyty do jednorazowego wywołania API w momencie montowania komponentu w celu pobrania danych oferty na podstawie `offerId` z propsów.

Nie przewiduje się potrzeby tworzenia customowego hooka, ponieważ logika jest ograniczona do jednego komponentu i jednego wywołania API.

## 7. Integracja API

Integracja z backendem odbędzie się poprzez wywołanie istniejącego endpointu API.

- **Endpoint:** `GET /api/offers/:offerId`
- **Wywołanie:** Użycie `fetch` API wewnątrz `useEffect` w komponencie `OfferDetailsPage.tsx`.
- **Typ odpowiedzi (sukces):** `ApiResponse<OfferWithImagesDTO>`
- **Typ odpowiedzi (błąd):** `ApiResponse` lub `ApiErrorResponse`
- **Obsługa odpowiedzi:**
  - W przypadku sukcesu (status 200), dane z `response.data` zostaną zmapowane na `OfferDetailsViewModel` i zapisane w stanie.
  - W przypadku błędu (status 401, 404, 500), komunikat błędu z `response.error` zostanie zapisany w stanie `error`.

## 8. Interakcje użytkownika

- **Ładowanie strony:** Użytkownik widzi szkielet interfejsu (loading skeleton) podczas pobierania danych.
- **Wyświetlenie danych:** Po załadowaniu, użytkownik widzi pełne szczegóły oferty.
- **Nawigacja po galerii:** Użytkownik może kliknąć na miniaturkę zdjęcia, aby zobaczyć je w powiększeniu.
- **Rozpoczęcie inwestycji:** Użytkownik z rolą `Signer` widzi przycisk "Inwestuj". Kliknięcie go przenosi na stronę formularza inwestycyjnego. Użytkownicy z inną rolą lub gdy oferta nie jest aktywna, nie widzą tego przycisku.

## 9. Warunki i walidacja

- **Dostęp do widoku:** Strona `[offerId].astro` musi weryfikować, czy użytkownik jest zalogowany. W przypadku braku sesji, należy go przekierować na `/login` z parametrem `redirect`.
- **Renderowanie przycisku "Inwestuj" (`OfferInvestmentCTA`):** Przycisk jest widoczny tylko, gdy spełnione są **oba** warunki:
  1. Rola zalogowanego użytkownika to `USER_ROLES.SIGNER`.
  2. Status oferty to `OFFER_STATUSES.ACTIVE`.
- **Renderowanie galerii zdjęć (`OfferImageGallery`):** Komponent powinien być renderowany tylko wtedy, gdy tablica `images` w danych oferty nie jest pusta.

## 10. Obsługa błędów

- **Oferta nie znaleziona (404):** Komponent `OfferDetailsPage` powinien wyświetlić czytelny komunikat, np. "Nie znaleziono takiej oferty" wraz z przyciskiem powrotu do listy ofert.
- **Brak autoryzacji (401/403):** Chociaż strona Astro powinna obsłużyć przekierowanie, komponent na kliencie również powinien być przygotowany na taki scenariusz i np. przekierować na stronę logowania.
- **Błąd serwera (500):** Wyświetlenie generycznego komunikatu o błędzie, np. "Wystąpił błąd serwera. Spróbuj ponownie później."
- **Brak `offerId`:** Jeśli `offerId` nie zostanie przekazane z URL, należy wyświetlić komunikat o błędzie.

## 11. Kroki implementacji

1.  **Utworzenie pliku routingu:** Stwórz plik `src/pages/offers/[offerId].astro`.
2.  **Implementacja logiki w pliku Astro:**
    - Dodaj `export const prerender = false;`.
    - Pobierz `offerId` z `Astro.params`.
    - Zaimplementuj logikę sprawdzania sesji użytkownika (`Astro.locals.user`). Jeśli użytkownik nie jest zalogowany, wykonaj `Astro.redirect('/login')`.
    - Wyrenderuj komponent `AuthenticatedLayout`.
    - Wewnątrz layoutu, wyrenderuj komponent `OfferDetailsPage`, przekazując `offerId` jako prop i dodając dyrektywę `client:load`.
3.  **Stworzenie komponentu `OfferDetailsPage.tsx`:**
    - Zaimplementuj logikę stanu (`useState` dla `offer`, `isLoading`, `error`).
    - Zaimplementuj `useEffect` do pobierania danych z `/api/offers/${offerId}`.
    - Dodaj obsługę stanów ładowania (skeleton) i błędów.
    - Po pomyślnym pobraniu danych, zmapuj `OfferWithImagesDTO` na `OfferDetailsViewModel`.
    - Wyrenderuj podkomponenty, przekazując im odpowiednie fragmenty `OfferDetailsViewModel`.
4.  **Implementacja podkomponentów:**
    - Stwórz komponenty: `OfferHeader`, `OfferImageGallery`, `OfferFinancials`, `OfferDescription`, `OfferInvestmentCTA`.
    - Zaimplementuj każdy z nich zgodnie ze specyfikacją w sekcji 4, dbając o poprawne przyjmowanie propsów i wyświetlanie danych.
5.  **Definicja `OfferDetailsViewModel`:** Dodaj nowy typ `OfferDetailsViewModel` w pliku `src/types.ts` lub w dedykowanym pliku w katalogu komponentu.
6.  **Testowanie:**
    - Napisz testy jednostkowe dla logiki formatującej w `OfferDetailsViewModel`.
    - Napisz testy komponentów dla `OfferInvestmentCTA`, sprawdzając warunki renderowania.
    - Napisz test integracyjny dla `OfferDetailsPage`, mockując API za pomocą MSW i weryfikując renderowanie w stanach ładowania, sukcesu i błędu.
7.  **Stylowanie:** Ostyluj wszystkie komponenty przy użyciu Tailwind CSS, zgodnie z istniejącym design systemem.
