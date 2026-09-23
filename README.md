# Chat Clone

Clone local da experiência de um chat moderno inspirado no ChatGPT.

## Regras deste projeto

- **Sem Lovable**
- **Sem API**
- **Sem backend**
- **Sem SDK externo**
- **Sem chave de API**
- Funciona no navegador com HTML, CSS e JavaScript puros

## Recursos

- Layout desktop e mobile
- Sidebar com histórico
- Histórico persistido em `localStorage`
- Novo chat, troca, busca e exclusão de conversas
- Tema claro/escuro
- Composer com auto-resize
- Enter envia; Shift+Enter quebra linha
- Botão de interromper a resposta
- Efeito de streaming local
- Edição e reenvio de mensagem
- Regeneração de resposta
- Markdown básico
- Blocos de código com botão de copiar
- Compartilhar/copiar conversa
- Seleção de arquivos local
- Dois modos demonstrativos: Local Smart e Local Fast

## Executar

Pode abrir `index.html` diretamente no navegador.

Ou:

```bash
python3 -m http.server 8080
```

Depois abra `http://localhost:8080`.

## Como o chat responde sem API?

Existe um pequeno motor de demonstração baseado em regras dentro de `app.js`. Ele serve para testar toda a experiência do produto sem enviar mensagens para nenhum serviço externo.

Não há um LLM real embutido no projeto.
