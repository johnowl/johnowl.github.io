---
layout: post
title: Como não bloquear o event loop do Micronaut usando coroutines
comments: true
categories: 
    - Micronaut
    - Event Loop
    - Netty
    - Http Client
    - Coroutines
    - Kotlin
description: Como tirar melhor proveito do hardware para servir mais requisições usando as coroutines do Kotlin.
image: /public/images/2021-08-27/no-trespassing.jpeg
---

## Introdução

O Micronaut roda sobre o  Netty, uma ferramenta muito poderosa para construção de aplicações cliente/servidor. Ele é muito performático e consegue servir muitas requisições simultâneas.

O Netty usa um event loop rodando em uma thread principal para processar as requisições, ou seja, para não impactar o poder de processamento você nunca deve bloquear essa thread. Todos os códigos que possam bloquear a thread principal devem rodar em uma thread secundária.

Por padrão, o Micronaut inicia o Netty com o número de threads igual à quantidade de processadores da máquina multiplicado por dois, ou seja, um máquina com 4 processadores terá 8 threads.

Nesse artigo vamos ver como fazer o melhor uso possível do Netty e do Micronaut.

## O que significa bloquear o event loop?

Antes de continuar, algumas definições:

1. **event loop**: um processador de eventos rodando em uma thread.
2. **thread**: sequência de comandos que é executada no processador.

O processador trabalha em uma velocidade altíssima, muito mais rápido que sua placa de rede, disco ou SSD. Isso significa que toda vez que é preciso acessar um desses componentes, a thread precisa esperar pela informação antes de continuar. A informação pode ser um pacote de dados recebido pela rede ou um arquivo em disco.

Essa espera que a thread faz é o que chamamos de bloqueio, pois ao invés de executar comandos, a thread fica bloqueada, esperando por mais informações para continuar. E se a thread é bloqueada, o event loop que está rodando nela também é bloqueado.

## Como evitar o bloqueio do event loop?

Para evitar o bloqueio do evento loop temos que evitar o bloqueio da thread principal. Para fazer isso temos duas possibilidades:

1. usar alguma biblioteca de programação reativa como o projeto [Reactor](https://projectreactor.io/)
2. usar as coroutines do Kotlin (essa eu acho bem mais simples)

As coroutines são parecidas com threads, mas [são muito mais leves](https://kotlinlang.org/docs/coroutines-basics.html#coroutines-are-light-weight). Um processador pode suportar um número muito maior de coroutines do que de threads. Veja esse exemplo extraído do site da linguagem Kotlin que executa 100.000 coroutines em apenas 5 segundos:

```kotlin
fun main() = runBlocking {
    repeat(100_000) { // launch a lot of coroutines
        launch {
            delay(5000L)
            print(".")
        }
    }
}
```

Para tranformar uma função em uma coroutine, basta adicionar a palavra reservada `suspend` na declaração da função. Isso significa que a execução da função pode ser suspensa sem bloquear a thread em que a coroutine é executada (Sim! As coroutines executam em threads).

## Como funciona uma suspend fun?

Após compilada, uma `suspend fun` é transformada em uma função comum. A diferença é que ela recebe um novo parâmetro do tipo `Continuation<T>`. Esse parâmetro possui dois métodos para continuar a execução, um para continuar com sucesso e outro para continuar com erro.

Outro ponto interessante das `suspend fun` é que você escreve um código sequencial, ou seja, você não adiciona complexidade desnecessária no seu código com callbacks ou awaits. Veja um exemplo:

```kotlin
suspend fun doSomethingHeavy() {
  println("do work")
}

suspend fun main() {
  doSomethingHeavy()
  println("finished")
}
```

O resultado da execução será:

```text
do work
finished
```

O código é executado da maneira que você está lendo, sem segredos, e com a vantagem de não bloquear a thread principal.

## Comparativo

Agora que já sabemos um pouco sobre event loops e coroutines, vamos mostrar o impacto do uso das coroutines comparado à maneira que bloqueia a thread principal.

Para executar esse teste eu criei um serviço que retorna uma mensagem depois de determinado tempo. O serviço foi escrito com Micronaut, usando a `suspend fun` do Kotlin e publicado na AWS em uma instância EC2 t2.micro com 1 vCPU e 1GiB de RAM. Veja como ficou a aplicação que foi nomeada como `delay`:

```kotlin
@Controller
class HelloController {

    @Get("/delay/{milliseconds}")
    suspend fun hello(@PathVariable milliseconds: Long ): Message {
        delay(milliseconds)
        return Message("Waited for $milliseconds!")
    }

}
```

Para chamar a aplicação `delay`, foi criada outra aplicação com três cenários:

1. Cenário bloqueante
2. Cenário reativo
3. Cenário com coroutine (`suspend fun`)

Cada cenário é composto por um controller e um cliente HTTP, ambos escritos usando Micronaut. Também configurei a aplicação que foi testada para que o event loop use somente duas threads, dessa forma é preciso menos carga para causar um possível impacto na aplicação. Essa aplicação estava rodando na mesma máquina que o teste de carga.

```yaml
io:
  netty:
    event-loop-threads: 2
```

Em todos os cenários executei o mesmo teste de carga, foram usados 200 usuários em um período de 10 segundos. Veja o código do teste:

```scala
import io.gatling.core.Predef._
import io.gatling.http.Predef._

import scala.concurrent.duration.DurationInt

class ReactorSimulation extends Simulation {
  val protocol = http.baseUrl("http://localhost:8080")
    .contentTypeHeader("application/json")

  val scn = scenario("Reactor Scenario")
    .exec(
      http("reactor")
        .get("/reactor")
        .check(status.is(200))
    )

  setUp(scn.inject(
    nothingFor(5.seconds),
    rampUsers(200) during 10.seconds
  )).protocols(protocol)

}
```

## Cenário bloqueante

Esse tipo de código é só um exemplo, você nunca deve levar para produção algo assim pois a performance não é aceitável. Em [nosso teste]({{site.baseurl}}/public/images/2021-08-27/results/blocking/index.html), 100% das requisições falharam, o teste durou 101 segundos.

```kotlin
@Client("http://ec2-X-X-X-X.compute-1.amazonaws.com:8081/")
interface DelayHttpClientBlocking {
    @Get("/delay/{delay}")
    fun delay(@PathVariable delay: Long): Message
}


@Controller("/")
class HelloController(
    private val httpClientBlocking: DelayHttpClientBlocking
) {

    @Get("blocking")
    fun coroutine(): Message {
        return httpClientBlocking.delay(500)
    }

}
```

## Cenário reativo

Esse [cenário]({{site.baseurl}}/public/images/2021-08-27/results/reactor/index.html), como esperado, se comportou muito bem. O teste durou 42 segundos, tivemos 100% de sucesso nas requisições e 68,5% responderam abaixo de 800ms.

A principal diferença entre o código bloqueante e o código reativo é o tipo de resposta das funcões. Ao invés de retornar o valor `Message`, retornamos um `Mono<Message>`. Isso aumenta um pouco a complexidade, pois o valor de `Message` não está disponível logo após a chamada ao método `delay` da interface `DelayHttpClientReactor`. É possível recuperar esse valor, mas é preciso codificar um subscriber com funções de callback ou, pior ainda, bloquear a thread chamando o método `block()`.

```kotlin
@Client("http://ec2-X-X-X-X.compute-1.amazonaws.com:8081/")
interface DelayHttpClientReactor {
    @Get("/delay/{delay}")
    fun delay(@PathVariable delay: Long): Mono<Message>
}

@Controller("/")
class HelloController(
    private val httpClientReactor: DelayHttpClientReactor
) {
    
    @Get("reactor")
    fun reactor(): Mono<Message> {
        return httpClientReactor.delay(500)
    }
}
```

## Cenário com coroutine (`suspend fun`)

Esse [cenário]({{site.baseurl}}/public/images/2021-08-27/results/coroutines/index.html) se comportou de forma muito parecida com o anterior, também foi executado em 42 segundos, tivemos 100% de sucesso nas chamadas e o tempo de resposta também foi muito parecido.

Comparado ao cenário bloqueante, a única diferença é a presença da palavra chave `suspend` na declaração da função. E a principal vantagem é que o código fica mais simples, além disso, logo após a execução da coroutine você tem acesso ao valor que ela retorna, basta atribuir o resultado da função a uma variável. Por exemplo: `val message = delayHttpClientCoroutine.delay(500)`.

A única restrição é que uma `suspend fun` só pode ser chamada por outra `suspend fun` ou por um coroutine builder.

```kotlin
@Client("http://ec2-X-X-X-X.compute-1.amazonaws.com:8081/")
interface DelayHttpClientCoroutine {
    @Get("/delay/{delay}")
    suspend fun delay(@PathVariable delay: Long): Message
}

@Controller("/")
class HelloController(
    private val httpClientCoroutine: DelayHttpClientCoroutine
) {

    @Get("suspend")
    suspend fun suspend(): Message {
        return httpClientCoroutine.delay(500)
    }
}
```
