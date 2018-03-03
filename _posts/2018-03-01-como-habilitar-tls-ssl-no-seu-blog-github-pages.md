---
layout: post
title: Como habilitar HTTPS no seu blog GitHub Pages
comments: true
categories: 
    - GitHub Pages
    - Segurança
description: Aprenda como habilitar o SSL no seu blog GitHub Pages e deixe a navegação dos seus leitores mais segura.
image: /public/images/2018-03-01/cloudflare.png
---

# Como habilitar HTTPS no seu blog GitHub Pages

Esse procedimento serve para habilitar o  TLS/SSL no seu blog, isso fará com que seu blog fique com aquele cadeado de segurança na barra de endereço dos navegadores. Por que isso é importante? A navegação entre o usuário e seu blog deve ser algo privado, e o protocolo de segurança serve para evitar ataques [man-in-the-middle](https://pt.wikipedia.org/wiki/Ataque_man-in-the-middle)
 e [eavesdropping](https://pt.wikipedia.org/wiki/Eavesdropping). Além disso, o Google prioriza a indexação de sites servidos via HTTPS, e aparecer nos buscadores é muito importante para criadores de conteúdo.

Existem dois cenários possíveis: 
- usando a extensão `.github.io`
- usando um **domínio personalizado**

Se você usa a extensão `.github.io`:
1. Faça login no GitHub e acesse o projeto do seu blog.
2. Clique na aba de configurações (Settings).
3. Selecione a opção **Enforce HTTPS**. 

Se você usa um domínio personalizado, como por exemplo `blog.johnowl.com`, existe uma opção gratuita que é usando o **CloudFlare**. 

Crie sua conta gratuita no site https://www.cloudflare.com e siga as instruções de configuração. Você precisará trocar os servidores DNS configurados na empresa que você comprou seu domínio e aguardar até 72 horas para a **propagação do DNS**. Na rede wifi de casa ainda não está funcionando, mas no 4G eu já consigo acessar com *HTTPS*.

Assim que seu site for ativado no CloudFlare ele já pode ser acessado com **segurança**. Para forçar todas as requisções a usarem HTTPS, no site do CloudFlare, clique na opção "Crypto" e ligue a opção "Always use HTTPS".