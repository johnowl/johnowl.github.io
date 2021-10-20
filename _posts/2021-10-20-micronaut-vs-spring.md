---
layout: post
title: Micronaut vs Spring
comments: true
categories: 
    - Micronaut
    - Kotlin
    - Spring
    - Microservice
    - Database
    - Controller
description: Comparativo entre Micronaut e Spring. Micronaut é uma cópia do Spring? Existem diferenças entre Micronaut e Spring?
image: /public/images/2021-10-20/boxing.jpg
---

## Introdução

Esse artigo foi escrito baseado em uma apresentação que fiz para alguns times no Itaú. O objetivo é comparar algumas funcionalidades do Spring Framework com o Micronaut Framework. O foco foi em funcionalidades que podem ser úteis na construção de microsserviços.

## Spring Framework

O Spring Framework é o framework mais usado no mundo Java. Ele foi lançado em 2003 e trouxe diversas facilidades para o desenvolvimento de aplicações web.

Um dos principais atrativos que o Spring trouxe foi o uso de convenção sobre configuração, ou seja, ao invés de ficar configurando dezenas de  arquivos XML, você usa uma convenção adotada pelo framework e ele faz todo o trabalho de configuração pra você. Muitas vezes, tudo o que você precisa fazer é adicionar uma anotação em uma classe.

Por ter tantos anos de estrada, o Spring framework é muito robusto e completo. Ele possui diversas funcionalidades que já estão rodando em produção a bastante tempo, o que traz confiabilidade para os desenvolvedores. Além disso, a comunidade é bem grande e é fácil encontrar conteúdo a respeito.

## Micronaut Framework

Lançado em outubro de 2018, já na era dos microsserviços e Cloud Native, o Micronaut Framework se preocupa em trazer alta performance com baixo uso de memória, se tornando ideal para microsserviços que rodam em imagens Docker em clusters Kubernetes. Além disso, como o tempo de inicialização de uma aplicação Micronaut Framework é baixo, ele também se torna ideal para aplicações serverless.

Por ser um framework novo, ele já foi pensado para ser compatível com uma funcionalidade interessante da GraalVM: compilação AOT (ahead of time) de byte codes para código nativo. Isso o torna ainda mais interessante para uso de aplicações serverless. Mas, como tudo em tecnologia se trata de trade-offs, isso tem um custo, o tempo de build é muito demorado, um simples Hello World pode levar perto de cinco minutos para ser compilado.

## Linguagens suportadas

Ambos os frameworks podem ser usados com as linguagens Java, Kotlin e Groovy. Micronaut deve suportar Scala também em algum momento, a feature está mapeada no roadmap do projeto. A linguagem usada em nossos exemplos será Kotlin.

## Criando APIs que retornam JSON

Além do suporte às linguagens de programação, vamos comparar algumas funcionalidades essenciais para criação de um microsserviço. A primeira delas é a criação de um Controller que retorna JSON. Veja abaixo um `Controller` escrito usando o Micronaut:

```kotlin
@Introspected
data class Person(
   val id: String,
   val name: String
)

@Controller
class PersonController(
   private val personService: PersonService
) {

   @Get("/v1/people/")
   fun listAll() : List<Person> {
      return personService.findAll()
   }

   @Get("/v1/people/{personId}")
   fun findById(personId: String) : Person? {
      return personService.findById(personId)
   }

   @Post("/v1/people")
   fun createPerson(person: Person) : Person {
      return personService.add(person)
   }

   @Put("/v1/people/{personId}")
   fun replacePerson(personId: String, person: Person) : Person {
      return personService.update(personId, person)
   }
}
```

Abaixo segue o mesmo `Controller`, escrito com a ajuda do Spring Framework.

```kotlin
data class Person(
   val id: String,
   val name: String
)

@RestController
class PersonController(
    private val personService: PersonService
) {

    @GetMapping("/v1/people/")
    fun listAll() : List<Person> {
        return personService.findAll()
    }

    @GetMapping("/v1/people/{personId}")
    fun findById(personId: String) : Person? {
        return personService.findById(personId)
    }

    @PostMapping("/v1/people")
    fun createPerson(person: Person) : Person {
        return personService.add(person)
    }

    @PutMapping("/v1/people/{personId}")
    fun replacePerson(personId: String, person: Person) : Person {
        return personService.update(personId, person)
    }
}
```

Como podemos ver, a forma de construir um controller é praticamente a mesma, a única diferença no `Controller` é o nome de algumas anotações. Outra diferença é a presença da anotação `@Introspected` na classe `Person`, ela é usada para informar que o Micronaut deve fazer a introspecção dessa classe para que seja possível a serialização e desserialização para JSON. O Micronaut tenta reduzir o máximo possível o uso de reflexões do Java, para isso ele possui sua própria ferramenta para permitir a introspecção de objetos, e ela é executada em tempo de compilação.

## Consumindo APIs

No exemplo abaixo vamos exemplificar como fazer o consumo de uma API de consulta de CEP. Essa API possui um único parâmetro de entrada que é o código postal e ela retorna uma resposta abritrária. O Micronaut oferece duas formas de fazer isso, uma delas é a forma declarativa e a outra é chamada de cliente baixo nível (low level client). Na primeira forma basta criar uma interface com algumas anotações e na segunda você precisa escrever todo o código, parecido com a forma de fazer isso usando o WebClient do Spring. Vamos aos exemplos, o primeiro é a forma declarativa do Micronaut:

```kotlin
@Client("https://postalcode")
interface PostalCodeFinder {

   @Get("/find/{postalCode}")
   fun find(postalCode: String): Publisher<PostalCodeResponse>
}
```

A interface é implementada pelo Micronaut em tempo de compilação. Já vi alguns projetos em Spring que usam o Retrofit para consumir APIs, fica muito parecido com essa abordagem do HttpClient declarativo. A diferença é que o Retrofit implementa as interfaces em tempo de execução. Abaixo segue a forma de consumir uma API usando o WebClient do Spring.

```kotlin
@Service
class PostalCodeFinderLowLevel(
    private val webClient: WebClient
) {
    fun find(postalCode: String): Mono<PostalCodeResponse> {
        return webClient
            .get()
            .uri("https://postalcode")
            .retrieve()
            .bodyToMono(PostalCodeResponse::class.java)
    }
}
```

Usando a forma baixo nível do Micronaut fica muito parecido:

```kotlin
@Singleton
class PostalCodeFinderLowLevel(
   @Client("https://postalcode") private val httpClient: HttpClient
) {
   fun find(postalCode: String): Publisher<PostalCodeResponse> {
      val req = HttpRequest.GET<Any>("/find/$postalCode")
      return httpClient.retrieve(req, PostalCodeResponse::class.java)
   }
}
```

## Interagindo com bancos de dados relacionais

```kotlin
@Repository
interface PersonRepository : CrudRepository<Person, String> {
    fun findByUsername(username: String): Optional<Person>
}
```

Em ambos os frameworks você define uma interface com métodos que descrevem as consultas. O framework implementa essa interface e gera as consultas SQL. Apesar da interface ser exatamente igual, a principal diferença fica na forma que cada framework implementa cada interface. O Spring faz isso em tempo de execução e o Micronaut faz em tempo de compilação. Por causa dessa diferença, com Micronaut é possível identificar erros nas consultas em tempo de compilação e o Micronaut consegue uma melhor performance que o Spring e com menor uso de memória.

## Diferenças entre Micronaut e Spring

A principal diferença entre o Micronaut e o Spring está na performance. O Spring faz muito processamento em tempo de execução, ou seja, as anotações que você adiciona nas classes para que o Spring faça alguma coisa são processadas em tempo de execução usando muita reflection do Java.

O Micronaut copiou o estilo de usar anotações do Spring Framework, inclusive muitas anotações são parecidas ou até mesmo iguais. A principal diferença é em que momento elas são processadas. Para ter uma melhor performance e menor uso de memória durante a execução da sua aplicação, o Micronaut processa as anotações em tempo de compilação. Por isso o tempo de inicialização também é menor, ele precisa fazer menos coisas quando sua aplicação está iniciando.

Além disso, o Micronaut minimiza muito o uso das reflections do Java. Ele possui sua própria forma de fazer a introspecção de classes e objetos, e ela também é feita em tempo de compilação.

Outra diferença, como já adiantei na introdução, é que o Spring Framework possui muito mais funcionalidades que o Micronaut. Isso acontece pela diferença de 15 anos de idade entre os projetos.

A injeção de dependências entre os dois frameworks funciona de forma parecida, usando anotações, mas as anotações usadas pelos frameworks são diferentes. O Micronaut usa as anotações definidas na JSR-330. Além disso, o Micronaut processa a injeção de dependência em tempo de compilação ao invés de fazer em tempo de execução.

O Spring oferece repositórios para Redis (Spring Data Redis) e MongoDB (Spring Data MongoDb), dessa forma você cria uma interface onde declara suas consultas e o framework a implementa. No Micronaut você precisa usar o cliente para Redis ou MongoDb para interagir com esses bancos de dados.

## Conclusão

A curva de aprendizado do Micronaut é baixa para quem já conhece Spring, dada a quantidade de semelhanças entre ambos. Como o Spring possui muito mais tempo de vida, ele é muito mais completo e traz muitas facilidades que agilizam o desenvolvimento de uma aplicação. Por outro lado, o Micronaut tem a vantagem de ser mais rápido e fazer o menor uso de recursos do servidor. Aqui temos um trade-off entre custo de desenvolvimento e custo de infraestrutura. Com Spring é mais rápido para desenvolver mas preciso de mais recursos de infraestrutura, com Micronaut acontece o contrário, vou levar mais tempo para o desenvolvimento mas os custos de infraestutura podem ser menores.

<!-- A imagem que ilustra esse post foi feita por [Hermes Rivera](https://unsplash.com/@hermez777?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) e foi obtida no site [Unsplash](https://unsplash.com/s/photos/boxing?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText) -->
