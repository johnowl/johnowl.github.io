---
layout: post
title: Kotlin, Micronaut, MongoDB e Coroutines
comments: true
categories: 
    - Micronaut
    - Kotlin
    - Micronaut MongoDB
    - MongoDB
    - Database
description: Como usar MongoDB no Micronaut sem bloquear o event loop usando coroutines do Kotlin.
image: /public/images/2021-09-26/documents.jpeg
---

## Introdução

A integração do Micronaut com o MongoDB é possível usando os drivers feitos para Java. Atualmente o Micronaut não suporta o MongoDB nativamente usando sua infraestrutura livre de reflection. O pacote Micronaut MongoDB constrói os beans para você usar o MongoDB e faz algumas outras integrações como dar suporte para uso das configurações do Micronaut e também se integra com o health check do Micronaut.

Nosso objetivo com esse artigo é mostrar como usar o MongoDB Reativo com Micronaut usando Coroutines.

## Pré requisitos

* Docker
* IntelliJ
* Java JDK

## Iniciando uma instância do MongoDB usando Docker

Para iniciar uma instância do MongoDB sem definir um usuário e senha, basta executar o comando que segue:

```bash
docker run --name mongodb -p 27017:27017 -d mongo
```

## Criando o projeto

Acesse [https://micronaut.io/launch/](https://micronaut.io/launch/) e crie um projeto com a linguagem Kotlin, Gradle Kotlin como ferramenta de build, adicione a feature `mongo-reactive`, faça o download do projeto, descompacte-o e depois abra-o no IntelliJ.

![exemplo das configurações no site Micronaut Launch]({{site.baseurl}}/public/images/2021-09-26/micronaut-launch.png)

Abra o arquivo `build.gradle.kts` e adicione as dependências abaixo para ter suporte às coroutines do Kotlin.

```kotlin
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.5.2")
implementation("org.jetbrains.kotlinx:kotlinx-coroutines-reactive:1.5.2")
```

## Criando o esqueleto do repositório

Antes de criar nosso repositório, vamos definir uma classe para representar os documentos da nossa coleção:

```kotlin
data class User(
   var id: String = UUID.randomUUID().toString(), // (1)
   var name: String, // (2)
   var email: String,
   var createdAt: LocalDateTime = LocalDateTime.now(Clock.systemUTC()),
   var updatedAt: LocalDateTime = LocalDateTime.now(Clock.systemUTC()),
) {
   constructor() : this(name = "", email = "") // (3)
}
```

Algumas observações sobre nossa `data class`:

1. O identificador do usuário será gerado pela aplicação, e será um UUID.
2. Os atributos precisam ter um `getter` e um `setter`, por isso foram definidos como `var`.
3. A classe precisa ter um construtor sem parâmetros para que o driver do MongoDB consiga preencher os campos ao fazer uma consulta.

Ao invés de adicionar um construtor secundário sem parâmetros, você pode adicionar valores default para todos os campos da sua `data class` que o efeito será o mesmo:

```kotlin
data class User(
   var id: String = UUID.randomUUID().toString(),
   var name: String = "",
   var email: String = "",
   var createdAt: LocalDateTime = LocalDateTime.now(Clock.systemUTC()),
   var updatedAt: LocalDateTime = LocalDateTime.now(Clock.systemUTC()),
)
```

Agora podemos construir nosso repostório que recebe uma instância de `MongoClient` e cria uma instância da coleção que queremos interagir:

```kotlin
@Singleton
class UserRepository(
   private val mongoClient: MongoClient
) {

   private val collection = mongoClient
      .getDatabase("demo")
      .getCollection("users", User::class.java)

}
```

No código acima definimos que nosso repositório irá interagir com a coleção `users` no banco de dados `demo`. Também definimos que a classe `User` representa os itens da coleção. As configurações de conexão com o MongoDB ficam no arquivo `application.yml` e são adicionadas quando você cria o projeto:

```yaml
micronaut:
  application:
    name: mongo-db-demo
    
mongodb.uri: mongodb://${MONGO_HOST:localhost}:${MONGO_PORT:27017}
```

## Inserindo dados no MongoDB

Para inserir registros no banco de dados, vamos criar um método `save` que recebe um usuário como parâmetro. Além disso, como estamos trabalhando com um driver reativo, precisamos pedir para que a execução seja finalizada sem bloquear a thread antes de continuar sua execução.

```kotlin
suspend fun save(user: User) {
    collection.insertOne(user).awaitFirst()
}
```

O método `.awaitFirst()` faz parte do pacote `kotlinx-coroutines-reactive` e o que ele faz é aguardar a execução do insert sem bloquear a thread. Ele só pode ser usado dentro de uma coroutine, por isso definimos nossa função como `suspend`.

## Listando dados do MongoDB

Vamos criar um método chamado `findAll` que retorna uma lista com todos os itens da coleção `users`.

```kotlin
suspend fun findAll(): List<User> {
    return collection.find().asFlow().toList()
}
```

Esse método também faz o uso de coroutines para não bloquear o event loop do Micronaut.

## Consultar um item pelo seu identificador

Para consultar um item pelo identificador, precisamos montar uma consulta usando a DSL do MongoDB. Todo documento inserido no MongoDB recebe um campo chamado `_id`, então devemos procurar por esse campo para encontrar o usuário desejado:

```kotlin
suspend fun findById(id: String): User? {
    return collection.find(
        eq("_id", id)
    ).awaitFirstOrNull()
}
```

Caso o usuário não seja encontrado, será retornado `null`.

## Atualizar informações do usuário

Como a atualização abaixo refere-se somente a um campo que realmente foi alterado não corre-se o risco de problemas de concorrência.

```kotlin
suspend fun updateEmail(id: String, email: String) {
    collection.updateOne(
        eq("_id", user.id),
        listOf(
           set("email", email),
           set("updatedAt", LocalDateTime.now(Clock.systemUTC()))
        )
    ).awaitFirst()
}
```

Outra forma de atualizar um item em uma coleção é através do método `replaceOne`. Aqui podemos ter problema de concorrência, pois se você consultar o usuário para ser atualizado e antes de você efetivar sua alteração outro usuário alterá-lo e gravá-lo, pode ocorrer perda de informações.

```kotlin
suspend fun updateNonSafe(user: User) {
   collection.replaceOne(
      eq("_id", user.id), // (1)
      user, // (2)
      ReplaceOptions().upsert(false) // (3)
   ).awaitFirst()
}
```

1. Filtro para atualizar somente o usuário com esse identificador.
2. Os dados do usuário que serão atualizados
3. Adicionamos a opção `upsert` com o valor `false` para impedir que, se o usuário não existir, ele não seja inserido na coleção.

Para evitar o problema de concorrência do método `replaceOne` você pode adicionar um campo `version` no seu documento, esse campo deve ser incrementado toda vez que você faz uma atualização e também deve ser usado para buscar o documento que vai ser atualizado. Isso é chamado de concorência otimista em bancos de dados. Veja um exemplo:

```kotlin
val id = "700e5597-12ce-4ad8-8715-b3d8e47413f2"
val newName = "Updated Name"
val newEmail = "Updated Email"

val user = this.findById(id) ?: throw Exception("User not found")
user.name = newName
user.email = newEmail
user.version = user.version + 1 // (1)

collection.replaceOne(
    and(eq("_id", user.id), eq("version", user.version - 1)), // (2)
    user,
    ReplaceOptions().upsert(false)
).awaitFirst()

if (result.modifiedCount != 1L) {
   throw Exception("The user was already updated, try again")
}
```

1. Depois de buscar o usuário no banco de dados, os campos são atualizado e o campo version é incrementado
2. Ao buscar o item que vai ser atualizado, usamos o campo version com o valor que foi obtido na busca feita no banco de dados, dessa forma, se ele já foi atualizado e o campo version foi incrementado, ele não será encontrado para ser atualizado novamente.

## Usando nosso repositório

Até o momento, nosso repositório deve estar parecido com o código abaixo:

```kotlin
@Singleton
class UserRepository(
   private val mongoClient: MongoClient
) {

   private val collection = mongoClient
      .getDatabase("demo")
      .getCollection("users", User::class.java)

   suspend fun save(user: User) {
      collection.insertOne(user).awaitFirst()
   }

   suspend fun updateEmail(id: String, email: String) {
      val result = collection.updateOne(
         eq("_id", id),
         listOf(
            set("email", email),
            set("updatedAt", LocalDateTime.now(Clock.systemUTC()))
         )
      ).awaitFirst()
   }

   suspend fun findAll(): List<User> {
      return collection.find().asFlow().toList()
   }

   suspend fun findById(id: String): User? {
      return collection.find(
         eq("_id", id)
      ).awaitFirstOrNull()
   }
}
```

Agora vamos criar um controller para conseguir interagir com nosso banco de dados:

```kotlin
@Controller
class UserController(
   private val userRepository: UserRepository
) {

   @Post("/")
   suspend fun save(user: User) {
      userRepository.save(user)
   }

   @Patch("/{id}/email")
   suspend fun patch(id: String, @Body("email") email: String) {
      userRepository.updateEmail(id, email)
   }

   @Get("/{id}")
   suspend fun findById(id: String): User? {
      return userRepository.findById(id)
   }

   @Get("/")
   suspend fun findAll(): List<User> {
      return userRepository.findAll()
   }
}
```

Agora, usando uma ferramenta como o Postman ou o curl podemos adicionar, remover, listar ou atualizar os usuários.

## Conclusão

Atualmente existe apenas um projeto de integração entre o driver do MongoDB para Java e o framework Micronaut. Apesar do Micronaut ainda não dar suporte completo para o MongoDB, é possível utilizá-lo sem problemas. Na data de hoje o suporte para MongoDB está no [roadmap do time do Micronaut](https://github.com/micronaut-projects/micronaut-core/projects/5) com o status de "Planejado", junto com o suporte ao Neo4j. Acredito que em breve teremos novidades pois o MongoDB é um banco de dados não relacional muito utilizado.
