# Plan implementacji widoku Modal inwestycyjny

## 1. Przegląd

Modal inwestycyjny to komponent popup'owy wyświetlany po kliknięciu przycisku "Inwestuj" na stronie szczegółów oferty. Jego celem jest umożliwienie zalogowanym użytkownikom o roli "Signer" złożenia deklaracji inwestycyjnej poprzez wprowadzenie kwoty, którą chcą zainwestować w daną ofertę. Modal zapewnia walidację kwoty (minimalna kwota inwestycji), obsługę błędów oraz komunikację z API w celu utworzenia nowej inwestycji.

## 2. Routing widoku

Modal nie posiada własnego routingu - jest wyświetlany jako nakładka na istniejącej stronie szczegółów oferty (`/offers/:offerId`). Modal jest kontrolowany przez stan komponentu `OfferInvestmentCTA`, który znajduje się w komponencie `OfferDetailsPage`.

## 3. Struktura komponentów

```
OfferDetailsPage (istniejący)
├── OfferImageGallery
├── OfferDescription
├── OfferFinancials
└── OfferInvestmentCTA (zmodyfikowany)
    └── InvestmentModal (nowy komponent)
        ├── Dialog (z shadcn/ui)
        ├── DialogContent
        │   ├── DialogHeader
        │   │   ├── DialogTitle
        │   │   └── DialogDescription
        │   ├── InvestmentForm (nowy komponent)
        │   │   ├── BaseFormField
        │   │   └── BaseButton (x2: Submit, Cancel)
        │   └── BaseAlert (do wyświetlania błędów)
        └── DialogTrigger (przycisk "Inwestuj")
```

## 4. Szczegóły komponentów

### InvestmentModal

- **Opis komponentu**: Główny komponent modalu odpowiedzialny za zarządzanie stanem otwarcia/zamknięcia, orkiestrację formularza i komunikację z API. Renderuje Dialog z shadcn/ui oraz zawiera logikę biznesową związaną z procesem inwestycyjnym.

- **Główne elementy**:
  - `Dialog` - komponent główny z shadcn/ui, kontroluje widoczność modalu
  - `DialogTrigger` - wrapper na przycisk "Inwestuj" (przekazany jako children)
  - `DialogContent` - zawartość modalu z nagłówkiem, formularzem i komunikatami
  - `DialogHeader` - sekcja z tytułem i opisem
  - `InvestmentForm` - zagnieżdżony komponent z formularzem
  - `BaseAlert` - komunikaty o błędach/sukcesie

- **Obsługiwane interakcje**:
  1. Kliknięcie przycisku "Inwestuj" (DialogTrigger) - otwiera modal
  2. Kliknięcie ikony X lub kliknięcie poza modalem - zamyka modal
  3. Submisja formularza - wysyła żądanie do API
  4. Sukces submisji - zamyka modal i przekierowuje do "Moje Inwestycje"
  5. Błąd submisji - wyświetla komunikat błędu w modalu

- **Obsługiwana walidacja**:
  - Walidacja po stronie formularza (w komponencie InvestmentForm)
  - Obsługa błędów walidacji zwróconych przez API (400 Bad Request)
  - Wyświetlanie komunikatów o błędach w czytelnej formie dla użytkownika

- **Typy**:
  - `InvestmentModalProps` - interface definiujący propsy komponentu
  - `CreateInvestmentDTO` - DTO z types.ts dla żądania API
  - `InvestmentDTO` - DTO z types.ts dla odpowiedzi API
  - `ApiResponse<InvestmentDTO>` - wrapper odpowiedzi API
  - `OfferDetailsViewModel` - VM dla informacji o ofercie (min. kwota)

- **Propsy**:

  ```typescript
  interface InvestmentModalProps {
    offerId: string;              // ID oferty do inwestycji
    minimumInvestment: number;    // Minimalna kwota inwestycji (w PLN)
    children: React.ReactNode;    // Przycisk trigger (DialogTrigger)
  }
  ```

### InvestmentForm

- **Opis komponentu**: Komponent formularza zawierający pole do wprowadzenia kwoty inwestycji oraz przyciski akcji (Inwestuj, Anuluj). Zarządza lokalnym stanem pola kwoty i walidacją przed submisją. Jest odpowiedzialny za prezentację formularza oraz przekazywanie danych do komponentu nadrzędnego (InvestmentModal).

- **Główne elementy**:
  - `<form>` - element HTML formularza z obsługą onSubmit
  - `BaseFormField` - pole input dla kwoty inwestycji (type="number")
  - `BaseButton` (type="submit") - przycisk "Inwestuj"
  - `BaseButton` (type="button") - przycisk "Anuluj"
  - Tekst informacyjny o minimalnej kwocie inwestycji

- **Obsługiwane interakcje**:
  1. Wpisywanie kwoty w pole input - aktualizacja stanu lokalnego
  2. Kliknięcie "Inwestuj" - walidacja i wywołanie handleSubmit
  3. Kliknięcie "Anuluj" - wywołanie handleCancel (zamknięcie modalu)
  4. Enter w polu input - submisja formularza

- **Obsługiwana walidacja**:
  - Wymagane pole - kwota nie może być pusta
  - Minimalna wartość - kwota >= minimumInvestment
  - Maksymalna wartość - kwota <= 100 000 000 PLN (zgodnie z walidatorem)
  - Dodatnia liczba - kwota > 0
  - Format liczbowy - tylko liczby (type="number" w input)
  - Walidacja wykonywana przed submisją formularza
  - Wyświetlanie błędów walidacji pod polem input (przez BaseFormField)

- **Typy**:
  - `InvestmentFormProps` - interface definiujący propsy komponentu
  - `number` - typ dla pola amount (stan lokalny)
  - `string` - typ dla komunikatów błędów walidacji

- **Propsy**:

  ```typescript
  interface InvestmentFormProps {
    minimumInvestment: number;                    // Minimalna kwota (w PLN)
    isSubmitting: boolean;                        // Czy trwa wysyłanie
    onSubmit: (amount: number) => Promise<void>;  // Callback submisji
    onCancel: () => void;                         // Callback anulowania
  }
  ```

## 5. Typy

### Istniejące typy (z `src/types.ts`)

```typescript
// DTO dla tworzenia inwestycji (żądanie API)
export type CreateInvestmentDTO = Pick<TablesInsert<"investments">, "offer_id" | "amount">;

// DTO dla odpowiedzi API
export type InvestmentDTO = Tables<"investments">;

// Wrapper odpowiedzi API
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Błędy walidacji
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Rozszerzona odpowiedź błędu API
export interface ApiErrorResponse {
  error: string;
  message: string;
  details?: ValidationError[];
  statusCode: number;
}
```

### Nowe typy (do zdefiniowania w plikach komponentów)

```typescript
// Props dla InvestmentModal
interface InvestmentModalProps {
  offerId: string;
  minimumInvestment: number;  // w PLN (już przekonwertowane przez backend)
  children: React.ReactNode;
}

// Props dla InvestmentForm
interface InvestmentFormProps {
  minimumInvestment: number;
  isSubmitting: boolean;
  onSubmit: (amount: number) => Promise<void>;
  onCancel: () => void;
}

// Stan lokalny InvestmentModal
interface InvestmentModalState {
  isOpen: boolean;          // Czy modal jest otwarty
  isSubmitting: boolean;    // Czy trwa wysyłanie do API
  error: string | null;     // Komunikat błędu (jeśli wystąpił)
  amount: number | '';      // Kwota inwestycji (w InvestmentForm)
  validationError: string;  // Błąd walidacji (w InvestmentForm)
}
```

### Szczegółowy opis nowych typów

**InvestmentModalProps:**

- `offerId: string` - UUID oferty, wymagane do stworzenia inwestycji przez API
- `minimumInvestment: number` - Minimalna kwota inwestycji w PLN (już przekonwertowana z centów przez backend), używana do walidacji
- `children: React.ReactNode` - Element trigger (przycisk), który po kliknięciu otwiera modal

**InvestmentFormProps:**

- `minimumInvestment: number` - Przekazana z rodzica, używana do walidacji kwoty
- `isSubmitting: boolean` - Flaga informująca czy trwa wysyłanie, blokuje przycisk submit i pokazuje spinner
- `onSubmit: (amount: number) => Promise<void>` - Funkcja callback wywołana po walidacji formularza, przyjmuje kwotę w PLN
- `onCancel: () => void` - Funkcja callback do zamknięcia modalu

## 6. Zarządzanie stanem

### Stan w komponencie InvestmentModal

```typescript
const [isOpen, setIsOpen] = useState(false);          // Kontrola widoczności modalu
const [isSubmitting, setIsSubmitting] = useState(false); // Stan loading podczas API call
const [error, setError] = useState<string | null>(null); // Globalny błąd (np. błąd API)
```

**Przepływ stanu:**

1. **Otwarcie modalu**: `isOpen = true` (kontrolowane przez Dialog z shadcn/ui)
2. **Rozpoczęcie submisji**: `isSubmitting = true`, `error = null`
3. **Sukces API**: `isSubmitting = false`, `isOpen = false`, przekierowanie do `/investments`
4. **Błąd API**: `isSubmitting = false`, `error = komunikat błędu`, modal pozostaje otwarty
5. **Zamknięcie modalu**: `isOpen = false`, reset stanu (`error = null`)

### Stan w komponencie InvestmentForm

```typescript
const [amount, setAmount] = useState<number | ''>('');     // Kwota wpisana przez użytkownika
const [validationError, setValidationError] = useState(''); // Błąd walidacji pola
```

**Przepływ walidacji:**

1. Użytkownik wprowadza kwotę → aktualizacja `amount`
2. Submit formularza → walidacja lokalna:
   - Puste pole → `validationError = "Kwota jest wymagana"`
   - Kwota < minimumInvestment → `validationError = "Kwota musi wynosić co najmniej X,XX zł"`
   - Kwota > 100 000 000 → `validationError = "Kwota jest zbyt duża"`
3. Walidacja OK → wywołanie `onSubmit(amount)` z rodzica
4. Błąd z API → rodzic ustawia `error`, wyświetlany w BaseAlert

**Zarządzanie stanem - bez custom hooka:**

- Prosty stan lokalny zarządzany przez `useState`
- Brak złożonej logiki wymagającej custom hooka
- Stan jest izolowany w komponentach (nie współdzielony globalnie)

## 7. Integracja API

### Endpoint

**POST** `/api/investments`

### Request

```typescript
// Typ żądania (CreateInvestmentDTO)
{
  "offer_id": "uuid",    // string (UUID oferty)
  "amount": number       // number (kwota w PLN, np. 5000)
}
```

**Uwagi:**

- `user_id` nie jest wysyłane w body - jest pobierane z sesji użytkownika przez endpoint (context.locals.user)
- Kwota jest wysyłana w PLN (np. 5000), endpoint konwertuje ją na centy (500000) przed zapisem do bazy
- `status` jest automatycznie ustawiany na "pending" przez endpoint

### Response Success (201 Created)

```typescript
// Typ odpowiedzi (ApiResponse<InvestmentDTO>)
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "offer_id": "uuid",
    "amount": number,        // Kwota w PLN (z powrotem przekonwertowana z centów)
    "status": "pending",
    "created_at": "ISO8601",
    "completed_at": null,
    "reason": null,
    "deleted_at": null
  },
  "message": "Inwestycja została utworzona pomyślnie"
}
```

### Response Error (400 Bad Request - walidacja)

```typescript
{
  "error": "Validation failed",
  "message": "Podane dane są nieprawidłowe",
  "details": [
    {
      "field": "amount",
      "message": "Kwota musi wynosić co najmniej 1 000,00 zł",
      "code": "too_small"
    }
  ]
}
```

### Response Error (401 Unauthorized)

```typescript
{
  "error": "Unauthorized",
  "message": "Musisz być zalogowany, aby dokonać inwestycji"
}
```

### Response Error (404 Not Found)

```typescript
{
  "error": "Not Found",
  "message": "Nie znaleziono oferty o podanym ID"
}
```

### Response Error (400 Bad Request - biznesowa)

```typescript
{
  "error": "Bad Request",
  "message": "Ta oferta nie jest dostępna do inwestycji" // lub inne komunikaty biznesowe
}
```

### Implementacja wywołania API w komponencie

```typescript
async function handleInvestmentSubmit(amount: number) {
  setIsSubmitting(true);
  setError(null);

  try {
    const response = await fetch('/api/investments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        offer_id: offerId,
        amount: amount,
      } satisfies CreateInvestmentDTO),
    });

    const result: ApiResponse<InvestmentDTO> = await response.json();

    if (!response.ok) {
      // Obsługa błędów walidacji
      if (response.status === 400 && 'details' in result) {
        const validationErrors = (result as ApiErrorResponse).details;
        const errorMessages = validationErrors?.map(e => e.message).join(', ');
        setError(errorMessages || result.error || 'Wystąpił błąd walidacji');
      } else {
        setError(result.error || 'Wystąpił błąd podczas tworzenia inwestycji');
      }
      return;
    }

    // Sukces - zamknij modal i przekieruj
    setIsOpen(false);
    window.location.href = '/investments';
    
  } catch (err) {
    setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
  } finally {
    setIsSubmitting(false);
  }
}
```

## 8. Interakcje użytkownika

### 1. Otwieranie modalu

**Akcja:** Użytkownik klika przycisk "Inwestuj teraz"  
**Warunek:** Przycisk jest aktywny (oferta active, użytkownik Signer)  
**Rezultat:**

- Modal się otwiera z animacją fade-in i zoom-in
- Focus przenosi się na pole kwoty
- Overlay (tło) jest przyciemnione
- Scroll strony głównej jest zablokowany

### 2. Wprowadzanie kwoty

**Akcja:** Użytkownik wpisuje kwotę w pole input  
**Rezultat:**

- Wartość jest zapisywana w stanie `amount`
- Pole akceptuje tylko liczby (type="number")
- Usunięcie poprzedniego błędu walidacji (jeśli był)
- Hint z minimalną kwotą jest widoczny pod polem

### 3. Próba submisji z nieprawidłową kwotą

**Akcja:** Użytkownik klika "Inwestuj" bez wpisania kwoty lub z kwotą poniżej minimum  
**Rezultat:**

- Formularz NIE jest wysyłany do API
- Pod polem input pojawia się czerwony komunikat błędu:
  - Puste pole: "Kwota jest wymagana"
  - Kwota < minimum: "Kwota musi wynosić co najmniej 1 000,00 zł"
  - Kwota > max: "Kwota jest zbyt duża"
- Pole input otrzymuje czerwone obramowanie (variant="error")
- Focus pozostaje w polu input

### 4. Submisja poprawnej kwoty

**Akcja:** Użytkownik klika "Inwestuj" z prawidłową kwotą  
**Rezultat:**

- Przycisk "Inwestuj" przechodzi w stan loading (spinner + disabled)
- Przycisk "Anuluj" staje się disabled
- Wysyłane jest żądanie POST do `/api/investments`
- Użytkownik nie może zamknąć modalu do zakończenia operacji

### 5. Sukces inwestycji

**Akcja:** API zwraca status 201 Created  
**Rezultat:**

- Modal zamyka się z animacją
- Użytkownik jest przekierowywany do `/investments` (lista jego inwestycji)
- Nowa inwestycja pojawia się na liście ze statusem "oczekująca"

### 6. Błąd API - walidacja

**Akcja:** API zwraca status 400 Bad Request z szczegółami walidacji  
**Rezultat:**

- Przycisk "Inwestuj" wraca do normalnego stanu
- W górnej części modalu pojawia się BaseAlert (variant="error") z komunikatem:
  - "Kwota musi wynosić co najmniej X,XX zł" (jeśli walidacja minimum)
  - Inne komunikaty zwrócone przez API
- Modal pozostaje otwarty
- Użytkownik może poprawić kwotę i spróbować ponownie

### 7. Błąd API - inny

**Akcja:** API zwraca status 404, 401 lub 500  
**Rezultat:**

- Przycisk "Inwestuj" wraca do normalnego stanu
- BaseAlert (variant="error") wyświetla odpowiedni komunikat:
  - 401: "Musisz być zalogowany, aby dokonać inwestycji"
  - 404: "Nie znaleziono oferty"
  - 400: "Ta oferta nie jest dostępna do inwestycji"
  - 500: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Modal pozostaje otwarty

### 8. Błąd połączenia

**Akcja:** Fetch rzuca wyjątek (brak połączenia sieciowego)  
**Rezultat:**

- BaseAlert wyświetla: "Wystąpił błąd połączenia. Spróbuj ponownie."
- Modal pozostaje otwarty

### 9. Anulowanie inwestycji

**Akcja:** Użytkownik klika przycisk "Anuluj"  
**Rezultat:**

- Modal zamyka się z animacją
- Stan formularza jest resetowany
- Użytkownik wraca do strony szczegółów oferty

### 10. Zamykanie modalu (X lub kliknięcie poza)

**Akcja:** Użytkownik klika ikonę X lub kliknięcie overlay  
**Warunek:** Nie trwa submisja (`isSubmitting = false`)  
**Rezultat:**

- Modal zamyka się z animacją
- Stan formularza jest resetowany
- Błędy są czyszczone

## 9. Warunki i walidacja

### Warunki widoczności i dostępności

1. **Widoczność przycisku "Inwestuj"** (w OfferInvestmentCTA):
   - Oferta ma status `active`
   - Użytkownik ma rolę `signer`
   - Jeśli którykolwiek warunek nie jest spełniony: przycisk jest disabled z odpowiednim komunikatem

2. **Możliwość otwarcia modalu**:
   - Przycisk "Inwestuj" musi być enabled (warunki wyżej)
   - Po kliknięciu: modal otwiera się natychmiast

3. **Możliwość zamknięcia modalu**:
   - Modal można zamknąć tylko gdy `isSubmitting = false`
   - Podczas submisji wszystkie elementy zamykające są disabled

### Walidacja po stronie frontendu (InvestmentForm)

**Pole "Kwota inwestycji":**

1. **Wymagane pole**:
   - Warunek: `amount === '' || amount === null || amount === undefined`
   - Komunikat: "Kwota jest wymagana"
   - Komponent: BaseFormField (error prop)

2. **Minimalna wartość**:
   - Warunek: `amount < minimumInvestment`
   - Komunikat: `Kwota musi wynosić co najmniej ${formatCurrency(minimumInvestment)}`
   - Przykład: "Kwota musi wynosić co najmniej 1 000,00 zł"
   - Komponent: BaseFormField (error prop)

3. **Maksymalna wartość**:
   - Warunek: `amount > 100000000`
   - Komunikat: "Kwota jest zbyt duża (maksymalnie 100 000 000 zł)"
   - Komponent: BaseFormField (error prop)

4. **Wartość dodatnia**:
   - Warunek: `amount <= 0`
   - Komunikat: "Kwota musi być większa od 0"
   - Komponent: BaseFormField (error prop)

**Funkcja walidacji:**

```typescript
function validateAmount(amount: number | '', minimumInvestment: number): string {
  if (amount === '' || amount === null || amount === undefined) {
    return "Kwota jest wymagana";
  }
  
  if (amount <= 0) {
    return "Kwota musi być większa od 0";
  }
  
  if (amount < minimumInvestment) {
    return `Kwota musi wynosić co najmniej ${formatCurrency(minimumInvestment)}`;
  }
  
  if (amount > 100000000) {
    return "Kwota jest zbyt duża (maksymalnie 100 000 000 zł)";
  }
  
  return ''; // Brak błędu
}
```

### Walidacja po stronie backendu (endpoint `/api/investments`)

Walidacja wykonywana przez `createInvestmentSchema` (zod):

1. `offer_id` - musi być UUID
2. `amount` - musi być liczbą dodatnią, max 100 000 000

Walidacja biznesowa w serwisie `InvestmentsService`:

1. Oferta musi istnieć (404)
2. Oferta musi mieć status `active` (400)
3. Oferta nie może być wygasła (`end_at > now`) (400)
4. Kwota musi być >= `minimum_investment` oferty (400)

**Mapowanie błędów API na komunikaty:**

- 401 → "Musisz być zalogowany, aby dokonać inwestycji"
- 404 → "Nie znaleziono oferty"
- 400 (walidacja) → Komunikat z `details[0].message` lub `message`
- 400 (biznesowa) → Komunikat z `message` (np. "Ta oferta nie jest dostępna")
- 500 → "Wystąpił błąd serwera. Spróbuj ponownie później."

### Wpływ walidacji na stan interfejsu

| Stan walidacji | Pole input | Przycisk Submit | Alert | Modal |
|----------------|------------|-----------------|-------|-------|
| Brak błędu | Normalne obramowanie | Enabled | Niewidoczny | Otwarty |
| Błąd lokalny (frontend) | Czerwone obramowanie + error text | Enabled (można retry) | Niewidoczny | Otwarty |
| Submisja w trakcie | Disabled | Disabled + spinner | Niewidoczny | Otwarty (nie można zamknąć) |
| Błąd API | Normalne obramowanie | Enabled | Widoczny (error) | Otwarty |
| Sukces | - | - | - | Zamknięty + redirect |

## 10. Obsługa błędów

### Kategorie błędów

#### 1. Błędy walidacji formularza (frontend)

**Gdzie występują:** InvestmentForm  
**Jak obsłużone:**

- Walidacja przed submisją (funkcja `validateAmount`)
- Wyświetlanie pod polem input przez BaseFormField (prop `error`)
- Czerwone obramowanie pola (variant="error")
- Formularz nie jest wysyłany do API

**Przykłady:**

- "Kwota jest wymagana"
- "Kwota musi wynosić co najmniej 1 000,00 zł"
- "Kwota jest zbyt duża"

#### 2. Błędy walidacji API (400 Bad Request z details)

**Gdzie występują:** Odpowiedź API  
**Jak obsłużone:**

- Wychwycenie w bloku try-catch w `handleInvestmentSubmit`
- Parsowanie `details` z odpowiedzi (`ApiErrorResponse`)
- Agregacja komunikatów: `details.map(e => e.message).join(', ')`
- Wyświetlanie w BaseAlert (variant="error") w górnej części modalu
- Modal pozostaje otwarty

**Przykłady:**

- "Kwota musi być większa od 0"
- "Nieprawidłowy format ID oferty"

#### 3. Błędy biznesowe API (400 Bad Request)

**Gdzie występują:** Odpowiedź API  
**Jak obsłużone:**

- Wychwycenie w bloku try-catch
- Wyświetlanie `message` z odpowiedzi w BaseAlert (variant="error")
- Modal pozostaje otwarty

**Przykłady:**

- "Ta oferta nie jest dostępna do inwestycji"
- "Oferta jest już nieaktywna"

#### 4. Błędy autoryzacji (401 Unauthorized)

**Gdzie występują:** Odpowiedź API  
**Jak obsłużone:**

- Wychwycenie w bloku try-catch
- Wyświetlanie komunikatu w BaseAlert: "Musisz być zalogowany, aby dokonać inwestycji"
- Opcjonalnie: przekierowanie do `/login?redirect=/offers/${offerId}`

#### 5. Błędy "nie znaleziono" (404 Not Found)

**Gdzie występują:** Odpowiedź API  
**Jak obsłużone:**

- Wychwycenie w bloku try-catch
- Wyświetlanie komunikatu: "Nie znaleziono oferty"
- Modal pozostaje otwarty (użytkownik może zamknąć ręcznie)

#### 6. Błędy serwera (500 Internal Server Error)

**Gdzie występują:** Odpowiedź API  
**Jak obsłużone:**

- Wychwycenie w bloku try-catch
- Wyświetlanie komunikatu: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Modal pozostaje otwarty

#### 7. Błędy połączenia sieciowego

**Gdzie występują:** Fetch rzuca wyjątek  
**Jak obsłużone:**

- Wychwycenie w bloku catch
- Wyświetlanie komunikatu: "Wystąpił błąd połączenia. Spróbuj ponownie."
- Modal pozostaje otwarty

### Strategia obsługi błędów w kodzie

```typescript
try {
  // Fetch do API
  const response = await fetch('/api/investments', {...});
  const result: ApiResponse<InvestmentDTO> = await response.json();

  if (!response.ok) {
    // Błąd HTTP
    if (response.status === 400 && 'details' in result) {
      // Błąd walidacji z details
      const validationErrors = (result as ApiErrorResponse).details;
      const errorMessages = validationErrors?.map(e => e.message).join(', ');
      setError(errorMessages || 'Wystąpił błąd walidacji');
    } else if (response.status === 401) {
      setError('Musisz być zalogowany, aby dokonać inwestycji');
      // Opcjonalnie: setTimeout(() => window.location.href = '/login', 2000);
    } else if (response.status === 404) {
      setError('Nie znaleziono oferty');
    } else {
      // Inne błędy (400 biznesowe, 500, etc.)
      setError(result.message || result.error || 'Wystąpił błąd podczas tworzenia inwestycji');
    }
    return;
  }

  // Sukces
  setIsOpen(false);
  window.location.href = '/investments';
  
} catch (err) {
  // Błąd połączenia lub parsowania JSON
  setError('Wystąpił błąd połączenia. Spróbuj ponownie.');
} finally {
  setIsSubmitting(false);
}
```

### Przypadki brzegowe

1. **Użytkownik próbuje wysłać formularz wielokrotnie (spam):**
   - Przycisk jest disabled podczas `isSubmitting = true`
   - Nie można wysłać więcej niż jedno żądanie naraz

2. **Oferta została zamknięta podczas otwartego modalu:**
   - API zwróci błąd 400: "Ta oferta nie jest dostępna"
   - Wyświetlany jako BaseAlert
   - Po zamknięciu modalu przycisk "Inwestuj" będzie disabled

3. **Użytkownik wylogował się w innej zakładce:**
   - API zwróci 401 Unauthorized
   - Wyświetlenie komunikatu + opcjonalne przekierowanie do logowania

4. **Wprowadzenie bardzo dużej liczby (overflow):**
   - Walidacja frontend: max 100 000 000
   - Walidacja backend: max 100 000 000
   - Komunikat: "Kwota jest zbyt duża"

5. **Wprowadzenie liczby ujemnej:**
   - HTML input type="number" blokuje minus (ale można ominąć)
   - Walidacja frontend: `amount <= 0` → "Kwota musi być większa od 0"
   - Walidacja backend: zod `positive()` → zwraca błąd

## 11. Kroki implementacji

### Krok 1: Utworzenie komponentu InvestmentForm

**Plik:** `src/components/forms/InvestmentForm.tsx`

1. Zdefiniuj interface `InvestmentFormProps`
2. Utwórz komponent funkcyjny z propsami
3. Dodaj stan lokalny: `amount`, `validationError`
4. Zaimplementuj funkcję walidacji `validateAmount`
5. Zaimplementuj handler `handleSubmit`:
   - Walidacja kwoty
   - Jeśli OK: wywołaj `onSubmit(amount)` z propsa
   - Jeśli błąd: ustaw `validationError`
6. Zbuduj JSX formularza:
   - Element `<form>` z `onSubmit={handleSubmit}`
   - `BaseFormField` dla kwoty:
     - `label="Kwota inwestycji (PLN)"`
     - `inputProps`: type="number", min={minimumInvestment}, step="0.01"
     - `error={validationError}`
     - `helpText`: wyświetl minimalną kwotę
   - Przyciski w footer:
     - `BaseButton` Submit: type="submit", variant="primary", disabled={isSubmitting}, loading={isSubmitting}
     - `BaseButton` Anuluj: type="button", variant="outline", onClick={onCancel}, disabled={isSubmitting}
7. Dodaj export komponentu

**Test manualny:**

- Formularz renderuje się poprawnie
- Walidacja działa lokalnie
- Przyciski są disabled podczas submisji

### Krok 2: Utworzenie komponentu InvestmentModal

**Plik:** `src/components/forms/InvestmentModal.tsx`

1. Zaimportuj zależności:
   - Dialog komponenty z `src/components/ui/dialog`
   - `InvestmentForm` z kroku 1
   - `BaseAlert` z `src/components/base/BaseAlert`
   - Typy: `CreateInvestmentDTO`, `InvestmentDTO`, `ApiResponse` z `src/types`
   - Utility: `formatCurrency` z `src/lib/utils`
2. Zdefiniuj interface `InvestmentModalProps`
3. Utwórz komponent funkcyjny z propsami
4. Dodaj stan lokalny: `isOpen`, `isSubmitting`, `error`
5. Zaimplementuj funkcję `handleInvestmentSubmit`:
   - Ustaw `isSubmitting = true`, `error = null`
   - Wywołaj fetch POST do `/api/investments`
   - Obsłuż odpowiedź:
     - Sukces (201): zamknij modal, przekieruj do `/investments`
     - Błąd (400/401/404/500): ustaw `error` z komunikatem
   - Catch: obsłuż błędy połączenia
   - Finally: ustaw `isSubmitting = false`
6. Zaimplementuj funkcję `handleCancel`:
   - Zamknij modal: `setIsOpen(false)`
   - Reset stanu: `setError(null)`
7. Zbuduj JSX modalu:
   - `Dialog` z kontrolowanym `open={isOpen}` i `onOpenChange={setIsOpen}`
   - `DialogTrigger` z `children` (przycisk z propsa)
   - `DialogContent`:
     - `DialogHeader` z tytułem "Inwestuj w ofertę" i opisem
     - `BaseAlert` (conditional): jeśli `error` nie null, wyświetl z variant="error"
     - `InvestmentForm` z propsami:
       - `minimumInvestment={minimumInvestment}`
       - `isSubmitting={isSubmitting}`
       - `onSubmit={handleInvestmentSubmit}`
       - `onCancel={handleCancel}`
8. Dodaj export komponentu

**Test manualny:**

- Modal otwiera się i zamyka poprawnie
- Formularz jest renderowany wewnątrz modalu
- Błędy API są wyświetlane w BaseAlert

### Krok 3: Modyfikacja komponentu OfferInvestmentCTA

**Plik:** `src/components/offer-details/OfferInvestmentCTA.tsx`

1. Zaimportuj `InvestmentModal` z kroku 2
2. Dodaj prop `minimumInvestment: number` do `OfferInvestmentCTAProps`
3. Zastąp istniejący przycisk "Inwestuj" przez `InvestmentModal`:
   - Zachowaj całą logikę `getButtonState` i `canInvest`
   - Zawiń przycisk w `<InvestmentModal offerId={offerId} minimumInvestment={minimumInvestment}>`
   - Przycisk staje się `children` dla `InvestmentModal`
4. Usuń starą logikę `handleInvestClick` z nawigacją do `/investments/new?offerId=...`

**Diff:**

```diff
- const handleInvestClick = () => {
-   if (isEnabled) {
-     window.location.href = `/investments/new?offerId=${offerId}`;
-   }
- };

  return (
    <div className="...">
      <h2>Zainteresowany?</h2>

-     <button
-       type="button"
-       onClick={handleInvestClick}
-       disabled={buttonState.disabled}
-       className="..."
-     >
-       {buttonState.text}
-     </button>

+     <InvestmentModal offerId={offerId} minimumInvestment={minimumInvestment}>
+       <button
+         type="button"
+         disabled={buttonState.disabled}
+         className="..."
+       >
+         {buttonState.text}
+       </button>
+     </InvestmentModal>

      {/* reszta kodu bez zmian */}
    </div>
  );
```

### Krok 4: Modyfikacja komponentu OfferDetailsPage

**Plik:** `src/components/OfferDetailsPage.tsx`

1. Rozszerz `OfferDetailsViewModel` o pole `minimum_investment: number`
2. Zaktualizuj funkcję `transformToViewModel`:
   - Dodaj konwersję `minimum_investment: dto.minimum_investment` (bez formatCurrency, jako number)
3. Przekaż `minimumInvestment` do `OfferInvestmentCTA`:

   ```tsx
   <OfferInvestmentCTA
     offerId={offer.id}
     offerStatus={offer.status}
     userRole={userRole}
     minimumInvestment={offer.minimum_investment}
   />
   ```

**Uwaga:** `minimum_investment` z API jest już w PLN (backend konwertuje z centów), więc nie trzeba dzielić przez 100.

### Krok 5: Aktualizacja typów w src/types.ts

**Plik:** `src/types.ts`

1. Zmodyfikuj interface `OfferDetailsViewModel`:

   ```typescript
   export interface OfferDetailsViewModel {
     id: string;
     name: string;
     status: OfferStatus;
     description: string;
     images: string[];
     target_amount: string;          // Sformatowany (dla wyświetlenia)
     minimum_investment: string;     // Sformatowany (dla wyświetlenia)
     minimum_investment_raw: number; // Raw number (dla walidacji w formularzu)
   }
   ```

   LUB (prostsze podejście):

   ```typescript
   export interface OfferDetailsViewModel {
     id: string;
     name: string;
     status: OfferStatus;
     description: string;
     images: string[];
     target_amount: string;
     minimum_investment: string;
     // Dodaj surową wartość dla walidacji:
   }
   ```

2. W `OfferDetailsPage.tsx` przekaż surową wartość z DTO:

   ```typescript
   function transformToViewModel(dto: OfferWithImagesDTO): OfferDetailsViewModel {
     return {
       // ... inne pola
       minimum_investment: formatCurrency(dto.minimum_investment),
     };
   }
   
   // W JSX:
   <OfferInvestmentCTA
     minimumInvestment={dto.minimum_investment} // Przekaż surową wartość z DTO, nie z VM
   />
   ```

**Uwaga:** Zalecam drugi wariant (przekazanie surowej wartości z DTO bezpośrednio do CTA), aby uniknąć duplikacji w ViewModel.

### Krok 6: Testowanie manualne

1. **Test pozytywny - sukces inwestycji:**
   - Zaloguj się jako Signer
   - Wejdź na stronę szczegółów oferty (status: active)
   - Kliknij "Inwestuj teraz"
   - Modal się otwiera
   - Wpisz kwotę >= minimalnej (np. 5000)
   - Kliknij "Inwestuj"
   - Sprawdź: modal się zamyka, redirect do `/investments`
   - Sprawdź: nowa inwestycja jest na liście ze statusem "oczekująca"

2. **Test walidacji - puste pole:**
   - Otwórz modal
   - Nie wpisuj niczego
   - Kliknij "Inwestuj"
   - Sprawdź: błąd "Kwota jest wymagana" pod polem

3. **Test walidacji - kwota poniżej minimum:**
   - Otwórz modal
   - Wpisz kwotę < minimalnej (np. 100 gdy minimum to 1000)
   - Kliknij "Inwestuj"
   - Sprawdź: błąd "Kwota musi wynosić co najmniej 1 000,00 zł"

4. **Test walidacji - kwota zbyt duża:**
   - Otwórz modal
   - Wpisz kwotę > 100000000
   - Kliknij "Inwestuj"
   - Sprawdź: błąd "Kwota jest zbyt duża"

5. **Test błędu API - oferta nieaktywna:**
   - Jako Admin, zmień status oferty na "closed"
   - Otwórz modal (jeśli się jeszcze otwiera)
   - Wpisz prawidłową kwotę
   - Kliknij "Inwestuj"
   - Sprawdź: BaseAlert z komunikatem "Ta oferta nie jest dostępna"

6. **Test anulowania:**
   - Otwórz modal
   - Wpisz kwotę
   - Kliknij "Anuluj"
   - Sprawdź: modal się zamyka, dane są zresetowane

7. **Test zamykania modalu:**
   - Otwórz modal
   - Kliknij ikonę X
   - Sprawdź: modal się zamyka
   - Otwórz ponownie
   - Kliknij poza modalem (na overlay)
   - Sprawdź: modal się zamyka

8. **Test disabled podczas submisji:**
   - Otwórz modal, wpisz kwotę
   - Kliknij "Inwestuj"
   - Podczas ładowania spróbuj:
     - Kliknąć "Anuluj" → disabled
     - Kliknąć X → disabled
     - Kliknąć poza modalem → nie zamyka się
   - Sprawdź: spinner na przycisku "Inwestuj"

### Krok 7: Opcjonalne - Testy jednostkowe

1. **Test InvestmentForm - walidacja:**

   ```typescript
   // src/components/forms/InvestmentForm.test.tsx
   describe('InvestmentForm', () => {
     it('should show error when amount is empty', () => {});
     it('should show error when amount is below minimum', () => {});
     it('should call onSubmit with valid amount', () => {});
     it('should disable buttons during submission', () => {});
   });
   ```

2. **Test InvestmentModal - integracja API:**

   ```typescript
   // src/components/forms/InvestmentModal.test.tsx
   describe('InvestmentModal', () => {
     it('should submit investment successfully', () => {});
     it('should display API error in alert', () => {});
     it('should close modal after success', () => {});
   });
   ```

### Krok 8: Dokumentacja i cleanup

1. Dodaj komentarze JSDoc do nowych komponentów
2. Sprawdź, czy wszystkie importy są użyte
3. Sprawdź accessibility (ARIA labels, keyboard navigation)
4. Zaktualizuj README projektu (jeśli potrzebne)
5. Commit z opisem: "feat: Add investment modal for offer details"

---

**Podsumowanie:** Po wykonaniu wszystkich kroków użytkownik będzie mógł inwestować w oferty poprzez intuicyjny modal z walidacją i obsługą błędów, zgodnie z wymaganiami z PRD (US-006).
