# Plan implementacji widoku "Moje Inwestycje"

## 1. Przegląd

Widok "Moje Inwestycje" ma na celu umożliwienie zalogowanym użytkownikom (o roli `Signer`) przeglądanie, filtrowanie i śledzenie statusu wszystkich swoich inwestycji. Użytkownicy będą mogli zobaczyć kluczowe informacje o każdej inwestycji, filtrować listę według statusu oraz nawigować między stronami wyników. Widok będzie również obsługiwał stany ładowania, braku wyników oraz błędów, zapewniając płynne i intuicyjne doświadczenie użytkownika.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/investments`. Dostęp do tej ścieżki powinien być chroniony i wymagać uwierzytelnienia użytkownika z rolą `Signer`. Niezalogowani użytkownicy próbujący uzyskać dostęp do tego adresu URL zostaną przekierowani na stronę logowania.

## 3. Struktura komponentów

Widok zostanie zaimplementowany jako strona Astro (`src/pages/investments/index.astro`), która będzie renderować główny komponent React (`InvestmentsView.tsx`) odpowiedzialny za interaktywność i zarządzanie stanem.

```bash
/src/pages/investments/index.astro
└── /src/components/investments/InvestmentsView.tsx
    ├── /src/components/investments/InvestmentsFilter.tsx
    ├── /src/components/investments/InvestmentsTable.tsx
    │   ├── /src/components/investments/InvestmentRow.tsx
    │   │   └── /src/components/ui/Badge.tsx (StatusBadge)
    │   └── /src/components/investments/TableSkeleton.tsx
    ├── /src/components/Pagination.tsx
    └── /src/components/admin/EmptyState.tsx
```

## 4. Szczegóły komponentów

### InvestmentsView.tsx

- **Opis komponentu:** Główny komponent-kontener, który zarządza stanem całego widoku, pobiera dane z API i koordynuje pracę komponentów podrzędnych.
- **Główne elementy:** `div` jako kontener dla filtrów, tabeli i paginacji. Renderuje warunkowo `TableSkeleton`, `EmptyState` lub `InvestmentsTable` w zależności od stanu ładowania i dostępności danych.
- **Obsługiwane interakcje:** Brak bezpośrednich.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `InvestmentViewModel`, `InvestmentStatus`, `PaginatedResponse<InvestmentViewModel>`.
- **Propsy:** Brak.

### InvestmentsFilter.tsx

- **Opis komponentu:** Formularz z jednym polem `select` pozwalającym użytkownikowi na filtrowanie inwestycji według statusu.
- **Główne elementy:** `form`, `label`, `Select` (komponent z `Shadcn/ui`).
- **Obsługiwane interakcje:** Zmiana wartości w polu `select` (`onValueChange`).
- **Obsługiwana walidacja:** Brak.
- **Typy:** `InvestmentStatus`.
- **Propsy:**
    - `currentStatus: InvestmentStatus | "all"`
    - `onStatusChange: (status: InvestmentStatus | "all") => void`
    - `disabled: boolean`

### InvestmentsTable.tsx

- **Opis komponentu:** Tabela wyświetlająca listę inwestycji użytkownika.
- **Główne elementy:** `Table`, `TableHeader`, `TableBody` (komponenty z `Shadcn/ui`). Mapuje listę inwestycji na komponenty `InvestmentRow`.
- **Obsługiwane interakcje:** Kliknięcie wiersza w celu nawigacji do szczegółów inwestycji.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `InvestmentViewModel`.
- **Propsy:**
    - `investments: InvestmentViewModel[]`
    - `onRowClick: (investmentId: string) => void`

### InvestmentRow.tsx

- **Opis komponentu:** Pojedynczy, klikalny wiersz w tabeli inwestycji.
- **Główne elementy:** `TableRow`, `TableCell` (komponenty z `Shadcn/ui`). Wyświetla dane pojedynczej inwestycji i komponent `Badge` do pokazania statusu.
- **Obsługiwane interakcje:** `onClick` na elemencie `TableRow`.
- **Obsługiwana walidacja:** Brak.
- **Typy:** `InvestmentViewModel`.
- **Propsy:**
    - `investment: InvestmentViewModel`
    - `onClick: (investmentId: string) => void`

## 5. Typy

Do implementacji widoku, oprócz istniejących typów DTO (`InvestmentDTO`, `PaginatedResponse`, `PaginationMeta`), potrzebny będzie dedykowany `ViewModel` oraz typ rozszerzający DTO.

```typescript
// Ten typ powinien zostać dodany w src/types.ts
/**
 * Extended investment data with offer details
 * Used for detailed investment views
 */
export interface InvestmentWithOfferDTO extends InvestmentDTO {
  offers: {
    name: string;
  } | null;
}

// Ten typ będzie używany wewnętrznie w komponencie
/**
 * ViewModel for a single investment in the "My Investments" view
 * Contains formatted data ready for display in the UI.
 */
export interface InvestmentViewModel {
  id: string;
  offerName: string; // Nazwa oferty, pobrana z dołączonego obiektu
  amount: string; // Sformatowana kwota, np. "10 000,00 zł"
  status: InvestmentStatus;
  submissionDate: string; // Sformatowana data, np. "31.10.2025"
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany lokalnie w komponencie `InvestmentsView.tsx` przy użyciu hooków `useState` i `useEffect`. Logika pobierania danych zostanie zhermetyzowana wewnątrz `useEffect`.

- `data (PaginatedResponse<InvestmentViewModel> | null)`: Przechowuje pobrane i zmapowane dane inwestycji.
- `status ('idle' | 'loading' | 'success' | 'error')`: Przechowuje aktualny stan cyklu życia żądania.
- `queryParams (InvestmentQueryParams)`: Przechowuje aktualne parametry zapytania (`page`, `limit`, `status`). Zmiana tego stanu wyzwala ponowne pobranie danych.

## 7. Integracja API

Integracja z API będzie realizowana wewnątrz komponentu `InvestmentsView.tsx` z użyciem `fetch` API.

- **Endpoint:** `GET /api/investments/investor`
- **Typy żądania:** Parametry zapytania będą serializowane z obiektu `queryParams` i dołączane do URL.
    - `page: number`
    - `limit: number`
    - `status?: InvestmentStatus` (parametr opcjonalny)
- **Typy odpowiedzi:** Oczekiwana odpowiedź to `PaginatedResponse<InvestmentWithOfferDTO>`. Odpowiedź ta musi zostać zmapowana na `PaginatedResponse<InvestmentViewModel>` (formatowanie kwot i dat, wyciąganie nazwy oferty) przed ustawieniem stanu.

## 8. Interakcje użytkownika

- **Filtrowanie listy:** Użytkownik wybiera status z listy rozwijanej w `InvestmentsFilter`. Wywołuje to `onStatusChange`, co aktualizuje `queryParams` w `InvestmentsView`, resetuje stronę do `1` i wyzwala ponowne pobranie danych.
- **Zmiana strony:** Użytkownik klika na numer strony w komponencie `Pagination`. Wywołuje to `onPageChange`, co aktualizuje `queryParams` i pobiera dane dla nowej strony.
- **Przejście do szczegółów:** Użytkownik klika wiersz w tabeli `InvestmentsTable`. Wywołuje to `onRowClick`, które używa `window.location.href` do nawigacji do strony szczegółów inwestycji (np. `/investments/[id]`).

## 9. Warunki i walidacja

- **Dostęp do widoku:** Chroniony przez middleware Astro, który sprawdza, czy `locals.user` istnieje i ma rolę `Signer`.
- **Interfejs użytkownika:**
    - Przyciski paginacji i filtr są wyłączone (`disabled`) podczas ładowania danych (`status === 'loading'`).
    - Jeśli po załadowaniu `data.data` jest puste, wyświetlany jest komponent `EmptyState`.
    - Jeśli `status` to `'loading'`, wyświetlany jest `TableSkeleton`.
    - Jeśli `status` to `'error'`, wyświetlany jest komunikat o błędzie.

## 10. Obsługa błędów

- **Błąd sieci/API:** Jeśli wywołanie `fetch` zakończy się niepowodzeniem lub API zwróci status błędu (np. 500), stan `status` zostanie ustawiony na `'error'`. Komponent `InvestmentsView` wyświetli wtedy globalny komunikat o błędzie (np. `BaseAlert`) z informacją "Nie udało się pobrać inwestycji. Spróbuj ponownie później."
- **Brak autoryzacji (401):** Middleware Astro powinno automatycznie przekierować na stronę logowania. Jeśli sesja wygaśnie w trakcie, błąd 401 z `fetch` powinien również skutkować programowym przekierowaniem na stronę logowania.
- **Brak uprawnień (403):** Middleware Astro powinno przekierować na stronę `unauthorized`.

## 11. Kroki implementacji

1. **Aktualizacja Backendu:** Zmodyfikuj `InvestmentsService.getUserInvestments`, aby dołączał dane oferty (`offers(name)`) do każdego rekordu. Zaktualizuj typ w `src/types.ts` o `InvestmentWithOfferDTO`.
2. **Struktura plików:** Utwórz plik strony `src/pages/investments/index.astro` oraz pliki dla komponentów React w `src/components/investments/`.
3. **Typy Frontendowe:** Zdefiniuj `InvestmentViewModel` w pliku komponentu `InvestmentsView.tsx`.
4. **Komponent `InvestmentsView`:** Zaimplementuj główny komponent z logiką zarządzania stanem (`useState`, `useEffect`) i pobieraniem danych. Dodaj mapowanie z `InvestmentWithOfferDTO` na `InvestmentViewModel`.
5. **Komponenty podrzędne:** Stwórz komponenty `InvestmentsFilter`, `InvestmentsTable`, `InvestmentRow` i `TableSkeleton`, przekazując do nich odpowiednie propsy.
6. **Stany UI:** Zaimplementuj warunkowe renderowanie dla stanów ładowania (`TableSkeleton`), braku danych (`EmptyState`) i błędów (`BaseAlert`).
7. **Routing i nawigacja:** Skonfiguruj `index.astro` do renderowania `InvestmentsView`. Dodaj link "Moje Inwestycje" w `Navigation.astro` dla zalogowanych użytkowników. Zaimplementuj nawigację do szczegółów po kliknięciu wiersza.
8. **Stylowanie:** Użyj komponentów `Shadcn/ui` (`Table`, `Select`, `Pagination`, `Badge`) i `Tailwind CSS` do ostylowania widoku.
9. **Testy:**
    - **Komponentowe (Vitest + RTL):** Przetestuj każdy komponent w izolacji, mockując propsy i interakcje użytkownika.
    - **Integracyjne (Vitest + MSW):** Przetestuj `InvestmentsView`, mockując odpowiedzi API dla różnych scenariuszy (sukces, błąd, pusta lista).
10. **Weryfikacja końcowa:** Sprawdź, czy implementacja spełnia wszystkie kryteria akceptacji z historyjki użytkownika US-007.
