---
layout: post
title: Como usar circuit breaker com Micronaut
comments: true
categories: 
    - Circuit Breaker
    - Micronaut
    - Kotlin
description: Veja como é simples aumentar a resiliência dos seus serviços que precisam fazer chamadas a outros serviços.
image: /public/images/2022-02-20/circuit-breaker-small.jpg
---

## Introdução

Quando trabalhamos com microsserviços é comum que uma ação do usuário dispare várias requisições entre microsserviços que colaboram entre si.

Diferente de uma chamada de um serviço em um monólito que é uma simples chamada de função, em uma arquitetura de microsserviços uma chamada de um serviço geralmente é feita via HTTP, e por isso tem uma chance maior de falhar.

## O que é um Circuit Breaker

Um circuit breaker é um mecanismo de proteção que desliga/abre um circuito em caso de problemas. Em português, circuit breaker significa disjuntor. Um exemplo prático é o disjuntor que todas as casas têm, em caso de sobrecarga na rede elétrica ele desliga o fornecimento de energia para evitar danos nos eletrodomésticos. Quando um disjuntor está desligado significa que o circuito está aberto, ou seja, não há fornecimento de energia.

Um circuit breaker em uma aplicação funciona de forma parecida. Você define um número máximo de falhas e caso ele seja atingido a comunicação com o serviço será desligada por algum momento, o circuito que estava fechado (deixando requisições serem feitas) ficará aberto (não aceitará requisições) por um tempo.

Passado esse tempo, o circuit breaker irá para o estado meio aberto, nesse estado ele permite que uma requisição seja feita e, em caso de sucesso o circuito é fechado novamente. Caso o problema persista o circuito ficará aberto por mais um tempo até que volte para o estado meio aberto para que seja feita uma nova verificação.

## Circuit Breaker e Micronaut

O Micronaut oferece uma anotação chamada `@CircuitBreaker` que pode ser usada em um cliente HTTP. Basta configurar algumas propriedades que ele já estará funcionando. Veja um exemplo abaixo:

```kotlin
@Client("http://localhost:8888")
@CircuitBreaker(delay = "5s", attempts = "3", reset = "30s")
interface HelloClient {

   @Get("/hello")
   suspend fun get(): String
}
```

O exemplo acima foi configurado para que o circuit breaker abra o circuito depois de 3 erros. Cada retentativa terá um intervalo de 5 segundos entre elas. Após 30 segundos o circuit breaker irá tentar novamente fazer uma requisição, caso não consiga continuará com o circuito aberto. Veja abaixo todas as propriedades que podem ser configuradas:

| Propriedade | Descrição | Valor Padrão |
|-------------|-----------|--------------|
| delay | O tempo de espera entre retentativa | 500ms |
| attempts | O número máximo de retentativas | 3 |
| reset | Tempo de espera para trocar o estado do circuit breaker para meio aberto permitindo uma única retentativa  | 20s |
| multiplier | Multiplicador para calcular o tempo entre retentativas | 1 |
| maxDelay | Tempo máximo de espera para uma operação completar até que o estado do circuit breaker é alterado para aberto | 5s |
| includes | Tipos de exceção que serão incluídas | ALL |
| excludes | Tipos de exceção que serão ignoradas pelo circuit breaker | NONE |
| predicate | Pode ser usado no lugar de includes ou excludes | NONE |

## Como ligar o modo debug do Circuit Breaker do Micronaut

Pode ser interessante ver o funcionamento do Circuit Breaker durante um debug. Para fazer isso, acesse o arquivo `logback.xml` no diretório `src/main/resources` e adicione o conteúdo abaixo dentro da tag `configuration`:

```xml
   <logger name="io.micronaut.retry" level="debug" />
```

## Conclusão

Nesse artigo vimos como é simples configurar um circuit breaker para um cliente HTTP do Micronaut. Uma das vantagens de usar essa abordagem é evitar que um serviço lento cause uma queda em cascata de vários serviços do seu cluster.
