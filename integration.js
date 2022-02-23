// ==UserScript==
// @name         Shikimori Integration
// @namespace    UserScripts
// @version      1.4
// @description  helps to maintain a list of watched TV shows, with a nice visual part
// @author       Anoncer (https://github.com/MaximKolpak)
// @match        https://yummyanime.club/*
// @grant        GM_addStyle
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.xmlHttpRequest
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @icon         https://www.google.com/s2/favicons?domain=yummyanime.club
// @updateURL    https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/integration.js
// @downloadURL  https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/integration.js
// @supportURL   https://raw.githubusercontent.com/MaximKolpak/Shikomiri-Integration/main/integration.js
// ==/UserScript==
/// <reference path="typings/globals/jquery/index.d.ts" />

(function () {
    'use strict';

    const shikimori = {
        base_url: "https://shikimori.one",
        auth_url: "https://shikimori.one/oauth/authorize?client_id=EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code&scope=user_rates+comments+topics",

        key_value: "shikimori_api",

        authorization: false,

        user_agent: "Tunime",
        client_id: "EKv75uNamao_d3uzFREIfo71l6cpyG2IEUIpBxFgcAM",
        client_secret: "WKDClcJlc3grYpBWDbxqQyAFEW0SquPgrvTdXeAfhds",

        user_data: {
            access: "",
            refresh: "",
            created_at: "",
            expires_in: ""
        },

        Request: {
            GET: (url, func) => {
                $.ajax({
                    url: shikimori.base_url + url,
                    method: "GET"
                }).done((data) => func(data));
            },
            GETasync: async (url) => {
                return new Promise((resolve) => {
                    $.ajax({
                        url: shikimori.base_url + url,
                        method: "GET"
                    }).done((data) => resolve(data));
                });
            },
            POST: (url = "/", data = {}, func = (data, status) => { console.log(status, data) }) => {
                $.ajax({
                    url: shikimori.base_url + url,
                    method: "POST",
                    beforeSend: function (request) {
                        request.setRequestHeader('User-Agent', shikimori.user_agent);
                    },
                    data: data
                }).always(function (data, status) { func(data, status) });
            }
        },

        User: {
            GET: function (url = "/", func = (data, status) => { console.log(data, status) }) {
                $.ajax({
                    url: shikimori.base_url + url,
                    method: "GET",
                    beforeSend: function (request) {
                        request.setRequestHeader('User-Agent', shikimori.user_agent);
                        request.setRequestHeader('Authorization', 'Bearer ' + shikimori.user_data.access);
                    }
                }).always(function (data, status) { func(data, status) });
            },
            POST: function (url = "/", data = {}, func = (data, status) => { console.log(data, status) }) {
                $.ajax({
                    url: shikimori.base_url + url,
                    method: "POST",
                    beforeSend: function (request) {
                        request.setRequestHeader('User-Agent', shikimori.user_agent);
                        request.setRequestHeader('Authorization', 'Bearer ' + shikimori.user_data.access);
                    },
                    data: data
                }).always(function (data, status) { func(data, status) });
            },
            DELETE: function (url = "/", func = (response) = {}) {
                GM.xmlHttpRequest({
                    method: "DELETE",
                    url: shikimori.base_url + url,
                    onload: (response) => func(response)
                });
            }
        },

        Authorizate: async function () {
            if (!this.authorization) {
                this.user_data = await GM.getValue(this.key_value, this.user_data);
                if (this.user_data.access == "" || this.user_data.refresh == "") {
                    window.open(this.auth_url);
                    let code = prompt("Please enter Token from copy", "Token");
                    this.Request.POST("/oauth/token", {
                        grant_type: "authorization_code",
                        client_id: this.client_id,
                        client_secret: this.client_secret,
                        code: code,
                        redirect_uri: "urn:ietf:wg:oauth:2.0:oob"
                    }, (data, status) => {
                        if (status == "success") {
                            this.user_data.access = data.access_token;
                            this.user_data.refresh = data.refresh_token;
                            this.user_data.created_at = data.created_at;
                            this.user_data.expires_in = data.expires_in;
                            GM.setValue(this.key_value, this.user_data);
                            this.authorization = true;
                        } else {
                            this.authorization = false;
                            //console.log(data); // Show Error IN Console
                        }

                        this.Events.Auth.Event(this.authorization);
                    });
                } else {
                    //Login App
                    this.Request.POST("/oauth/token", {
                        grant_type: "refresh_token",
                        client_id: this.client_id,
                        client_secret: this.client_secret,
                        refresh_token: this.user_data.refresh
                    }, (data, status) => {
                        if (status == "success") {
                            this.user_data.access = data.access_token;
                            this.user_data.refresh = data.refresh_token;
                            this.user_data.created_at = data.created_at;
                            this.user_data.expires_in = data.expires_in;
                            GM.setValue(this.key_value, this.user_data);
                            this.authorization = true;
                        }
                        this.Events.Auth.Event(this.authorization);
                    });
                }
            }
        },

        TryAuthorizate: async function () {
            if (!this.authorization) {
                this.user_data = await GM.getValue(this.key_value, this.user_data);
                if (this.user_data.access == "" || this.user_data.refresh == "") {
                    //console.log(this.user_data);
                    this.Events.Auth.Event(false);

                } else {
                    this.Events.Auth.Event(true);
                }
            }
        },

        Logout: async function () {
            this.user_data = {
                access: "",
                refresh: "",
                created_at: "",
                expires_in: ""
            };
            GM.setValue(this.key_value, this.user_data);
            window.location = window.location;
        },

        Events: {
            Auth: {
                function: [],
                Subscribe: (e) => {
                    shikimori.Events.Auth.function.push(e);
                },
                Event: (e) => {
                    shikimori.Events.Auth.function.forEach(element => {
                        element(e)
                    });
                }
            }
        }
    }

    class Yummyanime {

        constructor() {
        }

        //Getters

        /**
         * Return bool if this page from anime
         */
        get IsPageAnime() {
            return this.CheckPageFromAnime();
        }

        /**
         * Return anime name
         */
        get Name() {
            return $('.content-page > h1:nth-child(8)').html().trim();
        }

        /**
         * Return type anime
         */
        get Type() {
            let type = this.SearchTag("Тип:").html().replace("<span>Тип:</span> ", "");
            return (type == "Сериал" || type == "Малометражный сериал") ? ("tv") : ((type == "Полнометражный фильм" || type == "Короткометражный фильм") ? ("movie") : ((type == "Special") ? ("special") : ((type == "OVA") ? ("ova") : ((type == "ONA") ? ("ona") : ("")))));
        }

        /**
         * Return status anime
         */
        get Status() {
            let status = $(`.badge`).html();
            return (status == "вышел") ? ("released") : ((status == "онгоинг") ? ("ongoing") : ((status == "анонс") ? ("anons") : ("")));
        }

        get Episodes() {
            try {
                let episodes = this.SearchTag("Серии:").html().replace("<span>Серии:</span>", "");
                return parseInt(episodes);
            } catch {
                return 1;
            }
        }

        get Year() {
            try {
                let year = this.SearchTag("Год: ").html().replace("<span>Год: </span>", "");
                return year;
            } catch {
                return undefined
            }
        }

        /**
         * Get Alternative name for anime
         */
        get Names() {
            $(`.more-alt-names`).remove();
            const namesItems = document.querySelectorAll('.alt-names-list > li');
            return Array.from(namesItems).map(_ => _.innerHTML);
        }

        get Episode() {
            let btn = $(`.video-button.active`);
            if (btn) {
                return parseInt($(`.video-button.active`).html());
            } else {
                return 0;
            }
        }

        //Functions

        /**
         * Checks if the page is an anime cartoon
         * @returns bool param if this page anime
         */
        CheckPageFromAnime() {
            let path = window.location.pathname.split("/");
            if (path.includes("catalog") && path.includes("item")) {
                return true;
            } else {
                return false;
            }
        }

        /**
         * Searches the site for the specified tag in the information
         * @param {String} search Name Tag 
         * @returns DOOM element
         */
        SearchTag(search) {
            for (let index = 1; index < $('.content-main-info')[0].childElementCount + 1; index++) {
                if ($(`.content-main-info > li:nth-child(${index}) > span:nth-child(1)`).html() == search) {
                    return $(`.content-main-info > li:nth-child(${index})`);
                }
            }
        }


        #showedVieo = [];

        SetVideoShow(id = 0) {
            if (id == 0) {
                return;
            }

            let videoall = $(`.video-block .video-button`).toArray();
            if (videoall.length != 0) {
                if (this.#showedVieo.length != 0) {
                    this.#showedVieo.forEach((e) => { $(e).removeClass("shikimori-watch"); });
                }
                this.#showedVieo = [];
                videoall.forEach((element) => {
                    if ($(element).data("id") == id) {
                        this.#showedVieo.push(element);
                        $(element).addClass("shikimori-watch");
                    }
                });
            }
        }

        SearchAnimeAsync(name = "") {
            if (name.length > 0) {
                return new Promise((resolve) => {
                    $.ajax({
                        url: `https://yummyanime.club/get-search-list?word=${name}`,
                        method: "GET"
                    }).always((data, status) => resolve(data, status));
                });
            }
        }



        #eventsChangeVideo = [];

        EventChangeVideo(func = (object) => { }) {
            this.#eventsChangeVideo.push(func);
        }

        StartEvents() {
            $(`.video-button`).click((eventObject) => {
                this.#eventsChangeVideo.forEach((element) => {
                    element(eventObject);
                })
            })
        }

    }

    const Authorization = {
        html: `<div class="login-shikimori">
                    <div>
                        <span>Войти в Shikimori</span>
                    </div>
                </div>`,
        html1: `<div class="login-shikimori">
                    <div>
                        <span>Выйти</span>
                    </div>
                </div>`,
        style: `.login-shikimori{
            background: #1A1A1A;
            color: #fff;
            font-family: 'Roboto', sans-serif;
            display: flex;
            align-items: center;
            cursor:pointer;
        }
        .login-shikimori > div:nth-child(1){
            margin: 4px 20px;
            display: flex;
            flex-direction: column;
        }
        .login-shikimori > div:nth-child(1) > span:nth-child(1){
            font-size: 14px;
            color: #fff;
            font-family: 'Roboto', sans-serif;
        }`,

        Show: function (e, html = this.html) {
            $(`.top > div:nth-child(1) > div:nth-child(1)`).prepend(html);
            GM_addStyle(this.style);
            if (e) {
                this.Control();
            }
        },

        Control: function () {
            $(`.login-shikimori`).click(() => {
                shikimori.Authorizate();
            });
        },

        MyFunction: function (e) {
            $(`.login-shikimori`).click(() => {
                e();
            });
        },

        Dispose: function (e) {
            if (e) {
                $(`.login-shikimori`).remove();
            }
        }

    }

    const UserProfile = {
        html: `
            <div class="shikimori-welcome"><div><span>Welcome</span></div></div>
        `,
        style: `.shikimori-welcome{
                position: absolute;
                bottom: 10px;
                left: 10px;
                right: 10px;
                font-family: 'Roboto', sans-serif;
                font-size: 14px;
                background: rgba(26, 26, 26, 0.7);
                border: 1px solid rgba(30, 89, 176, 0.7);
                border-radius: 4px;
                color: #fff;
                padding: 7px;
                display: flex;
                align-items: center;
                justify-content: center;
        }`,

        styleadded: false,

        Show: function (html = this.html, style = this.style) {
            $(`.poster-block`).append(html);
            if (!this.styleadded) {
                GM_addStyle(style);
                this.styleadded = true;
            }
        },

        Name: function (name) {
            $(`.shikimori-welcome > div:nth-child(1) > span:nth-child(1)`).html(name);
        }
    }

    const AnimeStatus = {
        html: {
            AddToList: `<div class="shikimori-add-anime"><div><span>Добавить в список</span><span>Добавит в список "Посмотрю"</span></div></div>`,
            StartWatch: `<div class="shikimori-start-watch"><div><span>Начать смотреть</span><span>Переместит в список "Смотрю"</span></div></div>`,
            Remove: `<div class="shikimori-remove"><div><span>Удалить</span><span>Удаляет из спика</span></div></div>`,
            Completed: `<div class="shikimori-completed"><div><span>Просмотренно</span><span>Переместит в список "Просмотренно"</span></div></div>`,
            Dropped: `<div class="shikimori-dropped"><div><span>Забросить</span><span>Переместить в список "Заброшенные"</span></div></div>`,
            Rewatch: `<div class="shikimori-rewatch"><div><span>Пересмотреть</span><span>Переместить в список “Пересмотреть”</span></div></div>`,
            Info: `<div class="shikimori-info-status"><div><span></span><img src="https://raw.githubusercontent.com/MaximKolpak/TunimeScript/main/resources/status.png" alt="Status"></div></div>`,
            maintags: {
                addtolist: ".shikimori-add-anime",
                startwatch: ".shikimori-start-watch",
                remove: ".shikimori-remove",
                completed: ".shikimori-completed",
                dropped: ".shikimori-dropped",
                rewatch: ".shikimori-rewatch",
                info: ".shikimori-info-status"
            }
        },
        style: `
        .shikimori-add-anime,
        .shikimori-start-watch,
        .shikimori-remove,
        .shikimori-completed,
        .shikimori-dropped,
        .shikimori-rewatch{
            @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
            margin-top: 5px;
            background: #1A1A1A;
            border: 1px solid #1E59B0;
            box-shadow: 0px 0px 4px #1E59B0;
            border-radius: 4px;
            font-family: 'Roboto', sans-serif;
            cursor: pointer;
        }

        .shikimori-add-anime > 
        div:nth-child(1),
        .shikimori-start-watch > 
        div:nth-child(1),
        .shikimori-remove > 
        div:nth-child(1),
        .shikimori-completed > 
        div:nth-child(1),
        .shikimori-dropped > 
        div:nth-child(1),
        .shikimori-rewatch > 
        div:nth-child(1){
            margin-left: 20px;
            display: flex;
            flex-direction: column;
            padding: 7px 0;
        }

        .shikimori-add-anime > 
        div:nth-child(1) > span:nth-child(1),
        .shikimori-start-watch > 
        div:nth-child(1) > span:nth-child(1),
        .shikimori-remove > 
        div:nth-child(1) > span:nth-child(1),
        .shikimori-completed > 
        div:nth-child(1) > span:nth-child(1),
        .shikimori-dropped > 
        div:nth-child(1) > span:nth-child(1),
        .shikimori-rewatch > 
        div:nth-child(1) > span:nth-child(1){
            color: #FFF;
            font-size: 14px;
        }

        .shikimori-add-anime > 
        div:nth-child(1) > span:nth-child(2),
        .shikimori-start-watch > 
        div:nth-child(1) > span:nth-child(2),
        .shikimori-remove > 
        div:nth-child(1) > span:nth-child(2),
        .shikimori-completed > 
        div:nth-child(1) > span:nth-child(2),
        .shikimori-dropped > 
        div:nth-child(1) > span:nth-child(2),
        .shikimori-rewatch > 
        div:nth-child(1) > span:nth-child(2){
            color: #676767;
            font-size: 9px;
        }
        `,

        styleadded: false,

        Show: function (html = this.html.AddToList, style = this.style) {
            $(`.marker`).remove();
            $(`.other-lists-container`).remove();
            $(`.content-img-block`).append(html);

            if (!this.styleadded) {
                GM_addStyle(style);
                this.styleadded = true;
            }
        },

        Control: function (func = () => { }, tag = this.html.maintags.addtolist) {
            $(tag).click(() => { func() });
        },

        Dispose: function (tag = this.html.maintags.addtolist) {
            $(tag).remove();
        },

        ShowStatus: function (status = "", html = this.html.Info, tag = this.html.maintags.info) {
            let t = (status == "planned") ? ("Запланировано") : ((status == "watching") ? ("Смотрю") : ((status == "completed") ? ("Просмотрено") : ((status == "rewatching") ? ("Пересматриваю") : ((status == "dropped") ? ("Брошено") : ("Отложено")))));
            let s = $(tag);
            if (s.length == 0 && status != "") {
                $(`.poster-block`).after(html);
                $(`.shikimori-info-status > div:nth-child(1) > span:nth-child(1)`).html(t);
            } else if (status != "") {
                $(`.shikimori-info-status > div:nth-child(1) > span:nth-child(1)`).html(t);
            } else if (status == "") {
                s.remove();
            }
        },

        ShowEpisode: function (episode = 0) {
            if (episode != 0) {
                yummy.SetVideoShow(episode);
            }
        }
    }

    let yummy; // class Yummyanime
    let preAnime; //return anime Search [0] item
    let anime; // return anime Shikimori
    let user;//return info user
    let animeinlist; //return in list from anime

    let globPrec = 0;//Percentage allo anime
    let nameSelec = 0;//Selected name

    $(document).ready(async () => {
        yummy = new Yummyanime();
        if (!yummy.IsPageAnime) {
            return;
        }
        ScriptPercentage();
        preAnime = await shikimori.Request.GETasync(`/api/animes?search=${yummy.Name}`);
        anime = await shikimori.Request.GETasync(`/api/animes/${preAnime[0].id}`);
        CompliancePercentage(anime.russian, yummy.Name);
        await sleep(100);
        let find = await FindAnime();
        if (find) {
            Main();
            //console.log(anime);
        } else {
            alert("Sorry I`m not found anime");
        }
    });

    function FindAnime() {
        return new Promise(async (resolve) => {
            let date = "/api/animes"
            let year = yummy.Year;
            date += (year) ? `&season=${year}` : "";


            for (let index = 0; index < yummy.Names.length; index++) {
                if (globPrec > 52) {
                    resolve(true)
                    return;
                } else {
                    preAnime = await shikimori.Request.GETasync(`/api/animes?search=${yummy.Names[index]}${date}`);
                    anime = await shikimori.Request.GETasync(`/api/animes/${preAnime[0].id}`);
                    if (/[a-zA-Z]/.test(yummy.Names[index])) {
                        CompliancePercentage(anime.name, yummy.Names[index]);
                    } else {
                        CompliancePercentage(anime.russian, yummy.Names[index]);
                    }
                }
            }
            if (globPrec > 52) {
                resolve(true);
                return;
            } else {
                resolve(false);
                return;
            }
        });
    }

    function Main() {
        ShikimoriCritick();
        shikimori.Events.Auth.Subscribe(Loginned);
        shikimori.TryAuthorizate();
    }

    function Loginned(e) {
        if (e == true) {
            Authorization.Dispose(true);
            Authorization.Show(false, Authorization.html1);
            Authorization.MyFunction(() => {
                shikimori.Logout();
            });
            UserProfile.Show();
            AccessLogin();
        } else {
            Authorization.Show(true);
        }
    }

    ///If you logined in shikimori
    async function AccessLogin() {
        shikimori.User.GET('/api/users/whoami', async (d, s) => {
            if (s == "success") {
                user = d;
                UserProfile.Name(user.nickname);
                await sleep(500);
                GetAnimeList();
            }else{
                console.log("Not Loggin");
            }
        });
    }

    function GetAnimeList() {
        shikimori.User.GET(`/api/v2/user_rates?user_id=${user.id}&target_id=${anime.id}&target_type=Anime`, (d, s) => {
            if (s == "success") {
                animeinlist = d;
                AnimeList();

                //Subscribe for change video number and write for shikimori
                UpdateWatchEpisode();
                //Subcribe from search anime focus
                SearchAnime();
                //Set Raiting Video
                RaitingRange();
            }
        });
    }

    //If you watch anime Go To Raiting Add
    function RaitingRange() {
        if (animeinlist.status == "completed") {
            if ($(`.raiting-shikimori`).length == 0) {
                $(`.content-desc`).append(`
                    <input class="raiting-shikimori" type="range" style="width:100%" list="tickmarks" min="0" max="10" step="1" value="${animeinlist.score}">
                    <datalist id="tickmarks" style="display: flex;justify-content: space-between;margin-top: -15px;font-size: 13px;color: #676767;margin-right: 2px;margin-left: 5px;">
                    <option value="0" label="0"> 
                    <option value="1"> 
                    <option value="2"> 
                    <option value="3"> 
                    <option value="4"> 
                    <option value="5" label="5"> 
                    <option value="6"> 
                    <option value="7"> 
                    <option value="8"> 
                    <option value="9"> 
                    <option value="10" label="10"> 
                    </datalist>
                `);
                $(`.content-desc`).change(async (eventObject) => {
                    let value = eventObject.target.value;
                    await sleep(1500);
                    shikimori.User.POST('/api/v2/user_rates', {
                        "user_rate": {
                            user_id: user.id,
                            target_id: anime.id,
                            target_type: "Anime",
                            score: value
                        }
                    }, (d, s) => { if (s == "success") { animeinlist = d; } });
                });
            } else {
                $(`.raiting-shikimori`).value(animeinlist.score);
            }
        } else {
            if ($(`.raiting-shikimori`).length != 0) {
                $(`.raiting-shikimori`).remove();
                $(`#tickmarks`).remove();

            }
        }
    }

    let searchResult = false;
    let searchStatus = "planned";

    function SearchAnime() {
        $(`div.search-block-wrapper:nth-child(1) > form:nth-child(1) > input:nth-child(1)`).click(async () => {
            if (searchResult) {
                return;
            }
            searchResult = true;
            let data = await shikimori.Request.GETasync(`/api/v2/user_rates?user_id=${user.id}&status=${searchStatus}&limit=5`);
            $(`div.search-block-wrapper:nth-child(1) > div:nth-child(2)`).addClass(`open`);
            $(`.shikimori-search-type`).addClass(`shikimori-search-type-show`);
            for (let index = 0; index < data.length; index++) {
                let a = await shikimori.Request.GETasync(`/api/animes/${data[index].target_id}`);
                let y = await yummy.SearchAnimeAsync(a.russian);
                if (y.animes) {
                    $(`div.search-block-wrapper:nth-child(1) > div:nth-child(2)`).append(`<a href="https://yummyanime.club/catalog/item/${y.animes.data[0].alias}" class="shikimori-search-result" style="background: #1a1a1a;color: #fff;border-radius: 3px;border: 1px solid #1f539f; margin-bottom: 3px;">${a.russian}</a>`);
                }
                await sleep(300);
            }
        });
        $(`.content-page`).click(() => {
            if (!searchResult) {
                return;
            }
            searchResult = false;
            $(`div.search-block-wrapper:nth-child(1) > div:nth-child(2)`).removeClass(`open`);
            $(`.shikimori-search-result`).toArray().forEach((e) => {
                $(e).remove();
            });
            $(`.shikimori-search-type`).removeClass(`shikimori-search-type-show`);
        });

        SearchType();
    }

    function SearchType(){
        let t = $(`.shikimori-search-type`);
        if(t.length < 0){

        }else{
            $(`div.search-block-wrapper:nth-child(1) > form:nth-child(1)`).append(`<div class="shikimori-search-type" style="position: absolute;right: 50px;display: flex;align-items: center;justify-content: left;top: 10px;bottom: 10px;background: #1A1A1A;color: white;padding: 0 10px;border-radius: 4px;cursor: pointer;font-family: 'Roboto';font-size: 14px;border: 2px solid #1E59B0;text-overflow: ellipsis;overflow: hidden;transition: .3s ease-in-out;">Запланировано</div>`);
            t = $(`.shikimori-search-type`);
            GM_addStyle(`@media screen and (max-width:350px){.shikimori-search-type-show {width: 30px;}}`);
        }
        t.click(()=>{
            searchStatus = (searchStatus == "planned")?"watching":"planned";
            t.html((searchStatus == "planned")?"Запланировано":"Смотрю");
            $(`div.search-block-wrapper:nth-child(1) > div:nth-child(2)`).removeClass(`open`);
            $(`.shikimori-search-result`).toArray().forEach((e) => {
                $(e).remove();
            });
            searchResult = false;
            $(`.shikimori-search-type`).removeClass(`shikimori-search-type-show`);
        });
    }

    function UpdateWatchEpisode() {
        yummy.EventChangeVideo((obj) => {
            if (anime.episodes > yummy.Episode && !Array.isArray(animeinlist) && animeinlist.status != "completed") {
                if (animeinlist.status == "planned") {
                    let dialog = confirm("Хотите изменить стату на 'Смотрю'? Что начался подсчет серий");
                    if (dialog) {
                        shikimori.User.POST('/api/v2/user_rates', {
                            "user_rate": {
                                user_id: user.id,
                                target_id: anime.id,
                                target_type: "Anime",
                                episodes: yummy.Episode,
                                status: "watching"
                            }
                        }, (d, s) => {
                            if (s == "success") {
                                animeinlist = d;
                                //console.log(animeinlist);
                                AnimeStatus.Dispose(AnimeStatus.html.maintags.remove);
                                AnimeStatus.Dispose(AnimeStatus.html.maintags.startwatch);
                                AnimeList();
                                AnimeStatus.ShowEpisode((Array.isArray(animeinlist)) ? 0 : animeinlist.episodes);
                            }
                        });
                    } else {
                        return;
                    }
                }
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        episodes: yummy.Episode
                    }
                }, (d, s) => { if (s == "success") { animeinlist = d; AnimeStatus.ShowEpisode((Array.isArray(animeinlist)) ? 0 : animeinlist.episodes); } });
            }
        });
        yummy.StartEvents();
    }

    function AnimeList() {
        animeinlist = (Array.isArray(animeinlist)) ? ((animeinlist.length == 0) ? animeinlist : animeinlist[0]) : animeinlist;
        console.log(animeinlist);
        if (animeinlist.length == 0) { // Add to list
            AnimeStatus.Show();
            AnimeStatus.Control(() => {
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        status: "planned"
                    }
                }, (d, s) => {
                    if (s == "success") {
                        animeinlist = d;
                        //console.log(animeinlist);
                        AnimeStatus.Dispose();
                        AnimeList();
                    }
                });
            });
        } else if (animeinlist.status == "planned") { //Start watch and remove
            AnimeStatus.Show(AnimeStatus.html.StartWatch);
            AnimeStatus.Show(AnimeStatus.html.Remove);

            AnimeStatus.Control(() => { // Start Watch (watching)
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        status: "watching"
                    }
                }, (d, s) => {
                    if (s == "success") {
                        animeinlist = d;
                        //console.log(animeinlist);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.remove);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.startwatch);
                        AnimeList();
                    }
                });
            }, AnimeStatus.html.maintags.startwatch);

            AnimeStatus.Control(() => { // Remove
                shikimori.User.DELETE(`/api/v2/user_rates/${animeinlist.id}`, (response) => {
                    if (response.status == 204) {
                        animeinlist = [];
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.remove);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.startwatch);
                        AnimeList();
                    }
                });
            }, AnimeStatus.html.maintags.remove);
        } else if (animeinlist.status == "watching") {//Satrt Completed and dropped

            AnimeStatus.Show(AnimeStatus.html.Completed);
            AnimeStatus.Show(AnimeStatus.html.Dropped);

            AnimeStatus.Control(() => { // Completed watch anime
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        status: "completed"
                    }
                }, (d, s) => {
                    if (s == "success") {
                        animeinlist = d;
                        //console.log(animeinlist);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.completed);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.dropped);
                        AnimeList();
                    }
                });
            }, AnimeStatus.html.maintags.completed);


            AnimeStatus.Control(() => {// Dropped watch anime
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        status: "dropped"
                    }
                }, (d, s) => {
                    if (s == "success") {
                        animeinlist = d;
                        //console.log(animeinlist);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.completed);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.dropped);
                        AnimeList();
                    }
                });
            }, AnimeStatus.html.maintags.dropped);
        } else if (animeinlist.status == "completed") {

            AnimeStatus.Show(AnimeStatus.html.Rewatch);
            AnimeStatus.Control(() => {
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        status: "rewatching"
                    }
                }, (d, s) => {
                    if (s == "success") {
                        animeinlist = d;
                        //console.log(animeinlist);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.rewatch);
                        AnimeList();
                    }
                });
            }, AnimeStatus.html.maintags.rewatch);
        } else if (animeinlist.status == "rewatching") {
            AnimeStatus.Show(AnimeStatus.html.Completed);

            AnimeStatus.Control(() => { // Completed watch anime
                shikimori.User.POST('/api/v2/user_rates', {
                    "user_rate": {
                        user_id: user.id,
                        target_id: anime.id,
                        target_type: "Anime",
                        status: "completed"
                    }
                }, (d, s) => {
                    if (s == "success") {
                        animeinlist = d;
                        //console.log(animeinlist);
                        AnimeStatus.Dispose(AnimeStatus.html.maintags.completed);
                        AnimeList();
                    }
                });
            }, AnimeStatus.html.maintags.completed);

        }

        AnimeStatus.ShowStatus((Array.isArray(animeinlist)) ? "" : animeinlist.status);
        AnimeStatus.ShowEpisode((Array.isArray(animeinlist)) ? 0 : animeinlist.episodes);
    }

    function UpdateGlobPrec(i) {
        globPrec = i.toFixed(3).replace(/\.0+$/, "");
        $(`.script-prectengle > div:nth-child(1) > div:nth-child(1)`).html(`${globPrec}%`);
    }

    function ScriptPercentage() {
        UI();
        function UI() {
            $(`.poster-block`).append(`
                <div class="script-prectengle">
                    <div>
                        <div>${globPrec}%</div>
                        <div>Совпадение</div>
                    </div>
                </div>
            `);
            GM_addStyle(`
            @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
            .script-prectengle{
                font-family: 'Roboto', sans-serif;
                background: rgba(26, 26, 26, 0.75);
                border: 2px solid #1E59B0;
                border-radius: 6px;
                color: #fff;
                box-shadow: 0px 0px 6px #1E59B0;
                top: 5px;
                left: 5px;
                position: absolute;
            }
            .script-prectengle > div:nth-child(1){
                margin: 0 20px;
                padding: 7px 0;
            }
            .script-prectengle > div:nth-child(1) > div:nth-child(1){
                font-size:14px;
            }
            .script-prectengle > div:nth-child(1) > div:nth-child(2){
                font-size: 11px;
                color: #676767;
            }
            .shikimori-info-status{
                font-family: 'Roboto', sans-serif;
                font-size: 14px;
                background: #1A1A1A;
                border: 1px solid #1E59B0;
                font-weight: bold;
                color: white;
                box-shadow: 0px 0px 3px #1E59B0;
                border-radius: 4px;
                margin: 10px 0;
            }
            .shikimori-info-status > div:nth-child(1){
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 7px 20px;
            }
            .shikimori-info-status > div:nth-child(1) > img:nth-child(2){
                width: 19px;
                filter: drop-shadow(0px 0px 2px rgba(30, 89, 176, 0.7));
            }
            .shikimori-watch{
                border: 2px solid #1E59B0;
                margin-top: -2px;
                transform: translateY(2px);
                border-radius: 5px;
                box-shadow: 0px 0px 4px #1E59B0;
            }


            .raiting-shikimori[type=range] {
                height: 25px;
                -webkit-appearance: none;
                margin: 10px 0;
                width: 100%;
              }
              .raiting-shikimori[type=range]:focus {
                outline: none;
              }
              .raiting-shikimori[type=range]::-webkit-slider-runnable-track {
                width: 100%;
                height: 8px;
                cursor: pointer;
                animate: 0.2s;
                box-shadow: 0px 0px 4px #1E59B0;
                background: #1D2236;
                border-radius: 50px;
                border: 0px solid #000000;
              }
              .raiting-shikimori[type=range]::-webkit-slider-thumb {
                box-shadow: 0px 0px 2px #000000;
                border: 1px solid #1E59B0;
                height: 18px;
                width: 18px;
                border-radius: 25px;
                background: #1E59B0;
                cursor: pointer;
                -webkit-appearance: none;
                margin-top: -5.5px;
              }
              .raiting-shikimori[type=range]:focus::-webkit-slider-runnable-track {
                background: #1D2236;
              }
              .raiting-shikimori[type=range]::-moz-range-track {
                width: 100%;
                height: 8px;
                cursor: pointer;
                animate: 0.2s;
                box-shadow: 0px 0px 4px #1E59B0;
                background: #1D2236;
                border-radius: 50px;
                border: 0px solid #000000;
              }
              .raiting-shikimori[type=range]::-moz-range-thumb {
                box-shadow: 0px 0px 2px #000000;
                border: 1px solid #1E59B0;
                height: 18px;
                width: 18px;
                border-radius: 25px;
                background: #1E59B0;
                cursor: pointer;
              }
              .raiting-shikimori[type=range]::-ms-track {
                width: 100%;
                height: 8px;
                cursor: pointer;
                animate: 0.2s;
                background: transparent;
                border-color: transparent;
                color: transparent;
              }
              .raiting-shikimori[type=range]::-ms-fill-lower {
                background: #1D2236;
                border: 0px solid #000000;
                border-radius: 100px;
                box-shadow: 0px 0px 4px #1E59B0;
              }
              .raiting-shikimori[type=range]::-ms-fill-upper {
                background: #1D2236;
                border: 0px solid #000000;
                border-radius: 100px;
                box-shadow: 0px 0px 4px #1E59B0;
              }
              .raiting-shikimori[type=range]::-ms-thumb {
                margin-top: 1px;
                box-shadow: 0px 0px 2px #000000;
                border: 1px solid #1E59B0;
                height: 18px;
                width: 18px;
                border-radius: 25px;
                background: #1E59B0;
                cursor: pointer;
              }
              .raiting-shikimori[type=range]:focus::-ms-fill-lower {
                background: #1D2236;
              }
              .raiting-shikimori[type=range]:focus::-ms-fill-upper {
                background: #1D2236;
              }
              
            `);
        }
    }

    function ShikimoriCritick() {
        UI();
        function UI() {
            let c = 0;
            for (let index = 0; index < anime.rates_scores_stats.length; index++) {
                c += anime.rates_scores_stats[index].value;
            }
            $(`.alt-names-list`).hide();
            $(`.alt-names-list`).after(`
            <ul class="alt-names-list">
            <div class="critik-shikimori">
                <div>
                    <div class="critik-info">
                        <span>Shikimori</span>
                        <span>${c} Голосов</span>
                    </div>
                    <div class="critik-score">
                        <span>${anime.score}</span>
                        <div>
                            <img src="https://raw.githubusercontent.com/MaximKolpak/TunimeScript/main/resources/star-icon.png" />
                        </div>
                    </div>
                </div>
            </div>
            </ul>
            `);
            GM_addStyle(`
                @import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
                .critik-shikimori{
                    font-family: 'Roboto', sans-serif;
                    background: #1A1A1A;
                    border: 2px solid #1E59B0;
                    border-radius: 4px;
                    color: #fff;
                    box-shadow: 0px 0px 6px #1E59B0;
                    margin-top: 5px;
                }
                .critik-shikimori > div{
                    margin: 12px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .critik-shikimori > div > .critik-info{
                    display: flex;
                    flex-direction: column;
                }
                .critik-info > span:nth-child(1){
                    font-size: 16px;
                    font-weight: bold;
                }
                .critik-info > span:nth-child(2){
                    font-size: 13px;
                    color: #676767;
                }
                .critik-shikimori > div > .critik-score{
                    display: flex;
                    align-items: center;
                }
                .critik-score > span:nth-child(1){
                    font-size: 18px;
                    font-weight: bold;
                    margin-right: 10px;
                }
                .critik-score > div:nth-child(2){
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 2px solid;
                    border-radius: 50%;
                }
                .critik-score > div:nth-child(2) > img:nth-child(1){
                    width: 20px;
                }
            `);
        }
    }

    async function CompliancePercentage(shiki_name = "", yummy_name = "") {
        let all = 0;
        let perc = 25;
        let i = levenshtein(shiki_name, yummy_name);
        i = (i != 0) ? i : 1;
        all += perc / (i * 100);
        all += (anime.kind == yummy.Type) ? (perc / (1 * 100)) : (0);
        all += (anime.status == yummy.Status) ? (perc / (1 * 100)) : (0);
        all += (anime.episodes == yummy.Episodes) ? (perc / (1 * 100)) : (0);
        UpdateGlobPrec(all * 100);
    }

    /**
 * @param {string} s1 Исходная строка
 * @param {string} s2 Сравниваемая строка
 * @param {object} [costs] Веса операций { [replace], [replaceCase], [insert], [remove] }
 * @return {number} Расстояние Левенштейна
 */
    function levenshtein(s1, s2, costs) {
        var i, j, l1, l2, flip, ch, chl, ii, ii2, cost, cutHalf;
        l1 = s1.length;
        l2 = s2.length;

        costs = costs || {};
        var cr = costs.replace || 1;
        var cri = costs.replaceCase || costs.replace || 1;
        var ci = costs.insert || 1;
        var cd = costs.remove || 1;

        cutHalf = flip = Math.max(l1, l2);

        var minCost = Math.min(cd, ci, cr);
        var minD = Math.max(minCost, (l1 - l2) * cd);
        var minI = Math.max(minCost, (l2 - l1) * ci);
        var buf = new Array((cutHalf * 2) - 1);

        for (i = 0; i <= l2; ++i) {
            buf[i] = i * minD;
        }

        for (i = 0; i < l1; ++i, flip = cutHalf - flip) {
            ch = s1[i];
            chl = ch.toLowerCase();

            buf[flip] = (i + 1) * minI;

            ii = flip;
            ii2 = cutHalf - flip;

            for (j = 0; j < l2; ++j, ++ii, ++ii2) {
                cost = (ch === s2[j] ? 0 : (chl === s2[j].toLowerCase()) ? cri : cr);
                buf[ii + 1] = Math.min(buf[ii2 + 1] + cd, buf[ii] + ci, buf[ii2] + cost);
            }
        }
        return buf[l2 + cutHalf - flip];
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
})();