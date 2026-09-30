### Legacy Fighter — TypeScript, NestJS i MikroORM

Baza techniczna: NestJS **12.1.2**, MikroORM **7.2.3** (integracja Nest **7.1.0**), TypeScript **6.0.3**.
Wymagany Node.js **24.15+** z linii 24 LTS albo 26+. `nvm use` wybiera Node 24.
Wersje sprawdzone w npm 30.09.2026. `npm ci` odtwarza zależności z lockfile.

Kod kursu pochodzi z [cabs-typescript](https://github.com/legacyfighter/cabs-typescript),
a etapy refaktoryzacji są odtwarzane na podstawie [cabs-java](https://github.com/legacyfighter/cabs-java).
Historyczny tag `start` zachowuje oryginalny punkt wyjścia z TypeORM.
`course/start` oznacza bazę po aktualizacji do NestJS 12 i MikroORM 7.

Aktualizacja korzysta z [instrukcji NestJS](https://docs.nestjs.com/migration-guide)
i [instrukcji MikroORM](https://mikro-orm.io/docs/upgrading-v6-to-v7).
Aplikacja pozostaje w CommonJS, korzystając z obsługi ESM w Node 24.
Testy Jest 30 uruchamiają obsługę modułów ESM przez `--experimental-vm-modules`.

____

# Rozwój kodu

Kod będzie rozwijać się wraz z cotygodniową narracją szkoleniową.
Zarówno pojawiać się w nim będą kolejne poprawki jak i odziedziczone po firmach partnerskich nowe moduły ;-) Jak to w prawdziwym legacy.

# Przeglądanie kodu

Poszczególne kroki refaktoryzacyjne najlepiej przeglądać używająć tagów. Każdy krok szkoleniowy, który opisany jest w odcinku Legacy Fighter posiada na końcu planszę z nazwą odpowiedniego taga. Porównać zmiany można robiąc diffa w stosunku do poprzedniego taga z narracji.


_____________



## Installation

```bash
$ npm install
```

## Database Setup (PostgreSQL)

### Option 1: Using Docker (Recommended)

Start PostgreSQL using Docker Compose:

```bash
# Start database
$ docker-compose up -d

# Stop database
$ docker-compose down

# Stop and remove data
$ docker-compose down -v
```

Default connection settings:
- Host: `localhost`
- Port: `5432`
- Database: `cabs`
- Username: `postgres`
- Password: `postgres`

### Option 2: Local PostgreSQL Installation

1. Install PostgreSQL 16+ on your system
2. Create a database:

```bash
$ psql -U postgres
postgres=# CREATE DATABASE cabs;
postgres=# \q
```

### Environment Variables

You can customize database connection using environment variables:

```bash
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_NAME=cabs
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=postgres
```

Or create a `.env` file in the project root:

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=cabs
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
```

### Database Schema

MikroORM creates/updates the schema on startup only outside production.
With `NODE_ENV=production`, apply reviewed schema changes before starting the application.

To manually sync:

```bash
# Build the configuration and entities first
$ npm run build

# Review SQL before applying it
$ npx mikro-orm schema:update --dump

# Apply to a development database
$ npx mikro-orm schema:update --run
```

### pgAdmin (Database UI)

pgAdmin is included in Docker Compose for browsing the database.

**URL:** http://localhost:5050

**Login credentials:**
- Email: `admin@admin.com`
- Password: `admin`

**Connect to database:**
1. Right-click "Servers" → "Register" → "Server"
2. **General tab:** Name = `cabs`
3. **Connection tab:**
   - Host: `postgres`
   - Port: `5432`
   - Database: `cabs`
   - Username: `postgres`
   - Password: `postgres`
4. Click "Save"

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### Izolowane testy PostgreSQL

Testy integracyjne używają bazy `cabs_test` na porcie `55432`. Nie korzystają z bazy aplikacji z `.env`.
Przed uruchomieniem tworzą od nowa wyłącznie schemat tej bazy testowej.

```bash
docker compose -f docker-compose.test.yml up -d --wait
npm run test:e2e -- --runInBand
npm run check-types
npm run build
npm run lint
```

Host i port bazy testowej można zmienić przez `TEST_DATABASE_HOST` i `TEST_DATABASE_PORT`.
