# Plan implementacji widoku "Zarządzanie Inwestycjami" (Admin)

## 1. Przegląd

Widok "Zarządzanie Inwestycjami" jest częścią panelu administracyjnego i ma na celu umożliwienie administratorom przeglądania, filtrowania i zarządzania wszystkimi inwestycjami w systemie. Administratorzy będą mogli filtrować listę według statusu, oferty lub użytkownika, a także zmieniać status poszczególnych inwestycji. Widok zapewni kompleksowe narzędzie do monitorowania i obsługi procesów inwestycyjnych.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką `/admin/investments`. Dostęp do tej ścieżki musi być chroniony i wymagać uwierzytelnienia użytkownika z rolą `admin`.

## 3. Struktura komponentów

Widok będzie zaimplementowany jako strona Astro (`/admin/investments/index.astro`), która będzie renderować interaktywne komponenty React.

```
/src/pages/admin/investments/index.astro
└── /src/components/admin/investments/AdminInvestmentsView.tsx
    ├── /src/components/admin/investments/InvestmentsFilters.tsx
    ├── /src/components/admin/investments/InvestmentsTable.tsx
    │   ├── /src/components/admin/investments/InvestmentRow.tsx
    │   │   ├── /src/components/ui/Badge.tsx (StatusBadge)
    │   │   └── /src/components/admin/investments/InvestmentActions.tsx (Dropdown menu)
    │   └── /src/components/admin/investments/TableSkeleton.tsx
    ├── /src/components/Pagination.tsx
    └── /src/components/admin/EmptyState.tsx
```

## 4. Szczegóły komponentów

### AdminInvestmentsView.tsx

- **Opis komponentu:** Główny komponent-kontener, który zarządza stanem, pobiera dane z API i koordynuje pracę komponentów podrzędnych.
- **Główne elementy:** Kontener `div` dla filtrów, tabeli i paginacji. Renderuje warunkowo `TableSkeleton`, `EmptyState` lub `InvestmentsTable`.
- **Obsługiwane interakcje:** Brak bezpośrednich.
- **Typy:** `AdminInvestmentViewModel`, `PaginatedResponse<AdminInvestmentViewModel>`.
- **Propsy:** Brak.

### InvestmentsFilters.tsx

- **Opis komponentu:** Zestaw filtrów pozwalający na zawężenie listy inwestycji.
- **Główne elementy:** Pola `Select` dla statusu, `Input` do wyszukiwania po emailu użytkownika lub nazwie oferty.
- **Obsługiwane interakcje:** Zmiana wartości w polach filtrów.
- **Typy:** `InvestmentQueryParams`.
- **Propsy:**
  - `filters: Partial<InvestmentQueryParams>`
  - `onFilterChange: (filters: Partial<InvestmentQueryParams>) => void`
  - `disabled: boolean`

### InvestmentsTable.tsx

- **Opis komponentu:** Tabela wyświetlająca listę inwestycji.
- **Główne elementy:** Komponenty `Table` z `Shadcn/ui`. Mapuje listę inwestycji na komponenty `InvestmentRow`.
- **Obsługiwane interakcje:** Brak.
- **Typy:** `AdminInvestmentViewModel`.
- **Propsy:**
  - `investments: AdminInvestmentViewModel[]`
  - `onStatusChange: (investmentId: string, newStatus: InvestmentStatus) => void`

### InvestmentRow.tsx

- **Opis komponentu:** Pojedynczy wiersz w tabeli, wyświetlający dane jednej inwestycji.
- **Główne elementy:** `TableRow`, `TableCell`. Wyświetla dane inwestycji, `Badge` ze statusem oraz `InvestmentActions`.
- **Obsługiwane interakcje:** Brak.
- **Typy:** `AdminInvestmentViewModel`.
- **Propsy:**
  - `investment: AdminInvestmentViewModel`
  - `onStatusChange: (investmentId: string, newStatus: InvestmentStatus) => void`

### InvestmentActions.tsx

- **Opis komponentu:** Rozwijane menu (`DropdownMenu` z `Shadcn/ui`) z akcjami do zmiany statusu inwestycji.
- **Główne elementy:** `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`.
- **Obsługiwane interakcje:** Kliknięcie opcji w menu (np. "Akceptuj", "Odrzuć").
- **Typy:** `InvestmentStatus`.
- **Propsy:**
  - `investmentId: string`
  - `currentStatus: InvestmentStatus`
  - `onStatusChange: (investmentId: string, newStatus: InvestmentStatus) => void`

## 5. Typy

Potrzebny będzie dedykowany `ViewModel` dla widoku administratora.

```typescript
// Ten typ będzie używany wewnętrznie w komponencie
/**
 * ViewModel for a single investment in the Admin View.
 * Contains formatted and directly usable data for the UI.
 */
export interface AdminInvestmentViewModel {
  id: string;
  offerName: string;
  userFullName: string;
  userEmail: string;
  amount: string; // Sformatowana kwota
  status: InvestmentStatus;
  submissionDate: string; // Sformatowana data
}
```

## 6. Zarządzanie stanem

Stan będzie zarządzany w komponencie `AdminInvestmentsView.tsx` przy użyciu hooków `useState` i `useEffect`.

- `data (PaginatedResponse<AdminInvestmentViewModel> | null)`: Przechowuje pobrane dane.
- `status ('idle' | 'loading' | 'success' | 'error')`: Reprezentuje stan cyklu życia żądania.
- `queryParams (InvestmentQueryParams)`: Przechowuje aktualne parametry zapytania. Zmiana tego stanu wyzwala ponowne pobranie danych.

Logika zmiany statusu inwestycji będzie obsługiwana przez dedykowaną funkcję asynchroniczną, która wywoła odpowiedni endpoint `PUT`, a po sukcesie odświeży listę.

## 7. Integracja API

### Pobieranie listy inwestycji

- **Endpoint:** `GET /api/investments/admin`
- **Typy żądania:** Parametry zapytania z obiektu `queryParams` (`page`, `limit`, `status`, `offer_id`, `user_id`).
- **Typy odpowiedzi:** `PaginatedResponse<InvestmentWithRelationsDTO>`, która zostanie zmapowana na `PaginatedResponse<AdminInvestmentViewModel>`.

### Zmiana statusu inwestycji

- **Endpoint:** `PUT /api/investments/[investmentId]`
- **Typy żądania:** `UpdateInvestmentStatusDTO`

    ```json
    {
      "status": "accepted"
    }
    ```

- **Typy odpowiedzi:** `InvestmentDTO`.

## 8. Interakcje użytkownika

- **Filtrowanie listy:** Użytkownik zmienia wartości w filtrach, co aktualizuje `queryParams`, resetuje stronę do 1 i wyzwala ponowne pobranie danych.
- **Zmiana strony:** Użytkownik klika w `Pagination`, co aktualizuje `queryParams` i pobiera dane dla nowej strony.
- **Zmiana statusu:** Administrator wybiera nową akcję z `InvestmentActions`. Wywoływane jest żądanie `PUT` do API. Po pomyślnej odpowiedzi, lista inwestycji jest odświeżana, aby pokazać nowy status.

## 9. Warunki i walidacja

- **Dostęp do widoku:** Chroniony przez middleware Astro, który weryfikuje rolę `admin`.
- **Interfejs użytkownika:**
  - Filtry i paginacja są wyłączone podczas ładowania danych.
  - Menu akcji (`InvestmentActions`) wyświetla tylko dozwolone zmiany statusu (np. nie można "zaakceptować" już zaakceptowanej inwestycji).
  - Wyświetlane są odpowiednie stany dla ładowania (`TableSkeleton`), braku danych (`EmptyState`) i błędów (`BaseAlert`).

## 10. Obsługa błędów

- **Błąd pobierania danych:** Jeśli `GET` API zwróci błąd, zostanie wyświetlony komunikat o błędzie.
- **Błąd zmiany statusu:** Jeśli `PUT` API zwróci błąd, użytkownik zobaczy powiadomienie typu "toast" z informacją o niepowodzeniu operacji, a stan UI nie ulegnie zmianie.
- **Błędy 401/403:** Middleware Astro powinno obsłużyć je globalnie, przekierowując do strony logowania lub strony braku uprawnień.

## 11. Kroki implementacji

1. **Struktura plików:** Utwórz plik strony `src/pages/admin/investments/index.astro` oraz pliki dla komponentów React w `src/components/admin/investments/`.
2. **Typy:** Zdefiniuj `AdminInvestmentViewModel` w pliku `AdminInvestmentsView.tsx`.
3. **Komponent `AdminInvestmentsView`:** Zaimplementuj główny komponent z logiką zarządzania stanem, pobieraniem danych oraz funkcją do zmiany statusu inwestycji.
4. **Komponenty podrzędne:** Stwórz komponenty `InvestmentsFilters`, `InvestmentsTable`, `InvestmentRow` i `InvestmentActions`.
5. **Stany UI:** Zaimplementuj warunkowe renderowanie dla stanów ładowania, braku danych i błędów.
6. **Routing:** Dodaj link "Inwestycje" w nawigacji panelu admina (`AdminLayout.astro`), aby prowadził do nowej strony.
7. **Stylowanie:** Użyj komponentów `Shadcn/ui` i `Tailwind CSS` do ostylowania widoku.
8. **Testy:**
    - **Komponentowe (Vitest + RTL):** Przetestuj komponenty w izolacji, szczególnie logikę `InvestmentActions`.
    - **Integracyjne (Vitest + MSW):** Przetestuj `AdminInvestmentsView`, mockując odpowiedzi API dla pobierania listy i zmiany statusu.
9. **Weryfikacja końcowa:** Sprawdź, czy implementacja spełnia wszystkie wymagania funkcjonalne dla administratora.
