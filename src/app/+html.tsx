// Web page shell (static export). Holds the boot splash: plain HTML + CSS so
// it animates the instant the page arrives — before the JavaScript bundle has
// downloaded. The app calls window.__bootDone() once fonts and saved data are
// ready; the splash then finishes its progress bar and fades away.
//
// First visit: full splash (bobbing spade, four cards dealt to the seats,
// pixel progress bar). Reload (e.g. pull-down-to-refresh): just a thin
// progress bar across the top of the screen.
import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import React from 'react';
import { IMAGES } from '../assets/images';

const INK = '#1d2a44';
const CREAM = '#fbf1dc';
const PAPER = '#fffaf0';
const TOMATO = '#c9432a';
const SUN = '#f6d55c';

const css = `
html,body{background:${CREAM};}
#boot{position:fixed;inset:0;z-index:9999;background:${CREAM};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;transition:opacity .4s ease;font-family:'Press Start 2P',ui-monospace,Menlo,monospace;color:${INK}}
#boot.done{opacity:0;pointer-events:none}
#boot .spade{width:88px;height:88px;image-rendering:pixelated;animation:bob .9s steps(4) infinite alternate}
@keyframes bob{from{transform:translateY(0)}to{transform:translateY(-12px)}}
#boot .word{font-size:18px;line-height:1.5;text-align:center;letter-spacing:1px}
#boot .table{position:relative;width:220px;height:120px;border:4px solid ${INK};border-radius:10px;background:repeating-conic-gradient(#d9483b 0 25%,#fff4e2 0 50%) 0 0/24px 24px;box-shadow:0 0 0 4px #5a381d,0 0 0 7px ${INK}}
#boot .card{position:absolute;left:50%;top:50%;width:34px;height:48px;margin:-24px 0 0 -17px;background:${PAPER};border:3px solid ${INK};border-radius:4px;box-shadow:0 3px 0 ${INK};display:flex;align-items:center;justify-content:center;opacity:0;animation:deal 2.4s ease-out infinite}
#boot .card img{width:18px;height:18px;image-rendering:pixelated}
#boot .c1{--x:0px;--y:-34px;animation-delay:0s}
#boot .c2{--x:62px;--y:0px;animation-delay:.25s}
#boot .c3{--x:0px;--y:34px;animation-delay:.5s}
#boot .c4{--x:-62px;--y:0px;animation-delay:.75s}
@keyframes deal{0%{opacity:0;transform:translate(0,90px) rotate(-20deg) scale(.7)}12%{opacity:1}30%,80%{opacity:1;transform:translate(var(--x),var(--y)) rotate(0) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1)}}
#boot .bar{width:220px;height:18px;border:3px solid ${INK};background:${PAPER};border-radius:4px;overflow:hidden;box-shadow:0 3px 0 ${INK}}
#boot .fill{height:100%;width:0;background:${TOMATO};animation:fill 3.2s steps(16) forwards}
#boot.done .fill{animation:none;width:100%}
@keyframes fill{to{width:88%}}
#boot .msg{font-family:'Nunito',system-ui,sans-serif;font-weight:800;font-size:15px}
#boot .top{display:none}
/* Reload: only a top progress bar */
.reloading #boot{background:transparent;pointer-events:none}
.reloading #boot>*:not(.top){display:none}
.reloading #boot .top{display:block;position:fixed;left:0;top:0;height:5px;width:0;background:${TOMATO};box-shadow:0 0 0 1px ${INK},0 2px 6px rgba(29,42,68,.35);animation:top 2.6s cubic-bezier(.1,.7,.3,1) forwards}
.reloading #boot .top::after{content:'';position:absolute;right:0;top:0;width:60px;height:100%;background:${SUN};opacity:.8}
.reloading #boot.done .top{animation:none;width:100%;transition:width .25s ease}
@keyframes top{to{width:85%}}
@media (prefers-reduced-motion:reduce){#boot .spade,#boot .card{animation:none}#boot .card{opacity:1;transform:translate(var(--x),var(--y))}}
`;

const script = `
(function(){
  var start=Date.now(),reload=false;
  try{var n=performance.getEntriesByType('navigation')[0];reload=!!n&&n.type==='reload';}catch(e){}
  if(reload)document.documentElement.classList.add('reloading');
  window.__bootDone=function(){
    var el=document.getElementById('boot');if(!el||el.dataset.done)return;el.dataset.done='1';
    // First launch: let the deal animation play at least once.
    var wait=reload?0:Math.max(0,1600-(Date.now()-start));
    setTimeout(function(){el.classList.add('done');setTimeout(function(){el.remove();},450);},wait);
  };
})();
`;

export default function Root({ children }: { children: React.ReactNode }) {
  const suit = (s: string) => IMAGES[`s-${s}`];
  // Expo's script/preload/font tags — a custom shell must place them itself.
  const { htmlAttributes, bodyAttributes, headNodes, bodyNodes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content={CREAM} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@800&family=Press+Start+2P&display=swap" rel="stylesheet" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script dangerouslySetInnerHTML={{ __html: script }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        <div id="boot" role="status" aria-live="polite" aria-label="Loading Backyard Spades">
          <div className="top" />
          <img className="spade" src={suit('S')} alt="" />
          <div className="word">
            BACKYARD
            <br />
            SPADES
          </div>
          <div className="table" aria-hidden="true">
            <div className="card c1">
              <img src={suit('S')} alt="" />
            </div>
            <div className="card c2">
              <img src={suit('H')} alt="" />
            </div>
            <div className="card c3">
              <img src={suit('C')} alt="" />
            </div>
            <div className="card c4">
              <img src={suit('D')} alt="" />
            </div>
          </div>
          <div className="bar">
            <div className="fill" />
          </div>
          <div className="msg">Shuffling the deck…</div>
        </div>
        {bodyNodes}
      </body>
    </html>
  );
}
