### Fork of legacyfighter/cabs-java to Nest.js (TypeScript / Node)
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

MikroORM will automatically create/update the schema on application startup.

To manually sync:

```bash
# Generate migration
$ npx mikro-orm migration:create

# Run migrations
$ npx mikro-orm migration:up

# Or use schema sync (development only)
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
