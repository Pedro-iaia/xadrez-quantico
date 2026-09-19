import sys, json, http.server, threading, functools
from playwright.sync_api import sync_playwright
raiz = sys.argv[1]; rotulo = sys.argv[2]
h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=raiz)
h.log_message = lambda *a, **k: None
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), h); porta = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
cenas = {'retrato_360x640': (360,640), 'retrato_390x844': (390,844), 'paisagem_844x390': (844,390), 'paisagem_667x375': (667,375)}
saida = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    for nome,(w,hh) in cenas.items():
        ctx = b.new_context(viewport={'width':w,'height':hh}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = ctx.new_page()
        pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(f'http://127.0.0.1:{porta}') else r.abort())
        pg.add_init_script("localStorage.setItem('xadrezQuantico_ocultarBoasVindas','true')")
        pg.goto(f'http://127.0.0.1:{porta}/index.html')
        pg.select_option('#configOponente','humano')
        pg.select_option('#configRelogio','rapida')
        pg.click('#btnComecar')
        pg.wait_for_selector('#tabuleiro .casa')
        m = pg.evaluate("""() => {
          const r = e => { const b = document.querySelector(e).getBoundingClientRect(); return {x:Math.round(b.x), y:Math.round(b.y), w:Math.round(b.width), h:Math.round(b.height)} };
          return { tabuleiro: r('#tabuleiro'), lateral: r('.coluna-lateral'), scrollW: document.documentElement.scrollWidth, innerW: innerWidth, innerH: innerHeight, docH: document.documentElement.scrollHeight };
        }""")
        m['overflowX'] = m['scrollW'] > m['innerW']
        m['tabuleiro_cabe_na_tela'] = m['tabuleiro']['y'] + m['tabuleiro']['h'] <= m['innerH']
        saida[nome] = m
        pg.screenshot(path=f'/tmp/shot_{rotulo}_{nome}.png')
        # Teste de toque: selecionar peça e trocar seleção
        pg.tap('[data-casa="e2"]'); pg.tap('[data-casa="d2"]')
        sel = pg.evaluate("() => [...document.querySelectorAll('.casa.selecionada')].map(e=>e.dataset.casa)")
        avisos = pg.evaluate("() => [...document.querySelectorAll('.aviso')].map(e=>e.textContent.trim())")
        saida[nome]['selecao_apos_2_toques'] = sel; saida[nome]['avisos'] = avisos
        ctx.close()
    b.close()
print(json.dumps(saida, indent=1, ensure_ascii=False))
