# Legacy Fighter w TypeScript

Źródło etapów: https://github.com/legacyfighter/cabs-java
Źródło aplikacji: https://github.com/legacyfighter/cabs-typescript

Każdy przeniesiony krok ma trzy tagi:

- oryginalną nazwę, np. `vo-license`;
- `course/vo-license/start` — stan przed zmianą;
- `course/vo-license/stop` — stan po zmianie.

```sh
node scripts/course.mjs list
node scripts/course.mjs diff vo-license
git switch --detach vo-license
npm ci
```

Do dalszej pracy twórz własną gałąź od wybranego taga: `git switch -c moja-analiza vo-license`.
`start` pozostaje historycznym TypeORM; aktualna baza techniczna znajduje się pod `course/start`.
Lista w `docs/course-tags.json` zawiera wszystkie tagi źródłowe i ich dokładne commity Java.
Obecność na liście nie oznacza implementacji: skrypt oznacza jako `done` tylko kroki posiadające tag końcowy.

## Różnice wynikające z portu

- NestJS i MikroORM pozostają aktualne w każdym nowym kroku; TypeORM nie wraca przy przechodzeniu między nimi.
- Klucze encji są UUID. Testy używają prawdziwego PostgreSQL i oddzielnych kontekstów ORM.
- Driver License: początkowy port nie sprawdzał formatu numeru przy aktywacji kierowcy. Etap podłączenia VO przywraca regułę z Javy i zabezpiecza ją testem.
- Money: Java prezentuje część kwot w groszach. Istniejący port TypeScript używa w API jednostek głównych, więc granice zachowują tę reprezentację. Wewnątrz Money przechowuje całkowite grosze. Kolumny mają typ `numeric(14,2)`, co zachowuje znaczenie dotychczas zapisanych kwot.
- TypeScript używa pojedynczej asercji na test; przypadki tabelaryczne są osobnymi testami.

## Analiza zmian

Zacznij od testów w tagu `*-testy` / `*-test`. Następnie porównaj wprowadzenie nowego modelu
z etapem `*-podlaczenie`. Różnica między nimi pokazuje rozdzielenie projektowania modelu od integracji z legacy.

Tagi są lokalne do chwili jawnego opublikowania gałęzi i wybranych tagów w swoim repozytorium.
