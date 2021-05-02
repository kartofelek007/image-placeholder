# Generator grafik

### Parametry
* `http://adres.pl/200x400` - generuje zaślepkę o danych wymiarach
* `http://adres.pl/200x400?text=example` - zmiana tekstu na "example"
* `http://adres.pl/200x400?text=` - zmiana tekstu na pusty
* `http://adres.pl/200x400?gray=` - zmienia zdjęcie na czarnobiałe
* `http://adres.pl/200x400/blurry` - generuje grafikę z danej kategorii. Kategorie to **cat**, **dog**, **abstract**, **malpa**, **ziobro**, **obajtek**
* `http://adres.pl/200x400/blurry?text=test` - generuje grafikę z danej kategorii wraz z tekstem

### Przykłady użycia
```
http://adres.pl/200x400
http://adres.pl/200x400?text=test
http://adres.pl/200x400/cat?gray=1
http://adres.pl/200x400/dog?gray=1&text=testowo
http://adres.pl/dog/400x400?text=mały piesek
http://adres.pl/200x400
```