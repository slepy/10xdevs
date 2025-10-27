# Dokument wymagań produktu (PRD) - BlindInvest

## 1. Przegląd produktu

BlindInvest to aplikacja internetowa w wersji MVP (Minimum Viable Product), której celem jest uproszczenie procesu inwestycyjnego. Aplikacja agreguje oferty inwestycyjne z różnych platform, umożliwiając użytkownikom ich przeglądanie i inwestowanie bez konieczności samodzielnego wyszukiwania i analizowania. Produkt skierowany jest do dwóch głównych typów użytkowników: Inwestorów (Signer), którzy poszukują możliwości inwestycyjnych, oraz Administratorów (Admin), którzy zarządzają ofertami i całym procesem inwestycyjnym w ramach platformy.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje BlindInvest, jest złożoność i czasochłonność procesu wyszukiwania i analizowania ofert inwestycyjnych rozproszonych w internecie. Potencjalni inwestorzy muszą poświęcać znaczną ilość czasu na przeglądanie wielu źródeł, porównywanie ofert i weryfikację ich wiarygodności. Aplikacja ma na celu centralizację tego procesu, dostarczając wyselekcjonowane oferty w jednym miejscu i upraszczając procedurę składania deklaracji inwestycyjnych.

## 3. Wymagania funkcjonalne

Wersja MVP aplikacji będzie zawierać następujące funkcjonalności:

- FU-01: Uwierzytelnianie użytkowników: Możliwość rejestracji i logowania dla użytkowników o roli "Signer". Dostęp dla roli "Admin" jest predefiniowany.
- FU-02: Zarządzanie użytkownikami: Administrator ma dostęp do listy zarejestrowanych użytkowników.
- FU-03: Zarządzanie ofertami: Administrator może tworzyć, edytować i zarządzać statusami ofert inwestycyjnych.
- FU-04: Przeglądanie ofert: Tylko zalogowani użytkownicy mogą przeglądać aktywne oferty inwestycyjne. Niezalogowani użytkownicy są przekierowywani do strony logowania.
- FU-05: Proces inwestycyjny: Użytkownik "Signer" może złożyć deklarację inwestycyjną na wybraną ofertę.
- FU-06: Zarządzanie inwestycjami: Administrator zarządza cyklem życia inwestycji (akceptacja, odrzucenie, zamknięcie).
- FU-07: Zarządzanie dokumentami: Administrator może dodawać dokumenty do zaakceptowanych inwestycji.
- FU-08: Anulowanie inwestycji: Użytkownik "Signer" może anulować swoją inwestycję, dopóki ma ona status "oczekująca".
- FU-09: Powiadomienia: Użytkownicy otrzymują powiadomienia o kluczowych zmianach statusu ich inwestycji.

## 3.1. System Nawigacji

Aplikacja posiada zróżnicowany system nawigacji dostosowany do stanu logowania i roli użytkownika:

### Nawigacja dla niezalogowanych użytkowników

Menu główne zawiera:

- **Strona główna** - strona powitalna z informacjami o platformie
- **O nas** - informacje o firmie i zespole
- **Zaloguj się** - link do strony logowania
- **Zarejestruj się** - przycisk call-to-action prowadzący do rejestracji

Niezalogowani użytkownicy próbujący uzyskać dostęp do chronionych zasobów są automatycznie przekierowywani do strony logowania z zachowaniem docelowego URL (parametr `?redirect=`).

### Nawigacja dla zalogowanych użytkowników (Signer)

Menu główne zawiera:

- **Oferty** - przeglądanie dostępnych ofert inwestycyjnych
- **Moje Inwestycje** - lista wszystkich inwestycji użytkownika

Dodatkowo, każdy zalogowany użytkownik ma dostęp do **rozwijanego menu użytkownika** (w prawym górnym rogu), które zawiera:

- Wyświetlanie informacji użytkownika (imię, nazwisko, email, rola)
- **Mój profil** - edycja danych osobowych
- **Wyloguj się** - zakończenie sesji

### Nawigacja dla administratorów (Admin)

Menu główne zawiera:

- **Oferty** - przeglądanie dostępnych ofert inwestycyjnych (widok identyczny jak dla Signer)
- **Panel Admin** - dostęp do panelu administracyjnego

Po wejściu do panelu administracyjnego, administrator jest automatycznie przekierowywany do sekcji zarządzania ofertami (`/admin/offers`).

W panelu administracyjnym dostępne jest submenu (sidebar) z następującymi sekcjami:

- **Oferty** - zarządzanie ofertami (CRUD)
- **Inwestycje** - zarządzanie inwestycjami użytkowników
- **Użytkownicy** - przeglądanie listy zarejestrowanych użytkowników

Menu użytkownika dla administratora jest identyczne jak dla użytkownika Signer (Mój profil, Wyloguj się).

### Przekierowania automatyczne

- Zalogowani użytkownicy wchodząc na stronę główną (`/`) są automatycznie przekierowywani:
  - **Signer** → `/offers` (lista ofert)
  - **Admin** → `/admin` (panel administracyjny)
- Próba dostępu do stron logowania/rejestracji przez zalogowanych użytkowników skutkuje przekierowaniem do odpowiedniej strony startowej
- Próba dostępu do zasobów wymagających uprawnień administratora przez użytkowników Signer skutkuje przekierowaniem do strony "Brak uprawnień" (403)

## 4. Granice produktu

Następujące funkcjonalności nie wchodzą w zakres wersji MVP i mogą zostać rozważone w przyszłych iteracjach produktu:

- System zapraszania nowych użytkowników.
- Rozbudowane profile inwestycyjne użytkowników.
- Zaawansowane mechanizmy analizy i rekomendacji ofert.
- Integracje z zewnętrznymi systemami płatności do obsługi transakcji finansowych.
- System ról i uprawnień wykraczający poza predefiniowane role "Signer" i "Admin".
- Bezpośrednia komunikacja (czat) między użytkownikami a administratorami.

## 5. Historyjki użytkowników

### Uwierzytelnianie i Autoryzacja

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika "Signer"
- Opis: Jako nowy użytkownik, chcę móc zarejestrować konto w aplikacji, podając swoje dane, abym mógł uzyskać dostęp do funkcji inwestowania.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na imię, nazwisko, adres e-mail i hasło.
  2. Hasło musi spełniać minimalne wymagania bezpieczeństwa (np. 8 znaków, jedna duża litera, jedna cyfra).
  3. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.
  4. Nowo zarejestrowany użytkownik automatycznie otrzymuje rolę "Signer".
  5. System uniemożliwia rejestrację na już istniejący adres e-mail.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na swoje konto za pomocą adresu e-mail i hasła, aby uzyskać dostęp do spersonalizowanych treści.
- Kryteria akceptacji:
  1. Formularz logowania zawiera pola na adres e-mail i hasło.
  2. Po poprawnym zalogowaniu użytkownik jest przekierowywany na stronę główną.
  3. W przypadku podania błędnych danych logowania, wyświetlany jest odpowiedni komunikat.
  4. Użytkownik "Admin" loguje się przy użyciu tych samych pól, ale jego rola jest już przypisana w systemie.

### Przeglądanie Ofert

- ID: US-003
- Tytuł: Przeglądanie listy ofert inwestycyjnych
- Opis: Jako gość lub zalogowany użytkownik, chcę móc przeglądać listę wszystkich aktywnych ofert inwestycyjnych, aby zorientować się w dostępnych możliwościach.
- Kryteria akceptacji:
  1. Strona "Preview Offers" jest dostępna dla wszystkich odwiedzających.
  2. Na liście wyświetlane są kluczowe informacje o każdej ofercie (np. nazwa, kluczowe wskaźniki).
  3. Użytkownik może kliknąć na ofertę, aby zobaczyć jej szczegóły.

### Zarządzanie Ofertami (Admin)

- ID: US-004
- Tytuł: Tworzenie nowej oferty inwestycyjnej
- Opis: Jako Administrator, chcę móc tworzyć nowe oferty inwestycyjne poprzez dedykowany formularz, aby udostępnić je potencjalnym inwestorom.
- Kryteria akceptacji:
  1. Formularz tworzenia oferty zawiera pola na nazwę, opis, kwotę docelową, minimalną kwotę inwestycji i datę zakończenia.
  2. Po wypełnieniu formularza i zapisaniu, nowa oferta pojawia się na liście ofert w panelu administratora ze statusem "draft".

- ID: US-005
- Tytuł: Edycja istniejącej oferty inwestycyjnej
- Opis: Jako Administrator, chcę móc edytować istniejące oferty, aby zaktualizować ich szczegóły lub poprawić błędy.
- Kryteria akceptacji:
  1. Administrator może wybrać opcję edycji przy każdej ofercie na liście w panelu "Manage Offers".
  2. Formularz edycji jest wypełniony aktualnymi danymi oferty.
  3. Po zapisaniu zmian, zaktualizowane informacje są widoczne w szczegółach oferty.

### Proces Inwestycyjny (Signer)

- ID: US-006
- Tytuł: Składanie deklaracji inwestycyjnej
- Opis: Jako zalogowany użytkownik "Signer", chcę móc złożyć deklarację inwestycyjną na wybraną ofertę, podając kwotę, którą chcę zainwestować.
- Kryteria akceptacji:
  1. Przycisk "Inwestuj" jest widoczny na stronie szczegółów oferty tylko dla zalogowanych użytkowników "Signer".
  2. Po kliknięciu przycisku pojawia się pole do wprowadzenia kwoty inwestycji.
  3. Kwota musi być większa lub równa minimalnej kwocie inwestycji określonej w ofercie.
  4. Po złożeniu deklaracji, inwestycja pojawia się w mojej zakładce "Inwestycje" ze statusem "oczekująca" (pending).

- ID: US-007
- Tytuł: Śledzenie statusu inwestycji
- Opis: Jako "Signer", chcę mieć dostęp do zakładki "Moje Inwestycje", gdzie mogę śledzić status wszystkich moich inwestycji.
- Kryteria akceptacji:
  1. Zakładka "Inwestycje" jest widoczna po zalogowaniu.
  2. Lista zawiera wszystkie moje inwestycje wraz z ich aktualnym statusem (oczekująca, zaakceptowana, odrzucona, zamknięta).
  3. Użytkownik może kliknąć na inwestycję, aby zobaczyć jej szczegóły.

- ID: US-008
- Tytuł: Anulowanie oczekującej inwestycji
- Opis: Jako "Signer", chcę móc anulować moją deklarację inwestycyjną, jeśli jej status wciąż jest "oczekująca".
- Kryteria akceptacji:
  1. Przycisk "Anuluj" jest widoczny przy inwestycjach ze statusem "oczekująca" w zakładce "Moje Inwestycje".
  2. Po kliknięciu i potwierdzeniu, inwestycja jest usuwana z mojej listy.
  3. Administrator otrzymuje powiadomienie o anulowaniu inwestycji.

### Zarządzanie Inwestycjami (Admin)

- ID: US-009
- Tytuł: Przeglądanie i akceptacja/odrzucenie inwestycji
- Opis: Jako Administrator, chcę otrzymywać powiadomienia o nowych inwestycjach i móc je akceptować lub odrzucać.
- Kryteria akceptacji:
  1. W panelu administratora znajduje się lista wszystkich inwestycji ze statusem "oczekująca".
  2. Administrator może zmienić status inwestycji na "zaakceptowana" lub "odrzucona".
  3. Po zmianie statusu, użytkownik "Signer" otrzymuje powiadomienie.

- ID: US-010
- Tytuł: Dodawanie dokumentów do inwestycji
- Opis: Jako Administrator, chcę móc dodawać dokumenty (np. umowy) do zaakceptowanych inwestycji.
- Kryteria akceptacji:
  1. Opcja dodawania dokumentów jest dostępna tylko dla inwestycji ze statusem "zaakceptowana".
  2. Administrator może przesłać plik (np. PDF).
  3. Przesłany dokument jest widoczny dla Inwestora ("Signer") w szczegółach jego inwestycji.

- ID: US-011
- Tytuł: Zakończenie inwestycji
- Opis: Jako Administrator, po zakończeniu procesu inwestycyjnego poza systemem, chcę móc zmienić status inwestycji na "zamknięta".
- Kryteria akceptacji:
  1. Administrator może zmienić status zaakceptowanej inwestycji na "zamknięta".
  2. Po zmianie statusu inwestycja jest oznaczona jako archiwalna i nie można już na niej wykonywać żadnych akcji.

### Zarządzanie Użytkownikami (Admin)

- ID: US-012
- Tytuł: Przeglądanie listy użytkowników
- Opis: Jako Administrator, chcę mieć dostęp do listy wszystkich zarejestrowanych użytkowników, aby monitorować bazę użytkowników.
- Kryteria akceptacji:
  1. W panelu administratora dostępna jest sekcja "Użytkownicy".
  2. Lista zawiera podstawowe informacje o użytkownikach (np. e-mail, data rejestracji).
  3. Funkcjonalność jest ograniczona do przeglądania (brak edycji i usuwania w MVP).

## 6. Metryki sukcesu

Kryteria sukcesu dla MVP będą mierzone za pomocą następujących metryk:

- Sprawne zarządzanie przez Administratora:
  1. Czas potrzebny na stworzenie i opublikowanie nowej oferty: Mierzony od otwarcia formularza do pojawienia się oferty na liście. Cel: poniżej 3 minut.
  2. Liczba kroków potrzebnych do zarządzania cyklem życia inwestycji: Mierzona liczba kliknięć od statusu "pending" do "closed". Cel: jak najmniejsza.

- Łatwość inwestowania dla użytkowników "Signer":
  1. Współczynnik konwersji: Odsetek użytkowników, którzy po wyświetleniu szczegółów oferty złożyli inwestycję.
  2. Czas spędzony na stronie składania inwestycji: Mierzony od otwarcia formularza inwestycji do jego wysłania.

- Prostota procesu inwestycyjnego:
  1. Odsetek porzuconych formularzy inwestycyjnych: Liczba rozpoczętych, ale niewysłanych deklaracji inwestycyjnych w stosunku do wszystkich rozpoczętych.
  2. Liczba anulowanych inwestycji przez użytkowników: Może wskazywać na problemy w procesie lub niezdecydowanie.
