---
layout: post
title: Micronaut Data JDBC agora suporta coroutines
comments: true
categories: 
    - Micronaut
    - Micronaut Data
    - Kotlin Coroutine
    - Micronaut Data JDBC
description: Veja como é simples usar coroutines em repositórios com Micronaut Data JDBC.
image: /public/images/2021-11-07/piscina.jpg
---

## Introdução

O projeto Micronaut Data JDBC oferece uma fina camada de abstração que facilita a criação de repositórios para bancos de dados relacionais como Postgres, MySQL, Oracle, SQLServer, H2 ou MariaDB.

A implementação dos repositórios acontece em tempo de compilação, o que traz um ótimo ganho de performance em tempo de execução. Além disso, por ser uma camada fina com poucas abstrações, você tem uma performance tão boa ou próxima da escrita usando diretamente as bibliotecas de JDBC do Java.

Na versão 3.1 do Micronaut Data foi adicionado o suporte à criação de repositórios JDBC usando Kotlin Coroutines. Coroutine é uma funcionalidade da linguagem Kotlin que permite a escrita de código assíncrono de forma sequencial, facilitando a leitura e evitando o uso de callbacks.

O objetivo desse artigo é mostrar como implementar e usar um repositório JDBC usando coroutines.

## Como criar um repositório JDBC com Coroutines

O primeiro passo é adicionar as dependências das coroutines no seu arquivo de build (build.gradle ou build.gradle.kts):

```kotlin
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.1")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactive:1.5.1")
```

Para que seu repositório faça o uso de coroutines, é preciso que sua interface herde da interface `CoroutineCrudRepository`. Veja um exemplo abaixo:

```kotlin
@JdbcRepository(dialect = Dialect.H2)
interface UserRepository : CoroutineCrudRepository<User, Long> {
   suspend fun findByName(name: String): User?
}
```

Quando comparado a um repositório comum sem coroutines, a única diferença que notamos é a presença da palavra `suspend`.

Essa palavra reservada da linguagem Kotlin é usada para indicar que a função é uma coroutine. Caso seja necessário retornar uma lista, como no método findAll, não é preciso usar essa palavra reservada. Nesse caso a função do repositório irá retornar um `Flow<User>`, o `flow` é uma estrutura de dados das coroutines do Kotlin. Veja abaixo o uso de um repositório com Coroutines em um `Controller`:

```kotlin
@Controller
class UserController(
 private val userRepository: UserRepository
) {

 @Post("/v1/users")
 suspend fun add(user: User): User {
  return userRepository.save(user)
 }

 @Get("/v1/users/{name}")
 suspend fun findByName(name: String): User? {
  return userRepository.findByName(name)
 }

 @Get("/v1/users")
 fun listAll(): Flow<User> {
  return userRepository.findAll()
 }
}
```

## Conclusão

O Micronaut tem avançado rápido, e a integração com os recursos da linguagem Kotlin tem ficado cada vez melhores.

Com certeza essa é uma funcionalidade muito bem vinda e muito esperada pela comunidade, afinal coroutines é uma das melhores funcionalidades da linguagem Kotlin.

<!--
Photo by <a href="https://unsplash.com/@youbeyo?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Jubéo Hernandez</a> on <a href="https://unsplash.com/s/photos/pool?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  
-->
