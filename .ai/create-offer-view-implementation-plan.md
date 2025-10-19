# Plan implementacji widoku: Create Offer

## 1. Przegląd

Widok "Create Offer" jest dedykowanym interfejsem dla administratorów, umożliwiającym tworzenie nowych ofert inwestycyjnych w systemie BlindInvest. Widok składa się z formularza, który pozwala na wprowadzenie wszystkich niezbędnych danych oferty, takich jak nazwa, opis, kwoty i data zakończenia. Formularz jest zintegrowany z systemem walidacji po stronie klienta, aby zapewnić poprawność danych przed wysłaniem ich do API. Po pomyślnym utworzeniu oferty, administrator jest informowany o sukcesie i przekierowywany na listę ofert.

## 2. Routing widoku

Widok będzie dostępny pod chronioną ścieżką przeznaczoną wyłącznie dla administratorów:

- **Ścieżka:** `/admin/offers/create`

Dostęp do tej ścieżki powinien być zabezpieczony przez middleware, który weryfikuje, czy zalogowany użytkownik posiada rolę `admin`.

## 3. Struktura komponentów

Widok będzie zaimplementowany jako strona Astro, która renderuje komponent Reactowy zawierający całą logikę formularza.

```text
/src/pages/admin/offers/create.astro
└── /src/components/forms/CreateOfferForm.tsx (React, "use client")
    ├── /src/components/ui/form.tsx (Shadcn/ui)
    ├── /src/components/ui/input.tsx (Shadcn/ui)
    ├── /src/components/ui/textarea.tsx (Shadcn/ui)
    ├── /src/components/ui/datepicker.tsx (Custom component with Shadcn/ui Popover & Calendar)
    ├── /src/components/ui/button.tsx (Shadcn/ui)
    └── /src/components/ui/spinner.tsx (Custom component for loading state)
```

## 4. Szczegóły komponentów

### `CreateOfferForm.tsx`

- **Opis komponentu:** Główny komponent Reactowy, który renderuje formularz tworzenia nowej oferty. Zarządza stanem formularza, obsługuje walidację danych wejściowych za pomocą biblioteki Zod oraz komunikuje się z API w celu wysłania danych.
- **Główne elementy:**
  - Komponent `<Form>` z `shadcn/ui` jako kontener.
  - Pola `<FormField>` dla każdego elementu danych: `name`, `description`, `target_amount`, `minimum_investment`, `end_at`.
  - Pole `name`: `<Input type="text">`.
  - Pole `description`: `<Textarea>`.
  - Pola `target_amount` i `minimum_investment`: `<Input type="number">`.
  - Pole `end_at`: Niestandardowy komponent `<DatePicker>` zbudowany z `Popover` i `Calendar` z `shadcn/ui`.
  - Przycisk `<Button type="submit">` do wysłania formularza, który wyświetla `<Spinner>` w trakcie ładowania.
- **Obsługiwane interakcje:**
  - Wprowadzanie danych w pola formularza.
  - Wybór daty z kalendarza.
  - Wysłanie formularza (kliknięcie przycisku "Utwórz ofertę").
- **Obsługiwana walidacja:**
  - `name`: Wymagane, minimum 1 znak, maksimum 255 znaków.
  - `description`: Opcjonalne.
  - `target_amount`: Wymagane, musi być liczbą dodatnią.
  - `minimum_investment`: Wymagane, musi być liczbą dodatnią.
  - `end_at`: Wymagane, musi być prawidłową datą i nie może być datą z przeszłości.
- **Typy:** `CreateOfferViewModel`, `CreateOfferDTO`.
- **Propsy:** Brak. Komponent jest samodzielny.

## 5. Typy

Do implementacji widoku wymagane będą następujące typy:

- **`CreateOfferDTO` (już istnieje w `src/types.ts`)**:
  - Typ używany do wysłania danych do API (`POST /api/offers`).
  - `Omit<TablesInsert<"offers">, "id" | "created_at" | "updated_at" | "status">`

- **`CreateOfferViewModel` (nowy typ)**:
  - Typ reprezentujący dane formularza w komponencie React. Jest zgodny ze schematem walidacji Zod. Pola liczbowe są typu `number`, aby ułatwić walidację, a nie `string` jak w przypadku surowych danych z inputów.

  ```typescript
  // src/lib/validators/offers.validator.ts
  import { z } from "zod";

  export const createOfferSchema = z.object({
    name: z.string().min(1, "Nazwa jest wymagana").max(255, "Nazwa może mieć maksymalnie 255 znaków"),
    description: z.string().optional(),
    target_amount: z
      .number({ invalid_type_error: "Kwota musi być liczbą" })
      .positive("Docelowa kwota musi być większa od 0"),
    minimum_investment: z
      .number({ invalid_type_error: "Kwota musi być liczbą" })
      .positive("Minimalna inwestycja musi być większa od 0"),
    end_at: z
      .date({ required_error: "Data zakończenia jest wymagana" })
      .min(new Date(), { message: "Data nie może być z przeszłości" }),
  });

  export type CreateOfferViewModel = z.infer<typeof createOfferSchema>;
  ```

## 6. Zarządzanie stanem

Zarządzanie stanem formularza zostanie zrealizowane przy użyciu biblioteki `react-hook-form` zintegrowanej z `zod` za pomocą `@hookform/resolvers/zod`.

- **Hook `useForm`**:
  - Inicjalizuje formularz, przekazując `createOfferSchema` jako resolver.
  - `const form = useForm<CreateOfferViewModel>({ resolver: zodResolver(createOfferSchema), defaultValues: { ... } });`
  - Dostarcza metody `register`, `handleSubmit`, `formState: { errors, isSubmitting }`.

- **Stan ładowania i błędów**:
  - `isSubmitting` z `useForm` będzie używany do pokazywania wskaźnika ładowania na przycisku.
  - Stan dla błędów serwera będzie zarządzany lokalnie za pomocą `useState`, np. `const [serverError, setServerError] = useState<string | null>(null);`.

Nie ma potrzeby tworzenia globalnego stanu ani customowego hooka dla tego widoku.

## 7. Integracja API

Integracja z API `POST /api/offers` nastąpi wewnątrz funkcji `onSubmit` przekazanej do `handleSubmit` z `react-hook-form`.

- **Funkcja `onSubmit`**:
  1. Otrzymuje zwalidowane dane typu `CreateOfferViewModel`.
  2. Konwertuje datę `end_at` do formatu ISO string (`data.end_at.toISOString()`).
  3. Tworzy obiekt `CreateOfferDTO` z przekształconymi danymi.
  4. Wywołuje `fetch('/api/offers', { method: 'POST', ... })` z przygotowanym DTO.
  5. Obsługuje odpowiedź:
     - **Sukces (201 Created)**: Wyświetla powiadomienie o sukcesie (np. za pomocą `sonner`) i przekierowuje użytkownika na listę ofert (`/admin/offers`).
     - **Błąd (4xx, 5xx)**: Parsuje odpowiedź błędu, ustawia `serverError` i wyświetla komunikat użytkownikowi.

- **Typy**:
  - **Żądanie**: `CreateOfferDTO`
  - **Odpowiedź (sukces)**: `ApiResponse<OfferDTO>`
  - **Odpowiedź (błąd)**: `ApiErrorResponse`

## 8. Interakcje użytkownika

- **Wypełnianie formularza**: Użytkownik wprowadza dane w pola. Walidacja `onBlur` lub `onChange` informuje o błędach na bieżąco.
- **Wybór daty**: Użytkownik klika ikonę kalendarza, otwiera `Popover` z komponentem `Calendar` i wybiera datę.
- **Wysyłanie formularza**:
  - Użytkownik klika przycisk "Utwórz ofertę".
  - Przycisk zostaje zablokowany, a w jego miejscu pojawia się ikona ładowania.
  - Jeśli walidacja po stronie klienta nie powiedzie się, pod polami wyświetlane są komunikaty o błędach.
  - Po pomyślnym utworzeniu oferty, użytkownik widzi komunikat i jest przekierowywany.
  - W przypadku błędu serwera, pod formularzem pojawia się ogólny komunikat o błędzie.

## 9. Warunki i walidacja

- **Nazwa (`name`)**: Komponent `Input`. Weryfikacja, czy pole nie jest puste i czy długość nie przekracza 255 znaków. Stan `disabled` przycisku zależy od poprawności całego formularza.
- **Kwoty (`target_amount`, `minimum_investment`)**: Komponent `Input type="number"`. Weryfikacja, czy wartość jest liczbą dodatnią.
- **Data zakończenia (`end_at`)**: Komponent `DatePicker`. Weryfikacja, czy data została wybrana i czy nie jest datą przeszłą.
- **Przycisk "Utwórz ofertę"**: Jest w stanie `disabled`, jeśli formularz jest w trakcie wysyłania (`isSubmitting`) lub jeśli dane są nieprawidłowe (opcjonalnie, domyślnie `react-hook-form` pozwala na wysłanie i pokazuje błędy).

## 10. Obsługa błędów

- **Błędy walidacji klienta**: Obsługiwane automatycznie przez `react-hook-form` i `zod`. Komunikaty o błędach są wyświetlane pod odpowiednimi polami formularza.
- **Błędy sieciowe**: Obsługiwane w bloku `catch` wywołania `fetch`. Użytkownikowi wyświetlany jest ogólny komunikat, np. "Błąd połączenia z serwerem. Spróbuj ponownie później."
- **Błędy API (4xx, 5xx)**:
  - Odpowiedź serwera jest parsowana w celu uzyskania szczegółów błędu (`ApiErrorResponse`).
  - Użytkownikowi wyświetlany jest komunikat błędu zwrócony przez API (np. "Wystąpił błąd podczas tworzenia oferty.").
  - Stan `isSubmitting` jest ustawiany na `false`, aby odblokować formularz.

## 11. Kroki implementacji

1. **Utworzenie struktury plików**:
   - Stwórz plik strony Astro: `src/pages/admin/offers/create.astro`.
   - Stwórz plik komponentu React: `src/components/forms/CreateOfferForm.tsx`.
   - Dodaj routing i zabezpieczenie middleware dla ścieżki `/admin/offers/create`.

2. **Definicja schematu walidacji**:
   - W pliku `src/lib/validators/offers.validator.ts` zdefiniuj `createOfferSchema` używając `zod` oraz wyeksportuj typ `CreateOfferViewModel`.

3. **Budowa komponentu `CreateOfferForm.tsx`**:
   - Zaimplementuj hook `useForm` z `react-hook-form` i `zodResolver`.
   - Zbuduj strukturę formularza przy użyciu komponentów `Form`, `FormField`, `Input`, `Textarea` z `shadcn/ui`.
   - Stwórz lub zintegruj reużywalny komponent `DatePicker` dla pola `end_at`.

4. **Implementacja logiki `onSubmit`**:
   - W komponencie `CreateOfferForm.tsx` stwórz funkcję `onSubmit`, która będzie odpowiedzialna za:
     - Transformację danych z `ViewModel` do `DTO`.
     - Wywołanie `fetch` do endpointu `/api/offers`.
     - Obsługę odpowiedzi sukcesu i błędu.

5. **Zarządzanie stanem UI**:
   - Zintegruj stan `isSubmitting` z przyciskiem, aby pokazywać wskaźnik ładowania.
   - Wyświetlaj komunikaty o błędach walidacji pod polami.
   - Dodaj miejsce na wyświetlanie błędów serwerowych.

6. **Finalizacja i testowanie**:
   - Umieść komponent `CreateOfferForm` na stronie `create.astro` i oznacz go jako komponent kliencki.
   - Przetestuj wszystkie ścieżki: pomyślne utworzenie, błędy walidacji, błędy serwera.
   - Upewnij się, że po sukcesie następuje przekierowanie.
