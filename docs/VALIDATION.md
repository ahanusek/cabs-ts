# Weryfikacja końcowa — 30.09.2026

Środowisko: Node 24.21.0, PostgreSQL 16 w osobnym kontenerze; baza `cabs_test`, port `55432`.
Baza aplikacji użytkownika nie była używana.

| Kontrola | Wynik |
| --- | --- |
| Czysta instalacja `npm ci` | Powodzenie, 0 podatności w audycie npm |
| `npm run lint` | Powodzenie |
| `npm run check-types` | Powodzenie |
| Testy jednostkowe | 22 zestawy, 165 testów |
| Testy integracyjne | 18 zestawów, 103 testy |
| `npm run build` | Powodzenie, również przy dwóch kolejnych kompilacjach |
| CLI MikroORM | Poprawne odkrywanie skompilowanych encji i porównanie schematu |
| Start skompilowanej aplikacji | Poprawny |
| HTTP: klient → zamówienie → odczyt → anulowanie | Odpowiednio 201, 201, 200, 201; stany `draft` i `cancelled` |
| CLI uzupełniania grafu | Poprawne uruchomienie i wynik JSON w bazie testowej |
| Mapa kursu | Zgodna ze wszystkimi 70 nazwami tagów źródłowego repozytorium Java |
| Punkty start/stop | Kompletne, zgodne z tagami i z niepustymi zmianami plików |
| Końcowe pliki TypeScript | Największy plik źródłowy ma 212 linii |

Historyczna odnoga `text3`: dodatkowo 67 testów jednostkowych i 15 integracyjnych we właściwym
historycznym drzewie kodu. Wcześniejsze etapy były sprawdzane przed nadaniem tagów.
Nie oznacza to testowania wszystkich konfiguracji produkcyjnych ani pełnej migracji danych między etapami.

Workflow GitHub Actions został dodany do repozytorium. Nie był uruchamiany na GitHub, ponieważ
nowej gałęzi i tagów nie wysłano do zdalnego repozytorium.
