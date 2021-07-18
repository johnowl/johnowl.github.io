---
layout: post
title: Consumindo APIs com Micronaut, Kotlin e Coroutines
comments: true
categories: 
    - GraalVM
    - Micronaut Framework
    - Java
    - Kotlin
    - Testes
    - HttpClient
description: Veja como consumir APIs com Micronaut e Kotlin Coroutines sem bloquear o event loop.
image: /public/images/2021-07-18/boy-eating-cookie.jpeg
---

## Introdução

Em nosso post anterior, nós criamos [testes com Micronaut, Kotlin, JUnit e Mockito]({{site.baseurl}}/testes-com-micronaut-kotlin-junit-e-mockito/). Para validar o controller fizemos o uso de um `HttpClient` mas não expliquei detalhes de como funciona. Nesse post vamos apresentar as opções disponíveis no Micronaut para consumir APIs.

## HttpClient declarativo

O jeito mais simples de criar um `HttpClient` é através da forma declarativa, basta criar uma interface com algumas anotações e pronto. No exemplo abaixo vamos criar um cliente HTTP para consultar CEP no site ViaCEP. O primeiro passo é criar uma `data class` para carregar as informações recebidas da API do ViaCEP:

```kotlin
@Introspected
data class ConsultaCepResponse(
    val cep: String,
    val logradouro: String,
    val complemento: String?,
    val bairro: String,
    val localidade: String,
    val uf: String
)
```

Depois disso, vamos criar nosso cliente HTTP que vai retornar a resposta da consulta de CEP usando nossa `data class`. Para que o código não bloqueie a thread principal, vamos usar as `suspend functions` do Kotlin. Adicione as dependências abaixo das Kotlin Coroutines no arquivo `build.gradle.kts`:

```kotlin
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactor")
```

Nosso cliente HTTP fica assim:

```kotlin
@Client("https://viacep.com.br/ws") // (1)
interface ViaCep {

    @Get("/{cep}/json") // (2)
    suspend fun consultarCep(cep: String): ConsultaCepResponse // (3)

}
```

Veja os detalhes:

1. Anote a classe com `@Client` e informe o host
2. Crie um método com a anotação `@Get` informando o path
3. O método vai receber o CEP e retornar um `ConsultaCepResponse`

Além de consultar informações com o método `GET` é possível usar os outros métodos HTTP como POST, PUT, PATCH e DELETE. Imagine que você precisa consumir uma API para criar usuários que é disponibilizada em `http://localhost:8081/users`:

```kotlin
@Client("http://localhost:8080")
interface UserApi {

    @Post("/users")
    suspend fun save(@Body user: User): User

}
```

As anotações usadas para consumir APIs com cliente HTTP são as mesmas que voê usa ao criar APIs em um `Controller`.

## HttpClient low level

O HttpClient low level permite que você interaja diretamente com a classe HttpClient. Veja os mesmos exemplos acima usando esta versão:

Consultar CEP:

```kotlin
@Singleton
class ViaCepLowLevel(
    @Client("https://viacep.com.br/ws") private val httpClient: HttpClient // (1)
) {

    suspend fun consultarCep(cep: String): ConsultaCepResponse {
        val result = httpClient.exchange(
            HttpRequest.GET<ConsultaCepResponse>("/$cep/json"), ConsultaCepResponse::class.java
        ).awaitFirst() // (2)

        return result.body() ?: throw Exception("CEP não encontrado.")
    }
}
```

Veja os detalhes:

1. Injetamos uma instância da classe httpClient apontando para o servidor do ViaCEP
2. usamos o `awaitFirst()` para esperar a execução do request sem bloquear a thread

Cadastrar usuário:

```kotlin
@Singleton
class UserApiLowLevel(
    @Client("/") private val httpClient: HttpClient
) {

    suspend fun save(user: User): User {

        val result = httpClient.exchange(
            HttpRequest.POST("/users", user), User::class.java
        ).awaitFirst()

        return result.body() ?: throw Exception("User not found")
    }
}
```
