# Cronômetro ITA

Aplicativo minimalista, curvo e de alta performance voltado para a cronometrização e planejamento de sessões de estudo para o vestibular do **Instituto Tecnológico de Aeronáutica (ITA)**.

Construído sem bibliotecas de templates genéricas, sem gradientes chamativos e sem elementos de "AI slop", priorizando contraste, foco sustentado e ergonomia cognitiva.

---

## Recursos Principais

- **Cronômetro Duplo**: Modo Livre (contagem progressiva) e Pomodoro configurável com blocos de foco, pausas curtas e pausas longas automáticas.
- **Grade Oficial do ITA**: 6 matérias (Matemática, Física, Química, Português, Inglês e Redação) e 68 tópicos detalhados do edital com persistência de conclusão e tempo estudado.
- **Equilíbrio Estratégico (Distribuição de Horas)**: Barra visual segmentada que evidencia a porcentagem real dedicada a cada disciplina, auxiliando a evitar notas de corte em matérias negligenciadas.
- **Modo Foco Zen (<kbd>F</kbd>)**: Oculta colunas, gráficos e navegação, centralizando unicamente o relógio e os controles essenciais.
- **Paleta de Comandos (<kbd>Ctrl+K</kbd> ou <kbd>/</kbd>)**: Pesquisa instantânea em todos os 68 tópicos e matérias para troca de contexto ágil.
- **Proteção Ativa de Sessão**:
  - **Screen Wake Lock**: Mantém a tela acesa durante o estudo sem suspender o monitor/celular.
  - **Aviso de Fechamento**: Previne fechar a aba por engano durante uma sessão em andamento.
  - **Notificações no Sistema**: Avisos visuais e sonoros no término de blocos mesmo com a aba em segundo plano.
- **PWA Instalável**: Funciona offline e pode ser instalado como app desktop ou mobile sem barra de navegação do browser.
- **Backup Seguro (JSON)**: Exportação e importação completa de dados locais a qualquer momento.

---

## Como Executar Localmente

### Pré-requisitos
- Node.js (versão 20 ou superior)
- pnpm instalado (`npm install -g pnpm`)

### Iniciar Aplicação
```bash
# Instalar dependências (caso não tenha instalado)
pnpm install

# Iniciar servidor local
./iniciar.sh
# ou
pnpm dev --port 5180
```
O aplicativo abrirá automaticamente em `http://localhost:5180`.

### Atalhos de Teclado
- <kbd>Espaço</kbd>: Inicia ou pausa a sessão atual.
- <kbd>Enter</kbd>: Finaliza e salva o tempo de estudo.
- <kbd>F</kbd>: Alterna o Modo Foco Zen (tela cheia/minimalista).
- <kbd>P</kbd>: Alterna entre Cronômetro Livre e Pomodoro (quando ocioso).
- <kbd>Ctrl+K</kbd> ou <kbd>/</kbd>: Abre a busca rápida de tópicos.
- <kbd>Esc</kbd>: Fecha modais, paleta de comandos ou sai do modo Zen.
