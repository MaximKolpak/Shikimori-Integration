<p align="left">
    <a href="https://github.com/MaximKolpak/TunimeScript">
        <img src="https://img.shields.io/badge/version-1.3-green.svg" />
    </a>
    <a href="https://github.com/quoid/userscripts">
        <img src="https://img.shields.io/badge/GitHub-userscripts-lightgrey?style=flat&logo=github" />
    </a>
    <a href="https://github.com/MaximKolpak/TunimeScript">
        <img src="https://img.shields.io/badge/GitHub-tunimescript-lightgrey?style=flat&logo=github" />
    </a>
</p>

# Shikimori-Integration

<img src="https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/resource/poster.png" align="right"
     alt="Poster Integration Web" width="253" >
Интеграция сайта [Shikimori](https://shikimori.one/) на сайт Аниме [YummyAnime](https://yummyanime.club). Скрипт помогает вести список просмотренных аниме. Этот список находится на сайте Shikimori

## Возможности скрипта

* Поиск аниме в [Shikimori](https://shikimori.one/) из сайта [YummyAnime](https://yummyanime.club)

Так как имена могут отличатся в [Shikimori](https://shikimori.one/) от [YummyAnime](https://yummyanime.club) пришлось сделать подбор аниме по параметрам, на сайте показывается вероятность совпадения аниме по параметрам

* Показывает рейтинг аниме из [Shikimori](https://shikimori.one/)
* Возможность авторизировать пользователя из [Shikimori](https://shikimori.one/) в [YummyAnime](https://yummyanime.club)
    - Добавить аниме в список
    - Отоброжать текущий статус аниме
    - Изменение статуса аниме аниме
    - Отметка просмотренных епизодов 
    - Отоброжать на каком епизоде остановились
    - В поиске отображать аниме в списке ("Запланировано")
    - Возможность ставить оценку

Все эти функции будут доступны после авторизации Скрипта в [Shikimori](https://shikimori.one/)

Скрипт автоматически отмечает просмотренные епизоды в [Shikimori](https://shikimori.one/)

# Поддержка

* [Typermonkey]("https://www.tampermonkey.net/") Windows - Firefox
* [Greasemonkey]("https://www.greasespot.net/") Windows - Firefox
* [Userscripts]("https://github.com/quoid/userscripts") IOS (15) - Safari

Этот скрипт может работать там где поддержуют следующие функции: ```GM_addStyle```, ```GM.getValue```, ```GM.setValue```, ```GM.xmlHttpRequest```, а также возможность подключениие сторонних библиотек JS, которые испозьзует скрипт [Jqery] 

```// @require https://code.jquery.com/jquery-3.6.0.min.js```

## Обновления

```1.3 [21.02.2022]``` - Было добавлена возможность ставить оценку аниме не переходя на сайт Shikimori

```1.2 [21.02.2022]``` - Поиск аниме теперь более точнее находит аниме из страницы. Исправлены баг с поиском.

```1.1 [19.02.2022]``` - Добавлена интеграгия при нажатии на поиск показывает список тех аниме которые находятся в списке ```"Запланированые"``` 

```1.0 [18.02.2022]``` - Начальный запуск скрипта

# Скриншоты функций
<img src="https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/resource/episodes.png" />
<img src="https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/resource/login.png" />
<img src="https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/resource/score.png" />
