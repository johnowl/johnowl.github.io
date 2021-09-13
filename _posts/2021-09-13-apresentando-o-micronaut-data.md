---
layout: post
title: Apresentando o Micronaut data
comments: true
categories: 
    - Micronaut
    - Kotlin
    - Micronaut Data
    - Database
description: Conheça uma poderosa ferramenta para acessar bancos de dados. Para quem já trabalha com Spring vai achar bem familiar o jeito de usar e vai se surpreender com a performance.
image: /public/images/2021-09-13/binary.jpg
---

## Introdução

Um grande número de aplicações atualmente faz o uso de frameworks chamados ORM, sigla para Object-Relational Mapping que traduzido para o portugês significa Mapeamento Objeto Relacional. Este tipo de ferramenta abstrai as chamadas de bancos de dados fazendo com que os desenvolvedores não se preocupem em escrever queries SQL. Ele faz isso mapeando as tabelas do modelo relacional para classes da programação orientada a objetos.

Quem já trabalha com Java provavelmente já conhece a JPA (Java Persistence API) que descreve uma interface comum para frameworks de persistência de dados. Uma implementação muito usada da JPA é o Hibernate. Para as pessoas que já desenvolvem usando o framework mais popular do mundo Java, o Spring, já deve ter usado os repositórios do Spring Data JPA que facilitam ainda mais o nosso dia a dia.

Spring Data JPA permite que você crie interfaces com métodos que descrevem as consulta e o framework se encarrega de implementar a classe e criar as queries do banco de dados. Exemplo:

```koltin
interface UserRepository : CrudRepository<Long, User> {
  fun findByName(name: String): List<User>
  fun findByCountry(country: String): List<User>
}
```

O Micronaut possui o Micronaut Data JPA e Micronaut Data JDBC, que são muito parecidos com o Spring Data JPA.

## O que é Micronaut Data?

Segundo a documentação do projeto, Micronaut Data é um kit de ferramentas para acesso a banco de dados que usa compilação Ahead of Time (AOT) para pré-computar as consultas para interfaces de repositórios que são executadas por um fina e leve camada de runtime.

Aqui já temos uma diferença entre o Spring Data e o Micronaut Data. O Spring usa reflexão para criar as instâncias dos repositórios em tempo de execução. Já o Micronaut faz isso em tempo de compilação, as principais vantagens que essa diferença traz são o menor uso de memória, menor tempo de inicialização da aplicação e detecção de erros em tempo de compilação.

O Micronanut Data ainda oferece duas opções: Micronaut Data JPA e Micronaut Data JDBC. A diferença entre elas é que a segunda implementa classes e comandos SQL adicionando o menor overhead possível, para quem é das antigas e já teve que escrever queries SQL em aplicações Java, vai se lembrar de como era feito:

1. Abrir conexão com o banco
2. Criar o comando SQL
3. Passar os parâmetros para o comando SQL
4. Executar o comando
5. Mapear as linhas que retornaram para os objetos de domínio
6. Fechar a conexão

O Micronaut Data JDBC faz algo parecido com isso, ou seja, usa a menor quantidade possível de abstrações para implementar seu repositório.

## Performance do Micronaut Data

O benchmark abaixo foi retirado do [site do Micronaut](https://micronaut.io/2019/07/18/announcing-micronaut-data/). É possível ver a grande diferença de performance entre o Micronaut Data JDBC e seus concorrentes.

| Implementação       | Operações por segundo |
|---------------------|-----------------------|
| Micronaut Data JDBC | 430K ops/sec          |
| Spring Data JDBC    | 275K ops/sec          |
| Micronaut Data JPA  | 145K ops/sec          |
| Spring Data JPA     | 140K ops/sec          |
| GORM JPA            | 50K ops/sec           |

## Facilidade de uso

O Micronaut Data JPA é muito parecido com o Spring Data JPA, se você conhece um, praticamente já conhece o outro. O Micronaut Data JDBC funciona da mesma maneira que a versão JPA, no entanto ela faz o uso de outras anotações para definir as entidades e relacionamentos. Além disso, em um repositório Micronaut Data JDBC você precisa informar na interface qual dialeto SQL está sendo usado. Exemplo:

```kotlin
@JdbcRepository(dialect = Dialect.H2) 
interface BookRepository : CrudRepository<Book, Long> { 
    fun find(title: String): Book
}
```

## Suporte a Kotlin coroutines

O Micronaut Data não é compatível com coroutines do Kotlin. No entanto, ele permite que você defina as respostas dos repositórios usando  `Publisher` do projeto [Reactive Streams](https://www.reactive-streams.org/) ou tipos do [RxJava 2](https://github.com/ReactiveX/RxJava) como o `Single`.

Ao retornar um tipo reativo é possível usar as [extension functions](https://kotlin.github.io/kotlinx.coroutines/kotlinx-coroutines-reactive/) `.await*()` das coroutines para aguardar a execução da consulta em uma coroutine sem bloquear a thread. Dessa forma você consegue ter um código assíncrono mas que executa de forma sequencial. O Micronaut irá executar a consulta em uma thread de IO, caso a implementação seja bloqueante.

## Conclusão

Mesmo sendo um framework novo e sem suporte a coroutines do Kotlin, o Micronaut já entrega algumas vantagens em relação ao Spring Framework. Micronaut ainda faz isso com uma performance melhor e de uma forma muito familiar para quem trabalha com Spring, facilitando para quem pensa em migrar de framework.
