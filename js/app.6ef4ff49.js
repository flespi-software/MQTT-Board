(function(e){function n(n){for(var o,r,c=n[0],l=n[1],u=n[2],d=0,s=[];d<c.length;d++)r=c[d],a[r]&&s.push(a[r][0]),a[r]=0;for(o in l)Object.prototype.hasOwnProperty.call(l,o)&&(e[o]=l[o]);f&&f(n);while(s.length)s.shift()();return i.push.apply(i,u||[]),t()}function t(){for(var e,n=0;n<i.length;n++){for(var t=i[n],o=!0,r=1;r<t.length;r++){var c=t[r];0!==a[c]&&(o=!1)}o&&(i.splice(n--,1),e=l(l.s=t[0]))}return e}var o={},r={app:0},a={app:0},i=[];function c(e){return l.p+"js/"+({}[e]||e)+"."+{"4102bf14":"e8af5a45","4b47640d":"21cfc388",fab5712e:"7922212b"}[e]+".js"}function l(n){if(o[n])return o[n].exports;var t=o[n]={i:n,l:!1,exports:{}};return e[n].call(t.exports,t,t.exports,l),t.l=!0,t.exports}l.e=function(e){var n=[],t={"4102bf14":1,fab5712e:1};r[e]?n.push(r[e]):0!==r[e]&&t[e]&&n.push(r[e]=new Promise(function(n,t){for(var o="css/"+({}[e]||e)+"."+{"4102bf14":"4466b6eb","4b47640d":"31d6cfe0",fab5712e:"bc57e32d"}[e]+".css",r=l.p+o,a=document.getElementsByTagName("link"),i=0;i<a.length;i++){var c=a[i],u=c.getAttribute("data-href")||c.getAttribute("href");if("stylesheet"===c.rel&&(u===o||u===r))return n()}var d=document.getElementsByTagName("style");for(i=0;i<d.length;i++){c=d[i],u=c.getAttribute("data-href");if(u===o||u===r)return n()}var s=document.createElement("link");s.rel="stylesheet",s.type="text/css",s.onload=n,s.onerror=function(n){var o=n&&n.target&&n.target.src||r,a=new Error("Loading CSS chunk "+e+" failed.\n("+o+")");a.request=o,t(a)},s.href=r;var f=document.getElementsByTagName("head")[0];f.appendChild(s)}).then(function(){r[e]=0}));var o=a[e];if(0!==o)if(o)n.push(o[2]);else{var i=new Promise(function(n,t){o=a[e]=[n,t]});n.push(o[2]=i);var u,d=document.getElementsByTagName("head")[0],s=document.createElement("script");s.charset="utf-8",s.timeout=120,l.nc&&s.setAttribute("nonce",l.nc),s.src=c(e),u=function(n){s.onerror=s.onload=null,clearTimeout(f);var t=a[e];if(0!==t){if(t){var o=n&&("load"===n.type?"missing":n.type),r=n&&n.target&&n.target.src,i=new Error("Loading chunk "+e+" failed.\n("+o+": "+r+")");i.type=o,i.request=r,t[1](i)}a[e]=void 0}};var f=setTimeout(function(){u({type:"timeout",target:s})},12e4);s.onerror=s.onload=u,d.appendChild(s)}return Promise.all(n)},l.m=e,l.c=o,l.d=function(e,n,t){l.o(e,n)||Object.defineProperty(e,n,{enumerable:!0,get:t})},l.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},l.t=function(e,n){if(1&n&&(e=l(e)),8&n)return e;if(4&n&&"object"===typeof e&&e&&e.__esModule)return e;var t=Object.create(null);if(l.r(t),Object.defineProperty(t,"default",{enumerable:!0,value:e}),2&n&&"string"!=typeof e)for(var o in e)l.d(t,o,function(n){return e[n]}.bind(null,o));return t},l.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return l.d(n,"a",n),n},l.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},l.p="",l.oe=function(e){throw console.error(e),e};var u=window["webpackJsonp"]=window["webpackJsonp"]||[],d=u.push.bind(u);u.push=n,u=u.slice();for(var s=0;s<u.length;s++)n(u[s]);var f=d;i.push([0,"vendor"]),t()})({0:function(e,n,t){e.exports=t("2f39")},"034f":function(e,n,t){"use strict";var o=t("fb1c"),r=t.n(o);r.a},"1e5d":function(e,n,t){},"2f39":function(e,n,t){"use strict";t.r(n);t("4a91"),t("a114"),t("d14b"),t("113c"),t("1e5d"),t("7e6d");var o=t("2b0e"),r=t("e84f"),a=t("7051"),i=t("2040"),c=t("cf12"),l=t("46a9"),u=t("32a1"),d=t("f30c"),s=t("ce67"),f=t("0952"),p=t("2a70"),v=t("1180"),b=t("1e55"),h=t("506f"),g=t("b8d9"),m=t("7d43"),w=t("9541"),y=t("91c8"),Q=t("482e"),q=t("52b5"),T=t("5d8b"),x=t("525b"),C=t("bc9b"),E=t("5931"),P=t("7646"),S=t("6580"),j=t("3a08"),k=t("3054"),L=t("6ddb"),O=t("ac83"),A=t("03d8"),M=t("09fa6"),_=t("b5b8"),B=t("4bf4"),N=t("79e9"),I=t("1526"),D=t("2bd2"),H=t("f62b"),R=t("133b"),J=t("6780"),W=t("f9d8");o["default"].use(r["a"],{config:{},components:{QLayout:a["a"],QLayoutHeader:i["a"],QLayoutDrawer:c["a"],QPageContainer:l["a"],QPage:u["a"],QToolbar:d["a"],QToolbarTitle:s["a"],QModal:f["a"],QModalLayout:p["a"],QList:v["a"],QListHeader:b["a"],QItem:h["a"],QItemMain:g["a"],QItemSide:m["a"],QItemTile:w["a"],QItemSeparator:y["a"],QBtn:Q["a"],QIcon:q["a"],QInput:T["a"],QCheckbox:x["a"],QToggle:C["a"],QSelect:E["a"],QCard:P["a"],QCardTitle:S["a"],QCardMain:j["a"],QCardSeparator:k["a"],QCardActions:L["a"],QCollapsible:O["a"],QTooltip:A["a"],QBtnToggle:M["a"],QPopover:_["a"],QChip:B["a"],QField:N["a"]},directives:{Ripple:I["a"],CloseOverlay:D["a"],TouchPan:H["a"]},plugins:{Notify:R["a"],Dialog:J["a"],LocalStorage:W["a"]}});var F=function(){var e=this,n=e.$createElement,t=e._self._c||n;return t("div",{attrs:{id:"q-app"}},[t("router-view")],1)},$=[];F._withStripped=!0;var z={name:"App"},G=z,K=(t("034f"),t("2877")),U=Object(K["a"])(G,F,$,!1,null,null,null);U.options.__file="App.vue";var V=U.exports,X=t("8c4f"),Y=[{path:"/",component:function(){return t.e("4102bf14").then(t.bind(null,"f241"))},children:[{path:"",component:function(){return t.e("fab5712e").then(t.bind(null,"8b24"))}}]}];Y.push({path:"*",component:function(){return t.e("4b47640d").then(t.bind(null,"e51e"))}});var Z=Y;o["default"].use(X["a"]);var ee=function(){var e=new X["a"]({scrollBehavior:function(){return{y:0}},routes:Z,mode:"hash",base:""});return e},ne=function(){var e="function"===typeof ee?ee({}):ee,n={el:"#q-app",router:e,render:function(e){return e(V)}};return{app:n,router:e}},te=t("9483");Object(te["a"])("service-worker.js",{ready:function(){console.log("App is being served from cache by a service worker.")},registered:function(e){console.log("Service worker has been registered.")},cached:function(e){console.log("Content has been cached for offline use.")},updatefound:function(e){console.log("New content is downloading.")},updated:function(e){var n=document.createElement("div");n.id="sw-notification",n.innerHTML='<div class="q-notification-list q-notification-list-bottom fixed column items-end absolute">\n                                              <div class="q-notification">\n                                                <div class="q-alert row no-wrap shadow-2 bg-amber-9 text-white">\n                                                  <div class="q-alert-side col-auto row flex-center">\n                                                    <i aria-hidden="true" class="q-icon material-icons">warning</i>\n                                                  </div>\n                                                  <div class="q-alert-content col self-center">\n                                                    <div>The new version of MQTT Board is available. Refresh the page to update?</div>\n                                                  </div>\n                                                  <div class="q-alert-actions col-auto gutter-xs column flex-center">\n                                                    <div class="full-width">\n                                                      <button tabindex="0" class="q-btn inline relative-position q-btn-item non-selectable full-width q-btn-rectangle q-btn-flat q-focusable q-hoverable q-btn-dense">\n                                                        <div class="q-focus-helper"></div>\n                                                        <div class="q-btn-inner row col items-center justify-start">\n                                                          <div>Agree</div>\n                                                        </div>\n                                                      </button>\n                                                    </div>\n                                                    <div class="full-width">\n                                                      <button tabindex="0" class="q-btn inline relative-position q-btn-item non-selectable full-width q-btn-rectangle q-btn-flat q-focusable q-hoverable q-btn-dense">\n                                                        <div class="q-focus-helper"></div>\n                                                        <div class="q-btn-inner row col items-center justify-start">\n                                                          <div>Abort</div>\n                                                        </div>\n                                                      </button>\n                                                    </div>\n                                                  </div>\n                                                </div>\n                                              </div>\n                                            </div>';var t=n.getElementsByTagName("button"),o=document.getElementsByTagName("body")[0];function r(){"serviceWorker"in navigator?navigator.serviceWorker.getRegistration().then(function(e){e?e.unregister().then(function(){window.location.reload(!0)}):window.location.reload(!0)}):window.location.reload(!0),setTimeout(function(){window.location.reload(!0)},1e3)}t[0].addEventListener("click",function(e){r()}),t[1].addEventListener("click",function(e){n.remove()}),o.appendChild(n)},offline:function(){console.log("No internet connection found. App is running in offline mode.")},error:function(e){console.error("Error during service worker registration:",e)}});var oe=t("fe3c"),re=t.n(oe),ae=ne(),ie=ae.app;ae.router;/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream&&window.navigator.standalone&&document.addEventListener("DOMContentLoaded",function(){re.a.attach(document.body)},!1),new o["default"](ie)},"7e6d":function(e,n,t){},fb1c:function(e,n,t){}});