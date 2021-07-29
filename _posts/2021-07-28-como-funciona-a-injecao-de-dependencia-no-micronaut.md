---
layout: post
title: Como funciona a injeção de dependência no Micronaut
comments: true
categories: 
    - GraalVM
    - Micronaut Framework
    - Java
    - Kotlin
    - Injeção de dependência
    - Inversão de controle
description: Entenda o que é e como funciona a injeção de dependência no Micronaut e porque isso faz sua aplicação economizar memória.
image: /public/images/2021-07-28/upside-down.jpg
---

## Introdução

Neste artigo vamos entender o que é, como funciona e porque a injeção de dependência no Micronaut Framework faz sua aplicação economizar memória quando comparamos com o framework mais usado no mundo Java, o Spring Framework.

## O que é injeção de dependência?

Antes de entender o que é injeção de dependência precisamos entender um conceito chamado inversão de controle. Para reduzir o acoplamento entre classes, ao invés de deixar uma classe criar instâncias de outras classes que ela depende para funcionar, nós invertemos essa lógica. E fazemos com que as dependências sejam injetadas na classe usando algum container de inversão de controle (IoC Container). Veja um exemplo de classe com alto acoplamento:

```kotlin
class UserService() {

    private val userRepository = UserRepository() // 1

    fun listUsers() = userRepository.findAll()

}
```

O comentário com o número 1 mostra que estamos criando uma instância de `UserRepository` diretamente na classe `UserService`, gerando alto acoplamento e dificultando testes unitários. Quando usamos a inversão de controle, nossa classe fica assim:

```kotlin
class UserService(
    private val userRepository: UserRepository // (1)
) {

    fun listUsers() = userRepository.findAll()

}
```

No comentário com o número 1, podemos ver que ao invés de criar a instância da classe `UserRepository`, nós declaramos no construtor que a classe precisa de uma instância do tipo `UserRepository`. Dessa forma, se quisermos escrever um teste de unidade, podemos criar um mock da classe `UserRepository` para isolar nosso teste. Veja como:

```kotlin

class MockUserRepository : UserRepository { // (1)

    fun listUsers() = listOf(User(1, "John"), User(2, "Mary"))

}

@Test
fun `total users should be two`() {

    val repository = MockUserRepository() // (2)
    val service = UserService(repository) // (3)

    assertEquals(2, service.listUsers())
}

```

Veja os detalhes:

1. Criamos uma versão mockada do nosso UserRepository que retorna uma lista com 2 valores fixos
2. Instanciamos nosso mock
3. Passamos o mock no construtor da classe `UserService`

Eu preciso injetar manualmente as classes do meu código de produção? Não! O Micronaut possui um Container de Inversão de Controle que injeta as dependências em nossas classes, não precisamos fazer igual ao teste de exemplo mostrado acima, onde injetamos manualmente o repositório na classe de serviço. Veja como fica no Micronaut:

```kotlin

@Repository
interface UserRepository : CrudRepository<User, Long>

@Singleton
class UserService(
    private val userRepository: UserRepository // (1)
) {

    fun listUsers() = userRepository.findAll()

}
```

Notou o uso das anotações `@Singleton` e `@Repository`? Elas servem para informar ao Micronaut Framework que essas classes devem ser gerenciadas pelo container de inversão de controle.

## Como funciona a injeção de dependência no Micronaut?

No Micronaut a injeção de dependência é feita em tempo de compilação, diferente do Spring Framework que faz em tempo de execução. Com isso, o Micronaut reduz o uso de memória na sua aplicação e reduz o tempo de início. Além disso, o uso de memória da aplicação não aumenta proporcionalmente ao crescimento dela, pois não é necessário armazenar informações de reflexão de cada classe adicionada no container de inversão de controle, como acontece com o Spring.

Como vimos no capítulo anterior, cada classe que vai ser gerenciada pelo Micronaut precisa de uma anotação. Essa anotação define quando uma nova instância deve ser criada ou se toda a aplicação deve usar uma única instância (criar uma única instância para toda a aplicação é um padrão de projeto conhecido como [Singleton](https://refactoring.guru/pt-br/design-patterns/singleton)). Essas classes, cujo ciclo de vida é gerenciado pelo Micronaut, são chamadas de Bean.

Veja as anotações disponíveis:

| Anotação            | Descrição                                                                                                                                       |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------|
| @Singleton      | Uma única instância será criada e usada por toda a aplicação                                                                                    |
| @Context        | Uma única instância será criada junto com o ApplicationContext                                |
| @Prototype      | Uma nova instância é criada sempre que for injetada                                                         |
| @Infrastructure | Cria um bean que não pode ser substituído ou sobrescrito |
| @ThreadLocal    | Cria uma instância por thread                                                              |
| @Refreshable    | Permite que um bean seja recriado através do endpoint /refresh                                            |
| @RequestScope   | Uma nova instância é criada a cada requisição HTTP                      |

As mais usadas são @Singleton, @Prototype e @Refreshable.

## Como substituir um Bean

Para substituir um bean você pode usar a anotação `@Replaces` e passar um parâmetro que indica qual bean deve ser substituído. Veja um exemplo:

```kotlin
@Singleton
@Replaces(TokenValidator::class)
class CustomJwtTokenValidator : TokenValidator {

    override fun validateToken(token: String?): Publisher<Authentication> {
        // do validation
        return Flowable.just(CustomAuthentication())
    }
}
```

## Como injetar vários Beans

Imagine que você criou várias classes de validação que implementam uma interface comum, e você precisa injetar todas elas, independente se existe 1, 2, 3 ou N classes. Para que uma classe receba todas elas, você pode declarar que a classe depende de uma coleção de beans. Veja um exemplo:

```kotlin
interface Validation {
 fun isValid(value: String): Boolean
}

@Singleton
class MaxLength : Validation {
 override fun isValid(value: String): Boolean {
  return value.length <= 255
 }
}

@Singleton
class MinLength : Validation {
 override fun isValid(value: String): Boolean {
  return value.length > 3
 }
}

@Singleton
class StringValidator(
 private val validations: Collection<Validation>
) {
 fun isValid(value: String): Boolean {
  return validations.all { it.isValid(value) }
 }
}
```
