# Zasady projektowania bazy danych

## Podjęte decyzje

1. Inwestycje będą przechowywane w osobnej tabeli, z relacjami do użytkowników (user_id) oraz ofert (offer_id).
2. Tabela inwestycji będzie miała następujące atrybuty: id, user_id, offer_id, amount (jako integer, kwota pomnożona razy 100), created_date, status oraz finished_date.
3. Dla przechowywania wartości finansowych zostanie użyty typ INTEGER.
4. Pliki (dokumenty) będą przechowywane jako ścieżki do zasobów w storage, a nie jako dane binarne.
5. Indeksowanie zostanie zastosowane na identyfikatorach użytkowników i ofert dla tabeli inwestycji.
6. Partycjonowanie tabel nie jest wymagane na etapie MVP, ale może być rozważone w przyszłości.
7. Pobieranie inwestycji dla roli “Signer” będzie odbywało się na podstawie user_id z logiką biznesową w warstwie aplikacji, przy jednoczesnym wykorzystaniu RLS dla dodatkowego zabezpieczenia.
8. Mechanizmy audytu zmian w kluczowych tabelach (użytkownicy, inwestycje, oferty) nie będą implementowane w MVP.
9. Powiadomienia będą przechowywane w osobnej tabeli z atrybutami: id, user_id, created_date, is_read (boolean) oraz content.
10. Stosowanie ograniczeń kluczy obcych będzie wykorzystywane do zapewnienia integralności danych pomiędzy tabelami.
11. kazdy parametr z id powinien byc zapisany w formacju UUID
12. tabela “users” będzie obsługiwana przez Supabase Auth

## Dopasowane rekomendacje

1. Użycie osobnej tabeli dla inwestycji, z relacjami do użytkowników i ofert.
2. Przechowywanie kwot finansowych jako typ INTEGER (wartości pomnożone razy 100).
3. Przechowywanie ścieżek do plików zamiast danych binarnych.
4. Indeksowanie kolumn user_id i offer_id dla poprawy wydajności zapytań.
5. Rozważenie partycjonowania tabel w przyszłości, chociaż nie jest to wymagane na etapie MVP.
6. Filtrowanie inwestycji na podstawie user_id przy wykorzystaniu polityk RLS.
7. Zastosowanie ograniczeń kluczy obcych dla integralności danych.

## Podsumowanie planowania bazy danych

Główne wymagania dotyczące schematu bazy danych obejmują stworzenie solidnego modelu dla aplikacji MVP, który odzwierciedla kluczowe funkcjonalności systemu, w tym zarządzanie inwestycjami, ofertami, użytkownikami oraz powiadomieniami.

### Kluczowe encje

- **Użytkownicy** – przechowywanie danych usera.
- **Oferty inwestycyjne** – zawierają szczegółowe informacje dotyczące ofert.
- **Inwestycje** – osobna encja, przechowująca informacje o deklaracjach inwestycyjnych z powiązaniami do użytkowników i ofert.
- **Powiadomienia** – osobna tabela na komunikaty skierowane do użytkowników.

### Relacje

- Każda inwestycja ma relację (foreign key) do użytkownika oraz do oferty, co umożliwia śledzenie, kto i w jakiej ofercie dokonał inwestycji.
- Powiadomienia są powiązane z użytkownikami, umożliwiając zarządzanie komunikatami.

### Bezpieczeństwo i skalowalność

- Użycie ograniczeń kluczy obcych zapewniających integralność danych.
- Indeksowanie kluczowych kolumn (user_id, offer_id) dla optymalizacji zapytań.
- Rozwiązanie przewiduje możliwość dalszej rozbudowy, np. partycjonowanie tabel w rozwiniętych wersjach produktu.

Ogólnie, projekt opiera się na prostym, ale skalowalnym modelu bazy danych, spełniającym wymagania MVP z możliwością adaptacji na przyszłe potrzeby.

## Nierozwiązane kwestie

Brak nierozwiązanych kwestii – wszystkie kluczowe decyzje i zalecenia zostały uzgodnione dla etapu MVP.
