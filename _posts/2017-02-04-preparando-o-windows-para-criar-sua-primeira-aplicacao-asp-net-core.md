---
layout: post
title: Preparando o Windows para criar sua primeira aplicação ASP.NET Core
comments: true
categories: 
    - .NET Core
    - Microsoft
description: O Yeoman é um utilitário de linha de comando que vamos usar para criar um novos projetos .NET Core. Ele é responsável por criar a estrutura básica de nossas aplicações, da mesma forma que é feita pelo Visual Studio. A principal diferença é que ele é muito mais legal, pois você faz tudo via linha de comando.
image: /public/images/2017-02-06/yo-ok.png
---

O [Yeoman](http://yeoman.io/) é um utilitário de linha de comando que vamos usar para criar um novos projetos .NET Core. Ele é responsável por criar a estrutura básica de nossas aplicações, da mesma forma que é feita pelo Visual Studio. A principal diferença é que ele é muito mais legal, pois você faz tudo via linha de comando.

O Yeoman depende do [Node.js](https://nodejs.org) e do [npm](https://www.npmjs.com/), faça a instalação acessando o site do Node.js caso não tenha. Ao instalar o Node.js, o npm já é instalado. 

![Instalação do Node.js com npm]({{site.baseurl}}/public/images/2017-02-06/nodejs.png)

Para saber se a instalação ocorreu com sucesso, digite o comando `npm --version` no prompt de comando do Windows. Se tudo deu certo o número da versão será exibida conforme na imagem abaixo.

![Exibindo a versão do npm instalado]({{site.baseurl}}/public/images/2017-02-06/npm-ok.png)

O próximo passo é instalar o Yeoman, ele é um pacote npm. Além desse pacote vamos aproveitar e instalar o bower, grunt e gulp. A explicação do que esses pacotes adicionais fazem está fora do escopo desse texto, por enquanto só deixe eles instalados aí. Então digite o comando `npm install -g yo bower grunt gulp` no prompt de comandos do Windows. A instalação pode levar alguns minutos, quando finalizar você deve ver algo parecido com a imagem abaixo.

![Instalação do Yeoman, Bower, Grunt e Gulp finalizada]({{site.baseurl}}/public/images/2017-02-06/yo-ok.png)

O próximo e último passo, antes de poder começar a trabalhar nossa aplicação ASP.NET Core, é instalar o gerador do Yeoman. Esse é o responsável por criar nossos projetos .NET Core. Para fazer a instalação digite o comando `npm install -g generator-aspnet`.

Agora nosso sistema operacional está pronto para criarmos nossa primeira aplicação ASP.NET Core. Veja em [Construindo uma aplicação web com ASP.NET Core no Visual Studio Code]({{site.baseurl}}/construindo-uma-aplicacao-web-com-asp-net-core-no-visual-studio-code).