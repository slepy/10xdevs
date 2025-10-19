# PostgreSQL Database Schema for BlindInvest

## 1. Tabele

### 1.1. Users

- **id**: UUID, Primary Key (generowany przez Supabase Auth)
- **email**: VARCHAR, NOT NULL, UNIQUE
- Dodatkowe dane użytkownika są zarządzane przez Supabase Auth.

### 1.2. Offers

- **id**: UUID, Primary Key, domyślnie generowany (np. gen_random_uuid())
- **name**: VARCHAR(255) NOT NULL
- **description**: TEXT
- **target_amount**: INTEGER NOT NULL -- Kwota pomnożona razy 100
- **minimum_investment**: INTEGER NOT NULL -- Kwota pomnożona razy 100
- **end_at**: TIMESTAMPTZ NOT NULL
- **status**: VARCHAR(50) NOT NULL -- np. 'active', 'inactive'

### 1.3. Investments

- **id**: UUID, Primary Key, domyślnie generowany (np. gen_random_uuid())
- **user_id**: UUID NOT NULL, Foreign Key odwołujący się do Users(id)
- **offer_id**: UUID NOT NULL, Foreign Key odwołujący się do Offers(id)
- **amount**: INTEGER NOT NULL -- Kwota przechowywana jako liczba całkowita (pomnożona razy 100)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()
- **status**: VARCHAR(50) NOT NULL -- np. 'pending', 'accepted', 'rejected', 'closed'
- **completed_at**: TIMESTAMPTZ NULLABLE -- opcjonalne

**Indeksy:**

- Indeks na kolumnie **user_id**
- Indeks na kolumnie **offer_id**

### 1.4. Notifications

- **id**: UUID, Primary Key, domyślnie generowany (np. gen_random_uuid())
- **user_id**: UUID NOT NULL, Foreign Key odwołujący się do Users(id)
- **created_at**: TIMESTAMPTZ NOT NULL DEFAULT now()
- **is_read**: BOOLEAN NOT NULL DEFAULT false
- **content**: TEXT NOT NULL

## 2. Relacje

- **Investments.user_id** → **Users.id** (relacja jeden-do-wielu: jeden użytkownik może mieć wiele inwestycji)
- **Investments.offer_id** → **Offers.id** (relacja jeden-do-wielu: jedna oferta może mieć wiele inwestycji)
- **Notifications.user_id** → **Users.id** (relacja jeden-do-wielu: jeden użytkownik może mieć wiele powiadomień)

## 3. Indeksy

- Tabela **Investments**: indeks na kolumnie **user_id**
- Tabela **Investments**: indeks na kolumnie **offer_id**

## 4. RLS (Row Level Security)

- W tabeli **Investments** implementacja RLS pozwala filtrować dane na podstawie **user_id**, co zabezpiecza przed nieuprawnionym dostępem.
- Podobne mechanizmy RLS mogą być zastosowane w tabeli **Notifications**, aby użytkownicy widzieli tylko swoje powiadomienia.

## 5. Dodatkowe Uwagi

- Wszystkie pola identyfikatorów (**id**) są w formacie UUID.
- Wartości finansowe przechowywane są jako typ INTEGER (wartość pomnożona razy 100) dla zapewnienia precyzji.
- Schemat został zaprojektowany zgodnie z zasadami normalizacji (3NF) dla zapewnienia integralności danych oraz wydajności zapytań.
