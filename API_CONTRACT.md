# API Contract - AgenciaHub

Documentação dos contratos de API entre Frontend (Next.js) e Backend (Spring Boot).

**Base URL**: `http://localhost:8080/api/v1` (desenvolvimento)

---

## 📋 Convenções

### Request/Response
- **Content-Type**: `application/json`
- **Encoding**: UTF-8
- **Date Format**: ISO 8601 (`2026-05-03T10:30:00Z`)
- **Naming**: camelCase

### Status Codes
- `200 OK` - Sucesso (GET, PATCH)
- `201 Created` - Recurso criado (POST)
- `400 Bad Request` - Validação falhou
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

### Error Response
```json
{
  "message": "Descrição do erro",
  "status": 400,
  "timestamp": "2026-05-03T10:30:00Z"
}
```

---

## 👥 Customers (Clientes)

### List Customers
```http
GET /customers?name={name}&status={status}
```

**Query Parameters**:
- `name` (optional): Filtrar por nome (case-insensitive, partial match)
- `status` (optional): `ACTIVE`, `INACTIVE`, `PROSPECT`

**Response** `200 OK`:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "João Silva",
    "email": "joao@example.com",
    "phone": "+55 11 98765-4321",
    "interestDestination": "Europa",
    "status": "ACTIVE",
    "notes": "Cliente VIP",
    "createdAt": "2026-01-15T10:00:00Z"
  }
]
```

### Get Customer
```http
GET /customers/{id}
```

**Response** `200 OK`: (mesmo formato do item da lista)

**Response** `404 Not Found`:
```json
{
  "message": "Customer not found with id: {id}",
  "status": 404,
  "timestamp": "2026-05-03T10:30:00Z"
}
```

### Create Customer
```http
POST /customers
```

**Request Body**:
```json
{
  "name": "Maria Santos",
  "email": "maria@example.com",
  "phone": "+55 21 91234-5678",
  "interestDestination": "Caribe",
  "status": "PROSPECT",
  "notes": "Interessada em lua de mel"
}
```

**Validations**:
- `name`: required, max 255 chars
- `email`: required, valid email, max 320 chars
- `phone`: required, max 64 chars
- `interestDestination`: required, max 512 chars
- `status`: required, enum
- `notes`: optional, text

**Response** `201 Created`: (mesmo formato do GET)

### Update Customer
```http
PATCH /customers/{id}
```

**Request Body** (todos campos opcionais):
```json
{
  "name": "Maria Santos Silva",
  "status": "ACTIVE",
  "notes": "Cliente confirmou viagem"
}
```

**Response** `200 OK`: (mesmo formato do GET)

---

## 💼 Quotations (Cotações)

### List Quotations
```http
GET /quotations?customerId={uuid}&status={status}&search={text}
```

**Query Parameters**:
- `customerId` (optional): UUID do cliente
- `status` (optional): `DRAFT`, `SENT`, `APPROVED`, `REJECTED`, `EXPIRED`, `CONVERTED`, `CANCELLED`
- `search` (optional): Busca em title, destination, customer name

**Response** `200 OK`:
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "customerName": "João Silva",
    "opportunityId": null,
    "title": "Pacote Europa 15 dias",
    "destination": "Paris, Roma, Barcelona",
    "description": "Roteiro completo pela Europa",
    "totalAmount": 25000.00,
    "currency": "BRL",
    "status": "SENT",
    "validUntil": "2026-06-30",
    "travelStartDate": "2026-07-15",
    "travelEndDate": "2026-07-30",
    "detailsJson": {
      "services": ["flight", "hotel", "insurance"],
      "passengers": 2,
      "couponCode": "SUMMER2026"
    },
    "tags": ["europa", "familia"],
    "priority": true,
    "assignee": "Ana Costa",
    "internalNotes": "Cliente pediu upgrade no hotel",
    "createdAt": "2026-05-01T10:00:00Z",
    "updatedAt": "2026-05-03T14:30:00Z"
  }
]
```

### Get Quotation
```http
GET /quotations/{id}
```

**Response** `200 OK`: (mesmo formato do item da lista)

### Create Quotation
```http
POST /quotations
```

**Request Body**:
```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "opportunityId": null,
  "title": "Pacote Caribe",
  "destination": "Cancún, México",
  "description": "Resort all-inclusive",
  "totalAmount": 12000.00,
  "currency": "BRL",
  "status": "DRAFT",
  "validUntil": "2026-06-15",
  "travelStartDate": "2026-07-01",
  "travelEndDate": "2026-07-07",
  "detailsJson": {
    "services": ["flight", "hotel", "transfers"],
    "passengers": 2
  },
  "tags": ["caribe", "resort"],
  "priority": false,
  "assignee": "Ana Costa",
  "internalNotes": ""
}
```

**Validations**:
- `customerId`: required, must exist
- `title`: required, max 512 chars
- `destination`: required, max 512 chars
- `totalAmount`: required, >= 0
- `validUntil`: required, date
- `status`: defaults to `DRAFT` if omitted
- `currency`: defaults to `BRL` if omitted

**Response** `201 Created`: (mesmo formato do GET)

### Update Quotation
```http
PATCH /quotations/{id}
```

**Request Body** (todos campos opcionais):
```json
{
  "status": "SENT",
  "totalAmount": 13500.00,
  "internalNotes": "Cliente aceitou upgrade"
}
```

**Response** `200 OK`: (mesmo formato do GET)

---

## 🎯 Opportunities (Oportunidades/Atendimentos)

### List Opportunities
```http
GET /opportunities
```

**Response** `200 OK`:
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "customerName": "João Silva",
    "title": "Viagem Europa Verão",
    "destination": "Europa",
    "estimatedAmount": 30000.00,
    "status": "NEGOTIATION",
    "expectedTravelDate": "2026-07-15",
    "notes": "Cliente quer visitar 5 países"
  }
]
```

**Status Enum**: `LEAD`, `QUALIFICATION`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`

### Get Opportunity
```http
GET /opportunities/{id}
```

**Response** `200 OK`: (mesmo formato do item da lista)

### Create Opportunity
```http
POST /opportunities
```

**Request Body**:
```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Lua de Mel Maldivas",
  "destination": "Maldivas",
  "estimatedAmount": 40000.00,
  "status": "LEAD",
  "expectedTravelDate": "2026-12-01",
  "notes": "Casamento em novembro"
}
```

**Response** `201 Created`: (mesmo formato do GET)

### Update Opportunity
```http
PATCH /opportunities/{id}
```

**Request Body** (campos opcionais):
```json
{
  "status": "PROPOSAL",
  "estimatedAmount": 45000.00
}
```

**Response** `200 OK`: (mesmo formato do GET)

---

## 💰 Financial Entries (Lançamentos Financeiros)

### List Financial Entries
```http
GET /financial-entries?customerId={uuid}&type={type}&category={category}&status={status}
```

**Query Parameters**:
- `customerId` (optional): UUID do cliente
- `type` (optional): `INCOME`, `EXPENSE`
- `category` (optional): `COMMISSION`, `SUPPLIER_PAYMENT`, `REFUND`, `OPERATIONAL`, `OTHER`
- `status` (optional): `PENDING`, `PAID`, `CANCELLED`

**Response** `200 OK`:
```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "description": "Comissão pacote Europa",
    "type": "INCOME",
    "category": "COMMISSION",
    "amount": 2500.00,
    "entryDate": "2026-05-03",
    "status": "PAID",
    "customerId": "550e8400-e29b-41d4-a716-446655440000",
    "customerName": "João Silva"
  }
]
```

### Get Financial Entry
```http
GET /financial-entries/{id}
```

**Response** `200 OK`: (mesmo formato do item da lista)

### Create Financial Entry
```http
POST /financial-entries
```

**Request Body**:
```json
{
  "description": "Pagamento hotel",
  "type": "EXPENSE",
  "category": "SUPPLIER_PAYMENT",
  "amount": 8000.00,
  "entryDate": "2026-05-03",
  "status": "PENDING",
  "customerId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Validations**:
- `description`: required, max 1024 chars
- `type`: required, enum
- `category`: required, enum
- `amount`: required, > 0
- `entryDate`: required, date
- `status`: required, enum
- `customerId`: optional, must exist if provided

**Response** `201 Created`: (mesmo formato do GET)

### Update Financial Entry
```http
PATCH /financial-entries/{id}
```

**Request Body** (campos opcionais):
```json
{
  "status": "PAID",
  "amount": 8500.00
}
```

**Response** `200 OK`: (mesmo formato do GET)

---

## 🚀 Endpoints Futuros (Planejados)

### Public Forms & Submissions

```http
# Público (sem auth)
GET  /public/forms/{slug}
POST /public/forms/{slug}/submit

# Interno (com auth)
GET  /form-configs
POST /form-configs
GET  /form-submissions?status=PENDING
POST /form-submissions/{id}/import-to-quotation
```

### Notifications

```http
GET   /notifications?isRead=false
PATCH /notifications/{id}/mark-read
PATCH /notifications/mark-all-read
```

### Activity Logs (Timeline)

```http
GET /activity-logs?entityType=QUOTATION&entityId={id}
```

### Global Search

```http
GET /search?q={query}&types=CUSTOMER,QUOTATION,OPPORTUNITY
```

### Authentication (Futuro)

```http
POST /auth/login
POST /auth/refresh
POST /auth/logout
GET  /auth/me
```

---

## 🔧 Frontend Integration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_AGENCIA_HUB_API_URL=http://localhost:8080/api/v1
```

### Fetch Example

```typescript
const baseUrl = process.env.NEXT_PUBLIC_AGENCIA_HUB_API_URL;

const response = await fetch(`${baseUrl}/customers`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Futuro: 'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(data)
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message || `HTTP ${response.status}`);
}

const result = await response.json();
```

### Type Mapping

| Frontend Type | Backend Type | Notes |
|--------------|--------------|-------|
| `Cliente` | `CustomerResponse` | Mapper: `customer-mapper.ts` |
| `Cotacao` | `QuotationResponse` | Mapper: `quotation-mapper.ts` |
| `Atendimento` | `OpportunityResponse` | TODO: criar mapper |
| `LancamentoFinanceiro` | `FinancialEntryResponse` | TODO: criar mapper |

---

## 📝 Changelog

### v1.0 (Atual)
- ✅ Customers CRUD
- ✅ Quotations CRUD
- ✅ Opportunities CRUD
- ✅ Financial Entries CRUD

### v1.1 (Próxima)
- 🚧 Public Forms & Submissions
- 🚧 Notifications
- 🚧 Activity Logs

### v2.0 (Futuro)
- 📋 Authentication (JWT)
- 📋 Global Search
- 📋 File Upload
- 📋 Webhooks

---

**Última atualização**: Maio 2026
**Versão**: 1.0
