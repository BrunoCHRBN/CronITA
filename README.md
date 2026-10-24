# CronITA

[Português](README.md) · [English](README.en.md)

Aplicativo web e desktop para cronometrização de sessões de estudo e acompanhamento da grade do vestibular do Instituto Tecnológico de Aeronáutica (ITA).

Desenvolvido com foco em contraste, ergonomia visual e baixa carga cognitiva. Não utiliza bibliotecas de componentes pré-moldadas, gradientes decorativos ou efeitos translúcidos que comprometam legibilidade e desempenho.

---

## Recursos

### 1. Cronômetro Duplo
- **Modo Livre**: Cronômetro progressivo simples para sessões contínuas.
- **Modo Pomodoro**: Ciclos configuráveis de foco, pausa curta e pausa longa (padrão: 50 min foco, 10 min pausa curta, 25 min pausa longa a cada 3 blocos). Trocas de ciclo com alertas em áudio sintético (Web Audio API) e notificações nativas.

### 2. Grade de Matérias do ITA
- Catálogo estruturado com as 6 disciplinas do exame: Matemática, Física, Química, Português, Inglês e Redação.
- 68 tópicos detalhados do edital com persistência local de tempo estudado e status de conclusão por item.
- Dropdowns customizados com pesquisa integrada para seleção rápida de tópicos em listas longas.

### 3. Distribuição de Carga Horária
- Barra proporcional segmentada na tela de matérias que exibe a porcentagem do tempo total investida em cada disciplina, auxiliando na manutenção do equilíbrio de preparação entre matérias eliminatórias.

### 4. Modo Foco Zen (<kbd>F</kbd>)
- Remove barra lateral, painéis secundários e resumos numéricos, mantendo em tela cheia apenas o disco de contagem e os controles essenciais.

### 5. Paleta de Comandos (<kbd>Ctrl+K</kbd> / <kbd>/</kbd>)
- Busca instantânea com navegação por teclado para transitar entre telas e matérias sem necessidade de cliques.

### 6. Proteção Ativa de Sessão
- **Screen Wake Lock**: Mantém o visor ativo durante o cronômetro em execução sem exigir interação manual.
- **Prevenção de Fechamento**: Intercepta o evento `beforeunload` para impedir o fechamento acidental da aba durante sessões ativas.
- **Notificações Nativas**: Disparo de notificações do sistema operacional ao término de blocos quando a janela estiver minimizada ou em segundo plano.

### 7. Armazenamento e Portabilidade
- Dados persistidos localmente via `localStorage` (chave `cronita:v1`).
- Exportação e importação de histórico completo em formato JSON para backup e sincronização entre máquinas.

---

## Tecnologias

- **Runtime & UI**: React 19, TypeScript
- **Bundler**: Vite
- **Ícones**: Lucide React
- **APIs Web Nativas**: Web Audio API, Notifications API, Screen Wake Lock API
- **Estilização**: CSS vanilla estruturado com design tokens (sem pré-processadores nem bibliotecas de utilitários de terceiros)

---

## Estrutura do Projeto

```text
CronITA/
├── public/
│   ├── icon.svg
│   └── manifest.webmanifest
├── src/
│   ├── components/
│   │   ├── AppShell.tsx        # Layout responsivo e barra de navegação
│   │   ├── CommandPalette.tsx  # Busca modal global (Ctrl+K)
│   │   ├── CustomSelect.tsx    # Seletor curvo com busca e auto-flip
│   │   ├── Dialog.tsx          # Wrapper acessível de diálogo HTML nativo
│   │   ├── SubjectsScreen.tsx  # Checklist de tópicos e distribuição
│   │   ├── TimerRing.tsx       # Mostrador vetorial SVG de 60 marcações
│   │   ├── TimerScreen.tsx     # Cartão do timer, controles e configurações
│   │   └── Toast.tsx           # Notificações contextuais na aplicação
│   ├── lib/
│   │   ├── hooks.ts            # Hooks utilitários de ciclo e rota
│   │   ├── sound.ts            # Síntese de áudio por Web Audio API
│   │   ├── stats.ts            # Agregações de tempo e cálculo da grade
│   │   ├── store.tsx           # Gerenciamento de estado com reducer e storage
│   │   ├── subjects.ts         # Base de matérias e tópicos do ITA
│   │   └── time.ts             # Formatadores de relógio e durações
│   ├── styles/
│   │   ├── app.css             # Componentes, layouts e animações funcionais
│   │   └── tokens.css          # Paleta, tipografia, raios e espaçamentos
│   ├── App.tsx                 # Ponto de composição e listeners de sessão
│   └── main.tsx                # Bootstrap da aplicação
├── index.html
├── package.json
└── vite.config.ts
```

---

## Instalação e Execução Local

### Pré-requisitos
- Node.js (versão 20 ou superior)
- Gerenciador de pacotes `pnpm` (ou `npm` / `yarn`)

### Comandos

```bash
# 1. Clonar o repositório
git clone https://github.com/BrunoCHRBN/CronITA.git
cd CronITA

# 2. Instalar dependências
pnpm install

# 3. Executar o ambiente de desenvolvimento
pnpm dev --port 5180

# 4. Gerar build de produção
pnpm build

# 5. Visualizar build localmente
pnpm preview --port 5180
```

---

## Tabela de Atalhos Globais

| Tecla | Contexto | Ação |
| :--- | :--- | :--- |
| <kbd>Espaço</kbd> | Cronômetro | Iniciar ou pausar a contagem |
| <kbd>Enter</kbd> | Cronômetro | Finalizar e salvar bloco de estudo |
| <kbd>F</kbd> | Qualquer tela | Alternar Modo Foco Zen |
| <kbd>P</kbd> | Cronômetro (ocioso) | Alternar entre Modo Livre e Pomodoro |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> ou <kbd>/</kbd> | Qualquer tela | Abrir paleta de comandos e busca |
| <kbd>Esc</kbd> | Modais / Zen / Menus | Fechar diálogo ativo ou retornar à visão normal |

---

## Formato de Backup (JSON)

Os dados exportados seguem o esquema de versão estável:

```json
{
  "version": 1,
  "sessions": [
    {
      "id": "s_1729800000000_abc",
      "subjectId": "matematica",
      "topicId": "matematica:conicas",
      "startedAt": 1729800000000,
      "endedAt": 1729803000000,
      "durationMs": 3000000,
      "mode": "pomodoro"
    }
  ],
  "completedTopicIds": [
    "matematica:conicas"
  ],
  "settings": {
    "focusMin": 50,
    "shortBreakMin": 10,
    "longBreakMin": 25,
    "longBreakEvery": 3,
    "dailyGoalHours": 6,
    "sound": true
  },
  "theme": "system"
}
```

---

## Integração de Desktop no Linux (Wayland / Hyprland)

Para executar o CronITA como janela de aplicativo dedicada sem elementos de navegador:

```bash
# Executável do lançador
~/.local/bin/cronita

# Entrada de menu desktop
~/.local/share/applications/cronita.desktop
```

No Hyprland, é possível incluir no `hyprland.conf`:
```ini
source = ~/.config/hypr/cronita.conf
```
Atalho padrão configurado: <kbd>Super</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd>.

---

## Licença

Distribuído sob licença MIT. Consulte o arquivo [LICENSE](LICENSE) para detalhes.
