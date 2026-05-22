# Mini Banking UI

Frontend Angular per [Mini Banking API](https://github.com/Sheeeepe/Banking_API).  
Permette di gestire conti bancari, visualizzare saldi e transazioni, effettuare depositi/prelievi e convertire il saldo in valute fiat e crypto.

---

## Stack

| Tecnologia       | Versione |
| ---------------- | -------- |
| Angular          | 21       |
| Angular Material | 21       |
| Chart.js         | 4        |
| Tailwind CSS     | 4        |

---

## Funzionalità

- **Lista conti** — visualizzazione di tutti i conti associati all'utente
- **Dashboard conto** — saldo aggiornato, grafico storico con filtro temporale (7g / 30g / 90g / tutto), ultime transazioni
- **Deposito / Prelievo** — form unificato con validazione
- **Storico transazioni** — lista completa con dettaglio e modifica descrizione
- **Conversione valuta** — conversione del saldo in fiat (Frankfurter API) e crypto (Binance API), con selezione da lista completa
- **Caching HTTP** — ogni risorsa viene caricata una sola volta per sessione; le mutazioni invalidano selettivamente la cache

---

## Architettura

```
src/app/
├── services/
│   ├── account-service.ts        # Cache saldi + conversioni
│   ├── transaction-service.ts    # Cache transazioni per conto
│   ├── selected-account.service.ts
│   └── currency.service.ts       # Lista valute fiat (Frankfurter) e crypto
├── shared/
│   ├── navbar/
│   └── sidebar/
└── views/
    ├── home/
    ├── accounts/
    ├── account-dashboard/
    │   └── components/
    │       ├── balance-card/
    │       ├── balance-chart/
    │       ├── conversion-card/
    │       └── recent-transactions/
    ├── transaction-form/          # Deposito e prelievo (componente unificato)
    ├── transactions/
    └── transaction-detail/
```

### Caching

I service usano un `signal<Map<id, data>>` come store in-memory. Le richieste HTTP vengono eseguite solo se la chiave non è presente nella mappa; le operazioni mutanti (`deposit`, `withdraw`, `delete`, `updateDescription`) chiamano `invalidate(id)` per forzare il reload alla navigazione successiva.

---

## Avvio

```bash
git clone https://github.com/Sheeeepe/mini-banking-ui
cd mini-banking-ui
npm install
ng serve
```

Apri `http://localhost:4200`.

### Variabili d'ambiente

Crea `src/environments/environment.development.ts` se non presente(in questo caso, è già presente il server demo online)

```typescript
export const environment = {
  apiUrl: 'http://localhost:8080',
};
```

---

## API di riferimento

Il backend è [Mini Banking API](https://github.com/Sheeeepe/Banking_API) (PHP Slim + Eloquent).  
La demo pubblica è deployata su Railway.

---

## Routes

| Path                              | Componente         |
| --------------------------------- | ------------------ |
| `/`                               | redirect → `/home` |
| `/home`                           | Home               |
| `/accounts`                       | Accounts           |
| `/accounts/:id`                   | AccountDashboard   |
| `/accounts/:id/deposit`           | TransactionForm    |
| `/accounts/:id/withdraw`          | TransactionForm    |
| `/accounts/:id/transactions`      | Transactions       |
| `/accounts/:id/transactions/:tid` | TransactionDetail  |
