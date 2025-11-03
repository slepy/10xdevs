# Plan implementacji widoku: Szczegóły Inwestycji

## 1. Przegląd

Celem tego dokumentu jest szczegółowe zaplanowanie implementacji widoku "Szczegóły Inwestycji". Widok ten będzie dostępny dla dwóch typów użytkowników: **Signer** (Inwestor) oraz **Admin**. Umożliwi on przeglądanie szczegółowych informacji o konkretnej inwestycji, w tym danych powiązanej oferty oraz informacji o inwestorze. Widok będzie również udostępniał akcje kontekstowe w zależności od roli użytkownika i statusu inwestycji, takie jak anulowanie, akceptacja czy odrzucenie inwestycji.

## 2. Routing widoku

Widok będzie dostępny pod dwoma różnymi ścieżkami, w zależności od roli zalogowanego użytkownika:

- **Signer:** `/investments/[investmentId]`
- **Admin:** `/admin/investments/[investmentId]`

Obie ścieżki będą renderować ten sam komponent strony (`InvestmentDetailsPage`), który dynamicznie dostosuje swoje zachowanie i interfejs na podstawie roli użytkownika i danych inwestycji.

## 3. Struktura komponentów

Komponenty zostaną zorganizowane w sposób hierarchiczny, aby zapewnić reużywalność i czytelność kodu.

```
- InvestmentDetailsPage.astro (Strona główna widoku)
  - AuthenticatedLayout.astro | AdminLayout.astro (Layout w zależności od roli)
    - InvestmentDetailsView.tsx (Główny komponent Reactowy)
      - InvestmentStatusBadge.tsx (Wyświetla status inwestycji)
      - InvestmentActions.tsx (Kontener na przyciski akcji)
        - CancelInvestmentButton.tsx (Przycisk anulowania dla Signera)
        - UpdateInvestmentStatusButtons.tsx (Przyciski zmiany statusu dla Admina)
      - InvestmentInfoCard.tsx (Karta z kluczowymi danymi inwestycji)
      - OfferInfoCard.tsx (Karta z danymi powiązanej oferty)
      - UserInfoCard.tsx (Karta z danymi użytkownika - widoczna dla Admina)
      - ConfirmationModal.tsx (Modal do potwierdzania akcji)
```

## 4. Szczegóły komponentów

### `InvestmentDetailsView.tsx`

- **Opis:** Główny komponent Reactowy, który pobiera dane inwestycji, zarządza stanem i renderuje podkomponenty.
- **Główne elementy:** `div` jako kontener, komponenty `InvestmentStatusBadge`, `InvestmentActions`, `InvestmentInfoCard`, `OfferInfoCard`, `UserInfoCard`.
- **Obsługiwane interakcje:** Brak bezpośrednich.
- **Warunki walidacji:** Brak.
- **Typy:** `InvestmentDetailsViewModel`.
- **Propsy:** `investmentId: string`, `userRole: 'signer' | 'admin'`.

### `InvestmentStatusBadge.tsx`

- **Opis:** Wyświetla etykietę ze statusem inwestycji, z odpowiednim kolorem i tekstem.
- **Główne elementy:** Komponent `Badge` z biblioteki `shadcn/ui`.
- **Obsługiwane interakcje:** Brak.
- **Warunki walidacji:** Brak.
- **Typy:** `InvestmentStatus`.
- **Propsy:** `status: InvestmentStatus`.

### `InvestmentActions.tsx`

- **Opis:** Renderuje odpowiednie przyciski akcji w zależności od statusu inwestycji i roli użytkownika.
- **Główne elementy:** `div` jako kontener, `CancelInvestmentButton`, `UpdateInvestmentStatusButtons`.
- **Obsługiwane interakcje:** Przekazuje zdarzenia `onCancel`, `onStatusChange` od komponentów dzieci.
- **Warunki walidacji:**
  - `CancelInvestmentButton` jest widoczny tylko dla `userRole: 'signer'` i `status: 'pending'`.
  - `UpdateInvestmentStatusButtons` są widoczne tylko dla `userRole: 'admin'` i `status: 'pending'`.
- **Typy:** `InvestmentDetailsViewModel`, `UserRole`.
- **Propsy:** `investment: InvestmentDetailsViewModel`, `userRole: UserRole`, `onCancel: () => void`, `onStatusChange: (newStatus: InvestmentStatus) => void`.

### `InvestmentInfoCard.tsx`

- **Opis:** Wyświetla kluczowe informacje o inwestycji (kwota, data złożenia).
- **Główne elementy:** Komponent `Card` z `shadcn/ui`, zawierający `CardHeader`, `CardContent`.
- **Obsługiwane interakcje:** Brak.
- **Warunki walidacji:** Brak.
- **Typy:** `InvestmentDetailsViewModel`.
- **Propsy:** `investment: InvestmentDetailsViewModel`.

### `OfferInfoCard.tsx`

- **Opis:** Wyświetla informacje o ofercie powiązanej z inwestycją.
- **Główne elementy:** Komponent `Card` z `shadcn/ui`.
- **Obsługiwane interakcje:** Brak.
- **Warunki walidacji:** Brak.
- **Typy:** `OfferDTO`.
- **Propsy:** `offer: OfferDTO`.

### `UserInfoCard.tsx`

- **Opis:** Wyświetla dane użytkownika, który złożył inwestycję. Komponent widoczny tylko dla administratora.
- **Główne elementy:** Komponent `Card` z `shadcn/ui`.
- **Obsługiwane interakcje:** Brak.
- **Warunki walidacji:** Renderowany warunkowo, gdy `userRole === 'admin'`.
- **Typy:** `UserDTO`.
- **Propsy:** `user: UserDTO`.

### `ConfirmationModal.tsx`

- **Opis:** Modal dialogowy do potwierdzania przez użytkownika wykonania krytycznej akcji (np. anulowanie, zmiana statusu).
- **Główne elementy:** Komponent `AlertDialog` z `shadcn/ui`.
- **Obsługiwane interakcje:** `onConfirm`, `onCancel`.
- **Warunki walidacji:** Brak.
- **Typy:** Brak.
- **Propsy:** `isOpen: boolean`, `title: string`, `description: string`, `onConfirm: () => void`, `onCancel: () => void`.

## 5. Typy

Do implementacji widoku potrzebny będzie nowy typ `ViewModel`, który połączy dane z różnych źródeł w jedną strukturę zoptymalizowaną dla widoku.

```typescript
// Plik: src/types.ts

/**
 * ViewModel for the Investment Details page.
 * Combines investment data with related offer and user details.
 */
export interface InvestmentDetailsViewModel {
  id: string;
  amount: number;
  status: InvestmentStatus;
  created_at: string;
  completed_at?: string | null;
  reason?: string | null;
  offer: OfferDTO;
  user?: UserDTO; // Optional, as it's only available for Admins
}
```

- **`InvestmentDetailsViewModel`**: Główny typ danych dla widoku.
  - **`id` (`string`):** ID inwestycji.
  - **`amount` (`number`):** Kwota inwestycji.
  - **`status` (`InvestmentStatus`):** Aktualny status inwestycji (`pending`, `accepted`, `rejected`, `cancelled`, `completed`).
  - **`created_at` (`string`):** Data utworzenia inwestycji.
  - **`completed_at` (`string | null`):** Data zakończenia (jeśli dotyczy).
  - **`reason` (`string | null`):** Powód odrzucenia lub anulowania.
  - **`offer` (`OfferDTO`):** Obiekt z pełnymi danymi powiązanej oferty.
  - **`user` (`UserDTO | undefined`):** Obiekt z danymi użytkownika. Pole opcjonalne, dostępne tylko w widoku administratora.

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane wewnątrz komponentu `InvestmentDetailsView.tsx` przy użyciu standardowych hooków React oraz biblioteki `TanStack Query` (React Query) do zarządzania stanem serwera.

- **`useInvestmentDetails` (Custom Hook):**
  - **Cel:** Abstrakcja logiki pobierania danych, obsługi ładowania i błędów. Hook będzie wykorzystywał `useQuery` z `TanStack Query`.
  - **Zwracane wartości:** `{ data: InvestmentDetailsViewModel | undefined, isLoading: boolean, isError: boolean, error: Error | null }`.
  - **Implementacja:** Hook będzie przyjmował `investmentId` jako argument i wywoływał funkcję `fetchInvestmentDetails`, która komunikuje się z API.

- **Stan lokalny komponentu:**
  - `isModalOpen` (`boolean`): Do zarządzania widocznością modala potwierdzającego.
  - `actionToConfirm` (`{ type: 'cancel' | 'accept' | 'reject', payload?: any } | null`): Do przechowywania informacji o akcji, która ma zostać potwierdzona w modalu.

## 7. Integracja API

Komponent będzie komunikował się z jednym głównym punktem końcowym oraz dwoma punktami do modyfikacji danych.

1. **Pobieranie danych:**
    - **Endpoint:** `GET /api/investments/[investmentId]`
    - **Opis:** Pobiera szczegółowe dane inwestycji.
    - **Typ odpowiedzi (sukces):** `ApiResponse<InvestmentDetailsDTO>`
    - **Obsługa:** Wywoływany przy montowaniu komponentu za pomocą `useInvestmentDetails`. Dane z `InvestmentDetailsDTO` zostaną zmapowane na `InvestmentDetailsViewModel`.

2. **Anulowanie inwestycji (Signer):**
    - **Endpoint:** `PUT /api/investments/[investmentId]/cancel`
    - **Opis:** Umożliwia anulowanie inwestycji przez jej właściciela.
    - **Typ żądania:** `CancelInvestmentDTO` (może zawierać `reason`).
    - **Obsługa:** Wywoływany po potwierdzeniu w modalu. Po pomyślnym anulowaniu, dane w `TanStack Query` zostaną unieważnione (`invalidateQueries`), aby odświeżyć widok.

3. **Zmiana statusu inwestycji (Admin):**
    - **Endpoint:** `PUT /api/investments/[investmentId]`
    - **Opis:** Umożliwia administratorowi zmianę statusu inwestycji.
    - **Typ żądania:** `UpdateInvestmentStatusDTO` (`{ status: 'accepted' | 'rejected', reason?: string }`).
    - **Obsługa:** Wywoływany po potwierdzeniu w modalu. Po sukcesie, dane zostaną unieważnione w celu odświeżenia widoku.

## 8. Interakcje użytkownika

- **Signer:**
  - **Widzi przycisk "Anuluj"** (gdy `status === 'pending'`).
  - **Klika "Anuluj"**: Otwiera się modal z prośbą o potwierdzenie.
  - **Potwierdza w modalu**: Wywoływane jest API do anulowania inwestycji. Widok jest blokowany (np. przez spinner na przycisku), a po odpowiedzi API odświeżany.
- **Admin:**
  - **Widzi przyciski "Akceptuj" i "Odrzuć"** (gdy `status === 'pending'`).
  - **Klika jeden z przycisków**: Otwiera się modal z prośbą o potwierdzenie.
  - **Potwierdza w modalu**: Wywoływane jest API do zmiany statusu. Widok jest blokowany i odświeżany po odpowiedzi.

## 9. Warunki i walidacja

- **Dostęp do widoku:** Chroniony przez middleware Astro, który weryfikuje uwierzytelnienie.
- **Wyświetlanie przycisków akcji:**
  - Przycisk `Anuluj` jest renderowany tylko jeśli: `userRole === 'signer'` ORAZ `investment.status === 'pending'`.
  - Przyciski `Akceptuj`/`Odrzuć` są renderowane tylko jeśli: `userRole === 'admin'` ORAZ `investment.status === 'pending'`.
- **Wyświetlanie danych użytkownika:** Komponent `UserInfoCard` jest renderowany tylko jeśli `userRole === 'admin'`.

## 10. Obsługa błędów

- **Błąd ładowania danych (np. 404 Not Found, 403 Forbidden):**
  - Hook `useInvestmentDetails` zwróci `isError: true`.
  - Komponent `InvestmentDetailsView` wyświetli komunikat o błędzie (np. "Nie znaleziono inwestycji" lub "Brak dostępu") zamiast danych.
- **Błąd podczas wykonywania akcji (np. anulowania):**
  - Błąd z API zostanie przechwycony w bloku `catch` funkcji obsługującej akcję.
  - Użytkownik zobaczy powiadomienie typu "toast" (np. z `sonner`) z informacją o niepowodzeniu operacji.
  - Modal zostanie zamknięty, a interfejs odblokowany.

## 11. Kroki implementacji

1. **Utworzenie plików stron Astro:**
    - Stworzyć plik `src/pages/investments/[investmentId].astro`.
    - Stworzyć plik `src/pages/admin/investments/[investmentId].astro`.
    - W obu plikach zaimplementować logikę layoutu i renderowanie komponentu `InvestmentDetailsView`, przekazując odpowiednie prop `userRole`.

2. **Zdefiniowanie typów:**
    - Dodać typ `InvestmentDetailsViewModel` do pliku `src/types.ts`.

3. **Stworzenie komponentów React:**
    - Utworzyć wszystkie wymienione w sekcji 3 komponenty `.tsx` w katalogu `src/components/investment-details/`.
    - Zacząć od statycznej implementacji UI, używając przykładowych danych (mock data).

4. **Implementacja Custom Hooka:**
    - Stworzyć hook `useInvestmentDetails` w pliku `src/components/hooks/useInvestmentDetails.ts`.
    - Zaimplementować w nim logikę pobierania danych z API przy użyciu `TanStack Query`.

5. **Integracja z API w komponencie głównym:**
    - W `InvestmentDetailsView.tsx` użyć hooka `useInvestmentDetails` do pobrania danych.
    - Dodać obsługę stanów `isLoading` i `isError`.
    - Zaimplementować logikę wywołania API dla akcji anulowania i zmiany statusu, włączając w to obsługę modala potwierdzającego.

6. **Implementacja logiki warunkowej:**
    - Dodać logikę warunkowego renderowania komponentów `InvestmentActions` i `UserInfoCard` na podstawie roli użytkownika i statusu inwestycji.

7. **Stylowanie i finalizacja:**
    - Dopracować wygląd komponentów przy użyciu Tailwind CSS, zgodnie z design systemem aplikacji.
    - Dodać obsługę powiadomień "toast" dla sukcesu i błędów akcji.

8. **Testowanie:**
    - Napisać testy jednostkowe dla logiki w `useInvestmentDetails`.
    - Napisać testy komponentów dla `InvestmentActions`, sprawdzając warunkowe renderowanie.
    - Przeprowadzić testy manualne dla obu ról (Signer i Admin) w różnych scenariuszach.
