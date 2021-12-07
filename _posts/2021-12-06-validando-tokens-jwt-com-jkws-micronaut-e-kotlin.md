---
layout: post
title: Validando tokens JWT com JWKS, Micronaut e Kotlin
comments: true
categories: 
    - Security
    - Micronaut
    - JWT
    - JWKS
    - Kotlin
description: Veja como é simples validar um token JWT com Micronaut e Kotlin usando a url de uma JWKS (json web key set).
image: /public/images/2021-12-06/guards-small.jpg
---

## Introdução

Uma necessidade que aparece com frequência na construção de sistemas é garantir que o acesso de algumas informações só podem ser feitas após um usuário se identificar, geralmente ele faz isso usando um nome de usuário e senha. Após a validação das credenciais o sistema emite um identificador único para a sessão que foi criada. Usando esse identificador único, que é mais conhecido por token, é possível consultar informações que estão associadas ao usuário que iniciou aquela sessão.

Um token pode ser opaco como uma string aleatória, ou seja, não é possível identificar nenhuma informação útil a partir do token. Ou ele pode ser um token rico, como é o JWT, onde é possível ler informações de dentro do token.

## O que é um token JWT?

JWT é um padrão que define uma maneira segura de encapsular informações e transmiti-las por um canal inseguro. Um token JWT é composto por 3 partes: cabeçalho, claims e assinatura. Veja um exemplo, cada parte do token é separada por um ponto:

```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

Esse token pode ser visualizado em um site como o <https://jwt.io> conforme imagem abaixo:

![Imagem mostrando a decodificação de um token JWT no site jwt.io]({{site.baseurl}}/public/images/2021-12-06/jwt_io.png)

No exemplo acima, o cabeçalho do token contém o algoritmo usado para assinar o token e o tipo do token, ele também pode conter um campo chamado `kid`, que é o identificador da chave usada para assinar o token, caso esteja sendo usada criptografia assimétrica.

O corpo do token é formado por claims, que são chaves e valores com informações úteis, uma delas é a claim `sub` que identifica o usuário e outra é a claim `exp` que indica a data de expiração de um token.

A assinatura pode ser feita usando um segredo que só o servidor conhece (criptografia simétrica) ou pode ser feita usando um par de chaves (criptografia assimétrica). Ao usar um par de chaves, somente o servidor terá acesso à chave privada e as chaves públicas podem ser compartilhadas para que aplicações cliente possam validar se aquele token foi emitido pelo servidor.

## O que é JWKS?

Um JWKS (Json Web Key Set) é um conjunto de chaves públicas que podem ser usadas para validar tokens JWT. Geralmente um JWKS fica exposto em um endereço público como `https://www.servidor.com.br/.well-known/jwks`, e esse endereço retorna um array contendo todas as chaves públicas disponíveis. Veja um exemplo:

```json
{
    "keys": [
        {
            "kty": "RSA",
            "e": "AQAB",
            "use": "sig",
            "kid": "ca761cd3-8092-46be-926b-ef28465ff942",
            "n": "oXAP360uf_9_KXTCk6BiQOgwQJlqoycCbsukFtoUCmn57jM-9n2uqBBPT_8VnTIaYr4h8zxMy8HRkdX35HRmZANoqekhH03hhMc69mK4yEYZwBNyV9SteXrF5hfj4SWsK0t3CZ_G_U303XLj7ak5m-4w1UXCmvBERR_SwXjLOKwAAFlOQS_0sAB9yzvJkvsuvqd4lA3-vFFF_ZVbTHuJAznqB_avwCbCHJWfiWln2PN7LsieX08tE13bPP1TVEFid9mcUz5dwz0J9QKTYCd90fkyzqanzG638SFoyL84ddmD_9pef5x03oMWEU9-dxEI6PFfWEQmXN1eg7GfJI6bxQ"
        }
    ]
}
```

Cada chave nessa lista possui um identificador único que é o mesmo `kid` usado no cabeçalho do token JWT, esse `kid` representa o identificador da chave pública que faz par com a chave privada que foi usada para assinar o token. Dessa forma é possível, a partir de um token JWT, encontrar a chave pública para validar a assinatura.

## Validando tokens JWT com Micronaut

Imagine que você tem um microsserviço que expõe em `http://localhost:8081/keys` a lista de chaves públicas que podem ser usadas para validar a assinatura de tokens JWT. Você tem uma API protegida que um usuário só pode ter acesso com um token JWT válido.

O primeiro passo é criar um projeto Micronaut adicionando a dependência `security-jwt`. Acesse <https://micronaut.io/launch/> e crie um novo projeto com a linguagem Kotlin e adicionando a feature `security-jwt`.

Crie o `Controller` abaixo no seu projeto:

```kotlin
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.security.annotation.Secured
import io.micronaut.security.rules.SecurityRule.IS_AUTHENTICATED

@Controller
class HelloController {
 @Get("/hello")
 @Secured(IS_AUTHENTICATED) // 1
 fun hello() = "Hello World"
}
```

Trata-se de um controller muito simples, ele vai retornar a mensagem `Hello World` caso o usuário esteja autenticado, ou seja, tenha um token válido. Fazemos isso com a anotacão `@Secured(IS_AUTHENTICATED)`. O próximo passo é informar ao Micronaut onde ele deve buscar a lista de chaves públicas. Para isso abra o arquivo `application.yaml` e adicione as configurações abaixo:

```yaml
micronaut:
  application:
    name: demo
  security:
    authentication: bearer
    token:
      jwt:
        signatures:
          jwks:
            custom:
              url: 'http://localhost:8081/keys'
```

Pronto! Agora basta subir sua aplicação e testar usando uma chamada parecida com o exemplo abaixo:

```text
curl --location --request GET 'http://localhost:8080/hello' \
--header 'Authorization: Bearer eyJraWQiOiJkNThmMjM5Yy03YjcwLTRmMTktYjExNC0xZmZmYzhkNTgyYWYiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJ1c2VyIiwibmJmIjoxNjM4ODM3Mjc4LCJyb2xlcyI6WyJBRE1JTiJdLCJpc3MiOiJtaWNyb25hdXQtc2VjdXJpdHktand0LXNhbXBsZSIsImV4cCI6MTYzODg0MDg3OCwiaWF0IjoxNjM4ODM3Mjc4fQ.O-uTW_HkDegCoFClUfv2zpQsPDM4FEpBoyTw9y2pLjibnYLnr8BtxYhXZ8y6Rzx0fyTxwY3nJe3PSMwv71tEHbW8qRGCSt8J_lsWkohVrxHBM5HguECTeiMOnL6applQxtn8mCuN2Y3bsVGXpYtoTiUytTDb3zo0KiSWYEsendnwXo6hIvVQV5-HBbgXm6F26SZjrKgVr4Y1X_rQL-NcBsSMDzoiaZaLytnizfDjrcyzXDzCIc0JNEFS7HlBBZKT1R2cUqpcdj516idFv3nDxD6TPlNJgrXmUlgOfOg1id5FL_2pqa21HQioj4bdk0kQQuj2mxMIw4ZCALCYyD5Tfg'
```

## Conclusão

Micronaut Security oferece uma maneira simples de validar tokens JWT em seus microsserviços. Basta indicar a url onde ficam as chaves públicas que ele se encarrega de fazer a validação.
