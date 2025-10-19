# Test endpointu POST /api/offers

## Przykład żądania (curl)

```bash
curl -X POST http://localhost:4321/api/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT_TOKEN" \
  -d '{
    "name": "Startup XYZ Series A",
    "description": "Inwestycja w innowacyjny startup technologiczny",
    "target_amount": 100000,
    "minimum_investment": 1000,
    "end_at": "2025-12-31T23:59:59Z"
  }'
```

## Przykłady odpowiedzi

### Sukces (201)

```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Startup XYZ Series A",
    "description": "Inwestycja w innowacyjny startup technologiczny",
    "target_amount": 10000000,
    "minimum_investment": 100000,
    "end_at": "2025-12-31T23:59:59.000Z",
    "status": "draft",
    "created_at": "2025-10-09T12:00:00.000Z",
    "updated_at": "2025-10-09T12:00:00.000Z"
  },
  "message": "Oferta została utworzona pomyślnie"
}
```

### Błąd autoryzacji (401)

```json
{
  "error": "Unauthorized",
  "message": "Wymagana autoryzacja"
}
```

### Błąd uprawnień (403)

```json
{
  "error": "Forbidden",
  "message": "Brak uprawnień administratora"
}
```

### Błąd walidacji (400)

```json
{
  "error": "Validation failed",
  "message": "Podane dane są nieprawidłowe",
  "details": [
    {
      "field": "target_amount",
      "message": "Docelowa kwota musi być większa od 0",
      "code": "too_small"
    }
  ]
}
```

## Uwagi

1. **Token autoryzacji**: Musisz uzyskać token JWT z Supabase Auth
2. **Rola administratora**: Obecnie sprawdzana jest rola w `user_metadata.role`
3. **Kwoty**: Podawane w PLN, automatycznie konwertowane na centy w bazie
4. **Status**: Automatycznie ustawiany na "draft" w bazie danych
