import sys, json, http.server, threading, functools
from playwright.sync_api import sync_playwright
raiz=sys.argv[1]
h=functools.partial(http.server.SimpleHTTPRequestHandler, directory=raiz)
srv=http.server.ThreadingHTTPServer(('127.0.0.1',0),h); porta=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
out={}
with sync_playwright() as p:
    b=p.chromium.launch()
    ctx=b.new_context(viewport={'width':360,'height':640},device_scale_factor=2,is_mobile=True,has_touch=True)
    pg=ctx.new_page()
    erros=[]; pg.on('pageerror',lambda e:erros.append(str(e))); pg.on('console',lambda m: erros.append(m.text) if m.type=='error' and 'Failed to load resource' not in m.text else None)
    reqs=[]; pg.on('request',lambda r:reqs.append(r.url))
    pg.route('**/*',lambda r:r.continue_() if r.request.url.startswith(f'http://127.0.0.1:{porta}') else r.abort())
    pg.add_init_script("localStorage.setItem('xadrezQuantico_ocultarBoasVindas','true')")
    pg.goto(f'http://127.0.0.1:{porta}/index.html')
    pg.click('#btnAtalhoOnline')
    out['pareamento']=pg.evaluate("""()=>({scrollW:document.documentElement.scrollWidth,innerW:innerWidth,
      fonteInput:getComputedStyle(document.getElementById('inputChavePar')).fontSize,
      peerCarregado: typeof Peer!=='undefined', firebase: typeof firebase!=='undefined'})""")
    pg.click('#btnVoltarTelaInicial')
    pg.select_option('#configOponente','humano'); pg.click('#btnComecar'); pg.wait_for_selector('#tabuleiro .casa')
    out['render_ms_medio']=pg.evaluate("()=>{const t=performance.now();for(let i=0;i<50;i++)renderizarTabuleiro();return (performance.now()-t)/50}")
    out['requisicoes_externas']=[u for u in reqs if not u.startswith(f'http://127.0.0.1:{porta}')]
    out['erros_js']=erros
    b.close()
print(json.dumps(out,indent=1,ensure_ascii=False))
