---
layout: post
title: Como usar Redis com Micronaut, Kotlin e coroutines
comments: true
categories: 
    - Micronaut
    - Kotlin
    - Micronaut Redis
    - Redis
    - Database
description: Como gravar e consultar dados simples e complexos no Redis usando Micronaut, Kotlin e coroutines. Tudo isso sem bloquear o event loop.
image: /public/images/2021-10-10/unsplash.jpg
---

## Introdução

O [Redis](https://redis.io/) é um banco de dados em memória que armazena dados no formato chave e valor. Ele geralmente é usado para fazer cache de informações para melhorar a performance de aplicações e também para armazenar informações de sessões de usuários. Seu nome é um acrônimo para Remote Dictionary Server.

Além de ser um banco de dados, ele oferece a funcionalidade de mensageria do tipo publish/subscribe. Isso está fora do escopo deste artigo, vamos falar somente sobre armazenamento e consulta de informações no Redis.

Para interagir com o Redis vamos usar um cliente chamado [Lettuce](https://lettuce.io/), ele pode ser usado em aplicações que rodam na JVM. O Lettuce Redis Client é baseado no [Netty](https://netty.io/) e no [projeto Reactor](https://projectreactor.io/). Ele oferece APIs assíncronas, síncronas e reativas para que seja possível interagir com o Redis. Além disso, a versão atual tem suporte para coroutines do Kotlin!

## Pré requisitos

* Docker
* IntelliJ
* Java JDK

## Iniciando uma instância do Redis usando Docker

Para iniciar uma instância do Redis no Docker execute o comando abaixo:

```bash
docker run --name redis -p 6379:6379 -d redis
```

## Criando o projeto

Acesse [https://micronaut.io/launch/](https://micronaut.io/launch/) e crie um projeto com a linguagem Kotlin, Gradle Kotlin como ferramenta de build, adicione a feature `redis-lettuce`, faça o download do projeto, descompacte-o e depois abra-o no IntelliJ.

Abra o arquivo `build.gradle.kts` e adicione as dependências abaixo para ter suporte às coroutines do Kotlin.

```kotlin
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.2")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactive:1.5.2")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.5.2")
```

A string de conexão está configurada no arquivo `application.yml` do projeto que foi gerado no Micronaut Launch:

```yaml
redis:
  uri: redis://localhost
```

## Injetando uma instância de `StatefulRedisConnection<String, String>`

Ao adicionar a feature `redis-lettuce` em seu projeto, o Micronaut irá configurar algumas coisas como o `health check` do Redis e irá disponibilizar alguns beans para serem utilizados, o que vamos usar em nosso exemplo é o bean `StatefulRedisConnection<String, String>`.

Crie um controller que recebe esse bean no construtor, com ele é possível gravar e consultar estruturas de dados cuja chave é uma `String` e o conteúdo também é uma `String`.

```kotlin
@Controller
class UserController(
  private val connection: StatefulRedisConnection<String, String>
) {

}
```

## Como gravar uma string no Redis

O próximo passo é criar uma função que irá gravar uma informação no Redis, vamos associar essa função com a rota `/save/{key}/{value}` conforme o código que segue:

```kotlin
@Controller
@OptIn(ExperimentalLettuceCoroutinesApi::class) // (1)
class UserController(
  private val connection: StatefulRedisConnection<String, String>
) {
   @Post("/save/{key}/{value}")
   suspend fun save(key: String, value: String) { // (2)
      val commands = redisConnection.coroutines() // (3)
      commands.set(key, value) // (4)
   }
}
```

1. Precisamos adicionar essa anotação pois as coroutines estão em fase experimental no Lettuce Client, sem ela será exibida na linha marcada como `// (2)` a seguinte mensagem: `This declaration is experimental and its usage should be marked with '@io.lettuce.core.ExperimentalLettuceCoroutinesApi' or '@OptIn(io.lettuce.core.ExperimentalLettuceCoroutinesApi::class)'`.
2. Declaramos nossa função como suspend para poder usar coroutines dentro dela.
3. Antes de gravar uma chave e um valor precisamos criar uma instância de `RedisCoroutinesCommands` para ter acesso aos comandos de gravação.
4. Aqui usamos o método `set` para gravar a chave `key` com o valor `value`, ambos recebidos na chamada da nossa API.

## Como ler strings no Redis

Para ler informações, usamos o método `get(key)`, veja um exemplo:

```kotlin
@Get("/get/{key}")
suspend fun getByKey(key: String): String? {
   val commands = redisConnection.coroutines()
   return commands.get(key)
}
```

Caso a chave não seja encontrada, é retornado o valor `null`.

## Como gravar múltiplas informações no Redis

É possível usar transações no Redis, gravando diversas informações conforme mostrado abaixo:

```kotlin
@Post("/multi")
suspend fun multi() {
   redisConnection.async().multi { // (1)
      set("k1", "lorem1") // (2)
      set("k2", "ipsum2")
      set("k3", "dolor3")
      set("k4", "sit4")
      set("k5", "amet5")
   }
}
```

1. O método `multi` é acessado usando `async()` ao invés de `coroutines()` como nos exemplos anteriores, mas ele também é uma coroutine. Esse método é uma `extension function`.
2. Chamamos vários comandos `set` com chaves e valores diferentes

Internamente a `extension function` faz o seguinte:

```kotlin
multi().await()
action.invoke(this)
exec().await()
```

Caso aconteça o erro `java.lang.NoClassDefFoundError: kotlinx/coroutines/future/FutureKt`, verifique se a dependência abaixo existe em seu projeto:

```kotlin
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-jdk8:1.5.2")
```

## Como gravar e ler dados complexos no Redis

Muitas vezes temos cenários em que precisamos guardar um objeto inteiro no Redis, ao invés de uma simples `String`. Imagine que precisamos gravar o objeto abaixo:

```kotlin
@Introspected
data class User(
   val id: String,
   val name: String,
   val createdAt: LocalDateTime
)
```

O primeiro passo é criar um codec genérico onde a chave é do tipo `String` e o valor pode ser qualquer objeto. Dessa forma o cliente Lettuce saberá como ler e escrever nosso objeto no Redis. Vamos usar o Jackson para serializar e desserializar nosso objeto para json. Veja como ficou nosso codec:

```kotlin
@Singleton
class GenericJsonRedisCodec<T : Any>(
   private val objectMapper: ObjectMapper,
   private val charset: Charset = Charset.forName("UTF-8")
) : RedisCodec<String, T> {

   override fun decodeKey(bytes: ByteBuffer): String {
      return charset.decode(bytes).toString()
   }

   @Suppress("UNCHECKED_CAST")
   override fun decodeValue(bytes: ByteBuffer): T? {
      return try {
         objectMapper.readValue(charset.decode(bytes).toString(), Any::class.java) as T?
      } catch (ex: JacksonException) {
         null
      }
   }

   override fun encodeKey(key: String): ByteBuffer {
      return charset.encode(key)
   }

   override fun encodeValue(value: T): ByteBuffer? {
      return try {
         val user = objectMapper.writeValueAsString(value)
         charset.encode(user)
      } catch (ex: JacksonException) {
         null
      }
   }
}
```

O próximo passo é deixar um bean do tipo `StatefulRedisConnection<String, User>` disponível para ser utilizado, fazemos isso usando uma factory:

```kotlin
@Factory
class LettuceCodecs(
   private val redisClient: RedisClient // (1)
) {

   @Singleton
   fun userStatefulRedisConnection(objectMapper: ObjectMapper): StatefulRedisConnection<String, User> { // (2)
      return redisClient.connect(GenericJsonRedisCodec<User>(objectMapper)) // (3)
   }

}
```

1. Recebemos uma instância do `RedisClient` gerenciado pelo Micronaut.
2. Recebemos um `ObjectMapper` que também é disponibilizado e gerenciado pelo Micronaut.
3. Aqui criamos uma instância de `StatefulRedisConnection<String, User>` informando o codec que criamos no passo anterior.

Finalmente, para gravar e ler um usuário você precisa receber uma instância de `StatefulRedisConnection<String, User>` e pode fazer algo parecido com os métodos abaixo:

```kotlin
@Controller
@OptIn(ExperimentalLettuceCoroutinesApi::class)
class ExampleController(
   private val userConnection: StatefulRedisConnection<String, User>
) {

   @Get("/read-user")
   suspend fun readUser(): User? {
      val commands = userConnection.coroutines()
      return commands.get("user1")
   }

   @Get("/write-user")
   suspend fun writeUser(): User {
      val commands = userConnection.coroutines()
      val user = User("user1", "John Doe", LocalDateTime.now(Clock.systemUTC()))
      commands.set("user1", user)
      return user
   }
}
```

Para que o campo `createdAt` seja exibido de forma amigável, adicione a configuração abaixo no arquivo `application.yml`:

```yaml
jackson:
  serialization:
    writeDatesAsTimestamps: false
```

## Conclusão

O Micronaut oferece pouca integração com o Redis, mas já é o suficiente para utilizá-lo tanto em cenários simples quanto em cenários complexos. O Lettuce oferece suporte a coroutines, o que é muito interessante para evitar o bloqueio do event loop do Micronaut e poder aproveitar melhor o poder de processamento do servidor.

