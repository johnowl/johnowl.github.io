---
layout: post
title: Construindo uma aplicação web com ASP.NET Core no Visual Studio Code
comments: true
categories: 
    - .NET Core
    - ASP.NET Core
    - Visual Studio Code
    - Microsoft
description: Vamos construir nossa primeira aplicação ASP.NET Core usando Visual Studio Code no Windows.
image: /public/images/2017-02-06/yo-aspnet.png
---

Vamos construir nossa primeira aplicação ASP.NET Core usando Visual Studio Code no Windows.

Antes de começar, certifique-se que você tem o [.NET Core 1.1 SDK](https://www.microsoft.com/net/download/core#/current) instalado em seu computador, o [Yeoman instalado e configurado]({{site.baseurl}}/preparando-o-windows-para-criar-sua-primeira-aplicacao-asp-net-core) e veja o artigo sobre as [extensões úteis que você deve ter no Visual Studio Code]({{site.baseurl}}/preparando-o-visual-studio-code-para-trabalhar-com-dotnetcore/).

Com todos os pré-requisitos instalados e configurados, vamos criar nosso projeto usando o Yeoman. Digite o comando abaixo:

```
yo aspnet
```

Será exibida a imagem abaixo pedindo que você selecione o tipo de projeto desejado. Usando as setas do seu teclado, selecione a opção "Empty Web Application" e pressione ENTER.

![Seleção do tipo de projeto no Yeoman]({{site.baseurl}}/public/images/2017-02-06/yo-aspnet.png)

O Yeoman irá perguntar o nome de sua aplicação, digite HelloWorld e pressione ENTER.

![Nome do novo projeto no Yeoman]({{site.baseurl}}/public/images/2017-02-06/yo-aspnet-2.png)

Veja que o Yeoman já sugere quais são os próximos passos:

* acessar o diretório da aplicação,
* restaurar os pacotes,
* compilar,
* e executar sua aplicação.

Note que o comando `dotnet build` é opcional, pois ao usar `dotnet run` a compilação é feita automaticamente. Execute os comandos sugeridos e veja que o prompt de comando exibe uma mensagem dizendo que sua aplicação está rodando.

![Nome do novo projeto no Yeoman]({{site.baseurl}}/public/images/2017-02-06/dotnet-run.png)

Acesse o endereço e, se tudo tiver dado certo, você verá a mensagem "Hello world".