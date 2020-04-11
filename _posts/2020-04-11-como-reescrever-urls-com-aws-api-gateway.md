---
layout: post
title: Como reescrever urls com AWS API Gateway
comments: true
categories: 
    - AWS
    - API Gateway
    - Lambda
description: Aprenda 3 formas de reescrever URLs no AWS API Gateway.
image: /public/images/2020-04-11/aws-api-gateway.png
---

Quando falamos de API Gateway, um de seus usos pode ser para expor APIs de sistemas legados. Nesse caso pode surgir um problema de falta de padronização de URL, é aí que a reescrita de URL surge como uma opção para expor algo padronizado para o mundo externo.

## Reescrita simples

Imagine o seguinte cenário, tenho a url `https://internal.site.com/api/system-x/users?userId=123` e gostaria de expor essa URL através do AWS API Gateway como `https://www.site.com/v1/users/123`

Para este cenário simples, basta criar a estrutura de resources, um método GET com integração do tipo HTTP e no campo "Endpoint Url" usar o valor `https://internal.site.com/api/system-x/users?userId={userId}`.

## Mapeando valores do header para query string

Agora imagine que a URL do sistema legado também precisa saber qual aplicação está chamando essa url e o identificador da aplicação é enviado em um header chamado `x-application-id`. Ou seja, agora a url do sistema legado é algo como `https://internal.site.com/api/system-x/users?userId={userId}&app={appId}`. Veja como fazer no passo-a-passo abaixo:

1. em "Method Request", adicione o header `x-application-id` 
2. vá para "Integration request" e deixe a url da forma que está: `https://internal.site.com/api/system-x/users?userId={userId}`
3. ainda em "Integration Request", abra a opção "URL Query String Parameters" e clique em "Add query string"
4. preencha o campo "name" com `appId` e o campo "Mapped from" com `method.request.header.x-application-id` (isso só funciona pois já declaramos esse header no "Method request")
6. abra a opção HTTP Headers e exclua o header `x-application-id`
5. pronto! Agora é só testar para ver o novo parâmetro sendo enviado via `query string` para o sistema legado.

Além do header, também é possível mapear valores de query strings e path.

## Mapeando valores devolvidos por uma Lambda Authorizer

Ainda imaginando o cenário de expor serviços legados, imagine que uma API trabalhe com um identificador de usuário que só faz sentido internamento na aplicação, no entanto eu gostaria de expor para o mundo externo um identificador diferente.

API interna: `https://internal.site.com.br/system-x/users/abc`
API externa: `https://www.site.com.br/v1/users/123`

Para que as informações sejam protegidas, estamos usando uma Lambda Authorizer que recebe o identificador externo 123 e consegue retornar o identificador interno abc.

Uma Lambda Authorizer devolve três informações:

1. Policy
2. Principal Id
3. Context

O context é um objeto chave e valor, onde é possível devolver informações que podem ser usadas para alterar nossas requisições para um backend. Então o identificador interno será devolvido no `Context`.

As informações do contexto da Lambda Authorizer estão disponíveis em  `context.authorizer.key_name`, para nosso exemplo a informação estará disponível em `$context.authorizer.internalUserId`. Sabendo disso, precisamos configurar nosso "Integration request".

Expanda o campo "Url Path Parameters", adicione uma variável chamada `internalUserId` com o valor `context.authorizer.internalUserId`. Certifique que o campo "Endpoint URL" está com o valor https://internal.site.com.br/system-x/users/{internalUserId}. Não se preocupe com o aviso que irá aparecer: "The endpoint you have entered contains parameters that are not defined in the resource path. Parameters are case sensitive."

Pronto, é só testar e ver que tudo funciona!