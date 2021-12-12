---
layout: post
title: Como gerar tokens JWT com Micronaut Security e Kotlin
comments: true
categories: 
    - Security
    - Micronaut
    - JWT
    - RSA
    - Criptografia simétrica
    - Criptografia assimétrica
    - Kotlin
description: Aprenda como gerar tokens JWT usando chaves simétricas e assimétricas com Micronaut Security e Kotlin.
image: /public/images/2021-12-12/lock-small.jpg
---

## Introdução

Esse artigo mostra como usar o Micronaut para gerar tokens JWT assinados usando chaves simétricas e assimétricas. Além disso, ele também mostra como validar uma credencial antes de gerar o token.

Para saber o que é um token JWT, você pode ler o artigo [Validando tokens JWT com JWKS, Micronaut e Kotlin](https://blog.johnowl.com/validando-tokens-jwt-com-jkws-micronaut-e-kotlin/), de forma resumida um token JWT é uma maneira segura de encapsular informações e transmiti-las por um canal inseguro. Tokens, em geral, são usados para acessar áreas protegidas de um sistema.

## Chave simétrica e chave assimétrica

Usamos criptografia para assinar um token JWT. Essa assinatura pode ser feita usando uma chave simétrica ou assimétrica.

Um chave simétrica é um segredo que é usado tanto para assinar quanto para validar uma assinatura. Caso exista um sistema que gere os tokens e outro sistema que faça a validação da assinatura, é preciso compartilhar um mesmo segredo entre ambos os sitemas. Exemplo: HMAC + SHA256.

Um chave assimétrica é composta de duas partes, uma chave pública e uma privada. A chave privada é usada para assinar o token JWT e a chave pública é usada para validar a assinatura. No exemplo mostrado acima, onde um sistema emite o token e outro faz a validação, o sistema que gera os tokens só precisa conhecer a chave privada e o sistema que faz a validação só precisa da chave pública. Exemplos de criptografia assimétrica: RSA, ECDSA.

## Crie uma nova aplicação Micronaut com Kotlin

Antes de iniciar precisamos criar uma nova aplicação Micronaut. Para fazer isso siga esses passos:

1. Acesse <https://micronaut.io/launch/>
2. Selecione a linguagem Kotlin
3. Selecione Gradle Kotlin como ferramenta de build
4. Clique em "Features"
5. Digite security-jwt no campo de busca
6. Selecione a opção security-jwt que apareceu na lista de features
7. Clique em "Done"
8. Clique em "Generate Project"
9. Clique em "Download zip" e abra o projeto na sua IDE, aqui eu uso IntelliJ

## Como validar as credenciais para gerar o token JWT

O primeiro passo é implementar a interface `AuthenticationProvider`, ela será responsável por validar as credenciais recebidas pelo Micronaut.

Em nosso exemplo, para facilitar a explicação, vamos deixar os valores fixos na classe. Na vida real provavelmente você vai injetar uma classe que sabe fazer a validação das credenciais. Lembre-se de fazer de uma forma que não bloqueie a thread principal, dessa forma você evita problemas de performance na sua aplicação.

```kotlin
@Singleton
class UserAuthenticationProvider : AuthenticationProvider {
 override fun authenticate(
  httpRequest: HttpRequest<*>,
  authenticationRequest: AuthenticationRequest<*, *>
 ): Publisher<AuthenticationResponse> {
  return if (authenticationRequest.identity == "user" && authenticationRequest.secret == "123abc") {
   Publishers.just(AuthenticationResponse.success("user", arrayListOf("ADMIN")))
  } else {
   Publishers.just(AuthenticationException(AuthenticationFailed()))
  }
 }
}
```

O código acima valida se o usuário é igual a "user" e senha é igual a "123abc", caso positivo retornamos sucesso informando o identificador do usuário e quais roles eles tem acesso. Em caso de erro retornamos uma mensagem de erro.

Execute sua aplicação, por padrão ela irá iniciar na porta 8080. Em seguida faça uma chamada HTTP conforme abaixo:

```curl
curl --location --request POST 'http://localhost:8080/login' \
--header 'Content-Type: application/json' \
--data-raw '{
    "username": "user",
    "password": "123abc"
}'
```

Você deve ter recebido uma resposta parecida com a que segue:

```json
{
    "username": "user",
    "roles": [
        "ADMIN"
    ],
    "access_token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyIiwibmJmIjoxNjM5MzQ4NjczLCJyb2xlcyI6WyJBRE1JTiJdLCJpc3MiOiJzYW1wbGUiLCJleHAiOjE2MzkzNTIyNzMsImlhdCI6MTYzOTM0ODY3M30.psLCFzekTk-rNeaW_EgHRF_R7sEkyTWFkNVPRXC3pC0",
    "token_type": "Bearer",
    "expires_in": 3600
}
```

## Onde fica armazenada a chave usada pelo Micronaut?

Acesse o arquivo `src/resources/application.yml` e veja que o Micronaut Launcher já adicionou algumas configurações para o token JWT.

```yaml
micronaut:
  application:
    name: sample
  security:
    authentication: bearer
    token:
      jwt:
        signatures:
          secret:
            generator:
              secret: '"${JWT_GENERATOR_SIGNATURE_SECRET:pleaseChangeThisSecretForANewOne}"'
```

Na última linha o Micronaut procura pelo valor armazenado na variável de ambiente `JWT_GENERATOR_SIGNATURE_SECRET`, se não encontrar nada ele irá usar a chave `pleaseChangeThisSecretForANewOne`. Vamos deixar dessa forma para nossos testes, em produção você precisa usar uma chave forte.

## De onde surgiu o path `/login`?

O Micronaut Framework já possui a implementação da url de login, que por padrão fica em `/login`. É possível alterá-la, basta alterar o valor da configuração `micronaut.security.endpoints.login.path`.

## Analisando o token JWT gerado pelo Micronaut

Se você copiar o valor do campo `access_token` e colar no site <https://jwt.io> você consegue inspecionar as informações existentes dentro do token JWT conforme imagem abaixo:

![Imagem mostrando a decodificação de um token JWT no site jwt.io]({{site.baseurl}}/public/images/2021-12-12/jwt-hs256.png)

O identificador do usuário foi gravado na claim `sub` e a role `ADMIN` ficou na claim `roles`. Além disso o token possui as claims `nbf` que indica a partir de que momento o token é válido, a data de expiração na claim `exp`, a data de emissão na claim `iat` e o nome do microsserviço que emitiu o token na claim `iss`.

No cabeçalho do token JWTK podemos identificar que o algoritmo `HS256` foi usado pelo Micronaut para assinar o token, HS256 significa HMCA + SHA256.

Por padrão o Micronaut usa uma chave simétrica para assinar e validar os tokens, a chave usada fica armazenada no arquivo de configuração da aplicação, para nosso exemplo é "pleaseChangeThisSecretForANewOne".

## Como gerar tokens JWT no Micronaut usando chave assimétrica?

Em nosso exemplos vamos usar um par de chaves RSA com tamanho de 2048 bits. O primeiro passo é implementar a interface `RSASignatureGeneratorConfiguration` conforme exemplo abaixo:

```kotlin
@Singleton
@Named("generator")
class RsaKeysJwkProvider : RSASignatureGeneratorConfiguration {

 private val privateKey: RSAPrivateKey
 private val publicKey: RSAPublicKey
 private val keyId: String

 init {
  val keyGen = KeyPairGenerator.getInstance("RSA")
  keyGen.initialize(2048)
  val keyPair = keyGen.genKeyPair()

  this.keyId = UUID.randomUUID().toString()
  this.privateKey = keyPair.private as RSAPrivateKey
  this.publicKey = keyPair.public as RSAPublicKey
 }

 override fun getPublicKey(): RSAPublicKey {
  return this.publicKey
 }

 override fun getPrivateKey(): RSAPrivateKey {
  return this.privateKey
 }

 override fun getJwsAlgorithm(): JWSAlgorithm {
  return JWSAlgorithm.RS256
 }
}
```

Para facilitar nosso exemplo vamos gerar as chaves quando nossa classe for instanciada, na vida real você deve usar algum tipo de banco de dados ou cofre para persistir as chaves. Não se esqueça da anotação `@Named("generator")` para que tudo funcione corretamente. Além disso, é preciso remover a chave do arquivo de configuração `application.yml`. Seu arquivo deve ficar parecido com o exemplo abaixo:

```yaml
micronaut:
  application:
    name: sample
  security:
    authentication: bearer
```

Faça uma nova chamada para a API de login e analise o token novamente, perceba que o algoritmo usado agora é RS256. Isso indica que você está usando chave assimétrica para assinar o token, para ser mais específico, o Micronaut está usando RSA + SHA256.

## Conclusão

A geração de tokens JWT usando Micronaut e Kotlin é bastante simples de ser implementada. Para usar chave simétrica basta implementar a interface `AuthenticationProvider` e para usar criptografia assimétrica além disso é preciso implementar a interface `RSASignatureGeneratorConfiguration`.

Lembre-se que os códigos mostrados aqui são apenas exemplos, eles foram criados para serem didáticos e não para serem usados em ambientes produtivos.
