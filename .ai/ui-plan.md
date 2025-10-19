# Architektura UI dla BlindInvest

## 1. Przegląd struktury UI

System interfejsu użytkownika został zaprojektowany jako zestaw spójnych widoków, które odpowiadają na potrzeby różnych grup użytkowników (Signer oraz Admin). Struktura opiera się na wykorzystaniu Astro layouts oraz komponentów z Shadcn/ui, co zapewnia responsywność, dostępność (ARIA) oraz spójność stylistyczną. Kluczowymi elementami są: publiczne widoki (strona główna) oraz strefy chronione – lista ofert, szczegoly oferty, inwestycje usera signer i panel administratora, z separacją logiki i widocznych opcji na podstawie roli użytkownika.

## 2. Lista widoków

### 2.1. Strona główna

- **Ścieżka widoku:** `/`

- **Główny cel:** Pierwszy kontakt użytkownika z aplikacją. Prezentacja kluczowych informacji o BlindInvest

- **Kluczowe informacje do wyświetlenia:** Krótki opis platformy, korzyści, call-to-action (przycisk "Zarejestruj się" lub "Zaloguj się").

- **Kluczowe komponenty widoku:** Hero banner, nagłówek, przyciski CTA, sekcja informacyjna.

- **UX, dostępność i bezpieczeństwo:** Responsywny design, właściwie oznaczone elementy ARIA, szybko ładujący się interfejs.

### 2.2. Logowanie

- **Ścieżka widoku:** `/login`

- **Główny cel:** Umożliwienie użytkownikom logowania, z walidacją danych i obsługą komunikatów błędów.

- **Kluczowe informacje do wyświetlenia:** Formularz logowania z polami email i hasło oraz przycisk logowania.

- **Kluczowe komponenty widoku:** Formularz, pola input, przycisk logowania, komunikaty walidacji.

- **UX, dostępność i bezpieczeństwo:** Zastosowanie wytycznych ARIA, walidacja po stronie klienta, obsługa błędów i HTTPS.

### 2.3. Rejestracja

- **Ścieżka widoku:** `/register`

- **Główny cel:** Umożliwienie nowym użytkownikom rejestracji, z walidacją danych oraz obsługą komunikatów błędów.

- **Kluczowe informacje do wyświetlenia:** Formularz rejestracji z polami email, hasło, potwierdzenie hasła oraz opcjonalne informacje.

- **Kluczowe komponenty widoku:** Formularz, pola input, przycisk rejestracji, komunikaty walidacji.

- **UX, dostępność i bezpieczeństwo:** Zastosowanie wytycznych ARIA, walidacja po stronie klienta, informowanie użytkownika o błędach oraz użycie HTTPS.

### 2.4. Lista ofert

- **Ścieżka widoku:** `/offers` jest go glowny widok po zalogowaniu

- **Główny cel:** Prezentacja aktywnych ofert inwestycyjnych dostępnych dla wszystkich użytkowników.

- **Kluczowe informacje do wyświetlenia:** Podstawowe dane oferty (nazwa, zdjecie glowne, kwota docelowa, minimalna inwestycja).

- **Kluczowe komponenty widoku:** Karty ofert

- **UX, dostępność i bezpieczeństwo:** Responsywna siatka kart, czytelność informacji, łatwa nawigacja oraz responsywne komunikaty przy błędach pobierania danych.

### 2.5. Szczegóły oferty

- **Ścieżka widoku:** `/offers/:offerId`

- **Główny cel:** Prezentacja pełnych informacji o wybranej ofercie inwestycyjnej oraz możliwość złożenia deklaracji inwestycyjnej dla zalogowanych użytkowników.

- **Kluczowe informacje do wyświetlenia:** Kompletny opis oferty, warunki inwestycji, szczegóły finansowe oraz informacje o statusie.

- **Kluczowe komponenty widoku:** Szczegółowa karta oferty, przyciski akcji (np. "Inwestuj").

- **UX, dostępność i bezpieczeństwo:** Jasny układ informacji, widoczny przycisk akcji tylko dla zalogowanych użytkowników, mechanizmy zabezpieczające przed nieautoryzowanymi akcjami.

### 2.6. Moje inwestycje (User Signer)

- **Ścieżka widoku:** `/my-investments`

- **Główny cel:** Umożliwienie użytkownikom śledzenia statusu ich inwestycji oraz składania nowych deklaracji.

- **Kluczowe informacje do wyświetlenia:** Lista inwestycji z informacjami o statusie (oczekująca, zaakceptowana, odrzucona, zamknięta), szczegóły konkretnej inwestycji.

- **Kluczowe komponenty widoku:** Tabela lub karty inwestycji, przyciski akcji (np. "Anuluj inwestycję"), filtry i paginacja.

- **UX, dostępność i bezpieczeństwo:** Intuicyjna struktura danych, wsparcie dla urządzeń mobilnych, potwierdzenia akcji (modale) oraz informacje o błędach.

### 2.7. Panel administratora

- **Ścieżka widoku:** `/admin/dashboard`

- **Główny cel:** Kompleksowe zarządzanie użytkownikami, ofertami, inwestycjami i powiadomieniami.

- **Kluczowe informacje do wyświetlenia:** Oddzielne sekcje/zakładki dla zarządzania użytkownikami, ofertami, inwestycjami oraz powiadomieniami.

- **Kluczowe komponenty widoku:** Nawigacja typu sidebar lub zakładki, tabele z danymi, formularze do tworzenia/edycji ofert, modale potwierdzające akcje, alerty systemowe.

- **UX, dostępność i bezpieczeństwo:** Ograniczenia dostępu tylko dla administratorów, czytelny interfejs z podziałem na sekcje, mechanizmy potwierdzające krytyczne akcje oraz pełna zgodność z wytycznymi ARIA.

## 3. Mapa podróży użytkownika

1. **Wejście na stronę główną:** Użytkownik trafia do aplikacji, gdzie widzi ogólne informacje i przyciski do logowania/rejestracji.

2. **Logowanie/Rejestracja:**
   - **Logowanie:** Nowy lub powracający użytkownik przechodzi do formularza logowania, uzyskując dostęp do pełnej funkcjonalności.
   - **Rejestracja:** Nowy użytkownik przechodzi do formularza rejestracji, tworząc konto i uzyskując pełny dostęp do funkcjonalności.

3. **Przeglądanie ofert:** Użytkownik kierowany jest do listy ofert, gdzie przegląda dostępne inwestycje. Może filtrować wyniki wg. statusu czy kluczowych parametrów.

4. **Szczegóły oferty:** Po kliknięciu na konkretną ofertę, użytkownik widzi pełny opis oferty. Zalogowani użytkownicy (Signer) mają dodatkowo możliwość złożenia deklaracji inwestycyjnej.

5. **Moje inwestycje (User Signer):** Po zalogowaniu, użytkownik może przejść do panelu "Moje Inwestycje", gdzie śledzi status swoich deklaracji, a w razie potrzeby anuluje oczekujące inwestycje.

6. **Panel administratora:** Administrator loguje się i ma dostęp do rozbudowanego panelu zarządzania, z którego może m.in. tworzyć oferty, zatwierdzać lub odrzucać inwestycje oraz monitorować bazę użytkowników.

## 4. Układ i struktura nawigacji

- **Publiczna nawigacja:** Główny pasek nawigacyjny umieszczony u góry, zawierający linki do strony głównej oraz opcji logowania/rejestracji.

- **Nawigacja dla zalogowanych użytkowników (Signer):** Po zalogowaniu, użytkownik widzi sidebar menu z opcjami: lista ofert, i "Moje Inwestycje".

- **Nawigacja administratora:** Panel administratora widzi sidebar menu z opcjami: lista ofert, dashboard z podrzednymi opcjami: zarządzaniem użytkownikami, ofertami, inwestycjami.

- **Route Guards:** Mechanizmy zabezpieczające dostęp do paneli chronionych. Użytkownik bez odpowiednich uprawnień jest przekierowywany do strony logowania lub otrzymuje komunikat o braku dostępu.

## 5. Kluczowe komponenty

- **Header:** Globalny nagłówek zawierający logo, pasek nawigacyjny oraz przyciski logowania/rejestracji lub profil użytkownika z ikonka dzwoneczka dzieki ktoremu zobaczymy notyfikacje.

- **Footer:** Stopka prezentująca podstawowe informacje, linki do polityki prywatności i kontaktu.

- **Karty ofert:** Komponent do prezentacji oferty w formie karty, używany zarówno w liście ofert, jak i w szczegółach.

- **Formularze:** Komponenty formularzy z walidacją i obsługą błędów, wykorzystywane w logowaniu, rejestracji oraz dodawaniu/edycji ofert.

- **Tabele i listy:** Komponenty do prezentacji danych dla paneli inwestora i administratora, z funkcjonalnością paginacji.

- **Przyciski i elementy akcji:** Standardowe, dostępne przyciski z obsługą stanów (hover, focus) oraz komunikatami potwierdzającymi wykonanie akcji.

- **Alerty i modale:** Komponenty do wyświetlania komunikatów o błędach, powiadomień oraz potwierdzeń krytycznych akcji.

---

Powyższa architektura UI zapewnia kompleksowy, responsywny i dostępny interfejs użytkownika, który skutecznie mapuje wymagania produktu i integruje się z zaplanowanymi endpointami API, dbając o bezpieczeństwo i pozytywne doświadczenie użytkownika.
