import random
import copy

class PecaQuantica:
    """Representa uma peça em superposição quântica."""
    def __init__(self, possibilidades):
        self.possibilidades = possibilidades  # Ex: ['C', 'B'] (Cavalo ou Bispo)
        self.revelada = None

    def observar(self):
        """Força o colapso da peça para uma identidade definitiva."""
        if not self.revelada:
            self.revelada = random.choice(self.possibilities)
            self.possibilidades = [self.revelada]
        return self.revelada

    def __repr__(self):
        if self.revelada:
            return self.revelada
        return f"?({'/'.join(self.possibilidades)})"


class TabuleiroQuantico:
    """Gere o tabuleiro e as regras quânticas."""
    def __init__(self):
        # Tabuleiro simples 3x3 para demonstração
        self.tabuleiro = {
            'a1': PecaQuantica(['C', 'B']), # Cavalo ou Bispo
            'b1': PecaQuantica(['T', 'D']), # Torre ou Dama
            'c1': PecaQuantica(['P']),       # Peão clássico
            'a3': None, 'b3': None, 'c3': None
        }
        
    def obter_movimentos_possiveis(self):
        """Retorna movimentos hipotéticos considerando as superposições."""
        movimentos = []
        for casa, peca in self.tabuleiro.items():
            if peca:
                # A IA avalia movimentos baseados em TODAS as identidades possíveis
                for possivel_tipo in peca.possibilidades:
                    movimentos.append((casa, possivel_tipo))
        return movimentos

    def avaliar_estado(self):
        """Função de avaliação heurística para a IA."""
        valores = {'P': 10, 'C': 30, 'B': 30, 'T': 50, 'D': 90}
        score = 0
        for peca in self.tabuleiro.values():
            if peca:
                # Média ponderada do valor das identidades sob superposição
                score += sum(valores[p] for p in peca.possibilidades) / len(peca.possibilidades)
        return score


def minimax(tabuleiro, profundidade, maximizando):
    """Algoritmo de IA Minimax adaptado para incerteza."""
    if profundidade == 0:
        return tabuleiro.avaliar_estado(), None

    movimentos = tabuleiro.obter_movimentos_possiveis()
    if not movimentos:
        return tabuleiro.avaliar_estado(), None

    melhor_movimento = None
    if maximizando:
        max_eval = float('-inf')
        for mov in movimentos:
            # Simulação do movimento clonando o estado
            tabuleiro_copia = copy.deepcopy(tabuleiro)
            # A IA decide 'testar' um movimento assumindo um colapso teórico
            eval_atual, _ = minimax(tabuleiro_copia, profundidade - 1, False)
            if eval_atual > max_eval:
                max_eval = eval_atual
                melhor_movimento = mov
        return max_eval, melhor_movimento
    else:
        min_eval = float('inf')
        for mov in movimentos:
            tabuleiro_copia = copy.deepcopy(tabuleiro)
            eval_atual, _ = minimax(tabuleiro_copia, profundidade - 1, True)
            if eval_atual < min_eval:
                min_eval = eval_atual
                melhor_movimento = mov
        return min_eval, melhor_movimento

# --- Execução do Exemplo ---
if __name__ == "__main__":
    jogo = TabuleiroQuantico()
    print("🔮 Estado Inicial do Tabuleiro (Superposição):")
    for casa, peca in jogo.tabuleiro.items():
        if peca: print(f"Casa {casa}: {peca}")

    # IA calcula a melhor jogada baseada em probabilidades
    score, jogada = minimax(jogo, profundidade=2, maximizando=True)
    print(f"\n🤖 A IA calculou o melhor movimento teórico: Agir com a peça em '{jogada[0]}' assumindo comportamento de '{jogada[1]}'")

    print("\n🎲 O jogador decide mover a peça de 'a1' e forçar a observação:")
    identidade_real = jogo.tabuleiro['a1'].observar()
    print(f"O colapso da função de onda revelou que 'a1' é definitivamente um: {identidade_real}")
