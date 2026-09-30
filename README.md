# Legacy Fighter — TypeScript, NestJS i MikroORM

Ukończona adaptacja etapów refaktoryzacji z [cabs-java](https://github.com/legacyfighter/cabs-java)
na bazie [cabs-typescript](https://github.com/legacyfighter/cabs-typescript).
Zachowuje wcześniejszą migrację tego projektu z TypeORM do MikroORM.

Stan końcowy: **NestJS 12.1.2**, **MikroORM 7.2.3**, integracja MikroORM/Nest **7.1.0**,
TypeScript **6.0.3**, Jest **30.5.2**. Wersje NestJS i MikroORM sprawdzone w npm 30.09.2026.
Wymagany Node **24.15+ z linii 24 LTS** albo **26+**; `.nvmrc` wybiera Node 24.
TypeScript 6 pozostaje zgodny z używanym `ts-jest`.

## Analiza kursu

```sh
npm run course:list
npm run course:diff -- agg-claimsresolver
npm run course:check
```

Każdy etap ma oryginalną nazwę taga oraz punkty `course/<tag>/start` i `course/<tag>/stop`.
Sprawdzenie mapy obejmuje **70 tagów źródłowych**. Szczegóły i wyjątki:

- [Instrukcja przechodzenia przez kurs](docs/COURSE.md)
- [Mapa wszystkich etapów i commitów źródłowych](docs/course-map.md)
- [Manifest do skryptów](docs/course-tags.json)

`course/start` to punkt wyjścia po aktualizacji bibliotek, a `course/stop` — ukończona adaptacja.
Oryginalny `start` nadal wskazuje historyczny kod z TypeORM.
Tagi `text`, `text2`, `text3` odtwarzają osobną odnogę wczesnych eksperymentów.

```sh
# Samo oglądanie etapu
git switch --detach agg-claimsresolver

# Własne eksperymenty od wskazanego etapu
git switch -c codex/analiza-claims agg-claimsresolver
```

## Uruchomienie

```sh
nvm install
nvm use
npm ci
cp .env.example .env
docker compose up -d
npm run start:dev
```

Domyślny PostgreSQL: `localhost:5432`, baza `cabs`, użytkownik i hasło `postgres`.
Port API: `3000`. Ustawienia połączenia i progów biznesowych są w `.env.example`.

Poza środowiskiem produkcyjnym aplikacja aktualizuje schemat przy uruchomieniu.
**Do przechodzenia między tagami używaj osobnych, pustych baz demonstracyjnych.**
Zmiany modeli kursowych obejmują zmiany znaczenia danych, których synchronizacja schematu nie przenosi.
Dotychczasowa baza użytkownika nie była modyfikowana podczas przygotowania adaptacji.

```sh
npm run build
npx mikro-orm schema:update --dump
# Po ocenie SQL, wyłącznie dla właściwej bazy demonstracyjnej:
npx mikro-orm schema:update --run
```

`NODE_ENV=production` wyłącza automatyczną synchronizację. Ten projekt nie zawiera kompletnej
migracji danych produkcyjnych przez wszystkie historyczne etapy kursu.

## Sprawdzenie projektu

```sh
docker compose -f docker-compose.test.yml up -d --wait
npm run check-types
npm run lint
npm test -- --runInBand
npm run test:e2e
npm run build
npm run course:check
```

Testy integracyjne odtwarzają schemat **wyłącznie bazy `cabs_test` na porcie `55432`**.
Nie używają konfiguracji bazy aplikacji z `.env`. Skrypt końcowej wersji uruchamia je kolejno;
na wcześniejszych tagach podaj `-- --runInBand`. Host i port można nadpisać zmiennymi
`TEST_DATABASE_HOST` oraz `TEST_DATABASE_PORT`.

Końcowe modele są objęte testami jednostkowymi i integracyjnymi, m.in. pełnego przejazdu,
równoczesnej akceptacji, transferu części mil, przydziału kierowcy, raportów i migracji grafu.
Workflow GitHub Actions uruchamia sprawdzenie typów, formatowania, testy i kompilację.

## Graf tras

```sh
npm run build
npm run course:populate-graph
```

Polecenie uzupełnia graf z zakończonych przejazdów w `TransitDetails` w bazie wskazanej przez `.env`.
Powtórzenie nie duplikuje krawędzi. Wynik podaje liczbę projekcji i identyfikatory pominiętych
rekordów z niepełnymi datami. Nowe przejazdy aktualizują graf podczas zakończenia.

## Zakres materiału

To repozytorium do nauki architektury. Kursowe atrapy geokodowania, odległości drogowej i wysyłania
powiadomień pozostają atrapami. Nie jest to gotowa usługa taksówkowa do wdrożenia produkcyjnego.
Rozdziały `repair/legacy` i `contracts/legacy` celowo zachowują przykłady przed refaktoryzacją.

Instrukcje aktualizacji: [NestJS](https://docs.nestjs.com/migration-guide),
[MikroORM 7](https://mikro-orm.io/docs/upgrading-v6-to-v7).
Pochodzenie i licencja materiałów: [NOTICE](NOTICE), [Apache 2.0](LICENSE.legacyfighter).
