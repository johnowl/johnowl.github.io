---
layout: post
title: Perguntas e respostas sobre injeção de dependência no Micronaut
comments: true
categories: 
    - GraalVM
    - Micronaut Framework
    - Java
    - Kotlin
    - Injeção de dependência
    - Inversão de controle
description: Veja algumas soluções que o Micronaut trás para resolver problemas de injeção de dependências.
image: /public/images/2021-08-01/injecao.jpg
---

## Introdução

No artigo anterior introduzimos como funciona a injeção de dependência no Micronaut, nesse artigo vamos detalhar mais as funcionalidades disponíveis focando em resolver problemas do dia a dia.

## No artigo anterior mostramos que é possível trocar um Bean usando a anotação @Replaces, mas porque eu precisaria fazer isso?

Um cenário comum é quando você quer trocar o comportamento de uma classe do próprio Micronaut ou de alguma dependência. Ou seja, você quer trocar um Bean criado por outra pessoa por um Bean criado por você.

Imagine que você gostaria de usar o micronaut-security mas gostaria de trocar a forma que um token JWT é validado, ao invés de validar o token no próprio microsserviço você precisa chamar uma serviço externo. Nesse caso, você pode fazer algo assim:

```kotlin
@Singleton
@Replaces(TokenValidator::class)
class CustomJwtTokenValidator : TokenValidator {
    
    override fun validateToken(token: String?): Publisher<Authentication> {
        // Chama serviço externo para valiar o token
        return Flowable.just(CustomAuthentication())
    }
}
```

## Como eu peço para o Micronaut gerenciar um classe que não tenho acesso ao código para adicionar a anotação @Singleton?

Muitas vezes usamos bibliotecas de terceiros e gostaríamos que algumas classes dessas bibliotecas fossem injetadas em nosso serviços.

O Micronaut oferece o conceito de fábricas, você cria uma classe com métodos que criam as instâncias desejadas e usa as anotações de injeção de dependência do Micronaut nos métodos, veja um exemplo:

```kotlin
@Factory // (1)
class BeanFactory(
    private val securityConfiguration: SecurityConfiguration // (2)
) {
    
    @Singleton // (3)
    fun algorithm(): Algorithm { 
        return Algorithm.HMAC256(securityConfiguration.secret)
    }
    
    @Singleton
    fun jwtVerifier(algorithm: Algorithm) { // (4)
        return JWT.require(algorithm).withIssuer(securityConfiguration.issuer)
    }
}
```

Veja os detalhes:

1. Adicionamos a anotação `@Factory` em nossa classe.
2. Uma fábrica pode receber a injeção de outros Beans no seu construtor.
3. Os métodos da classe geram as instâncias e recebem a anotação `@Singleton` porque queremos uma única instância em todo a aplicação.
4. Um método que constrói uma instância também pode receber injeção de dependências.

## Uma interface tem mais de uma implementação disponível, como aviso o Micronaut qual quero usar?

O Micronaut oferece um recurso chamado Bean Qualifier, dessa forma você consegue escolher o Bean que vai ser injetadao na sua classe pelo nome. Veja um exemplo:

```kotlin
interface FileReader {
    fun read()
}

@Singleton
class CsvFileReader : FileReader {
    override fun read() {
        // lê o arquivo CSV
    }
}

@Singleton
class JsonFileReader : FileReader {
    override fun read() {
        // lê o arquivo Json
    }
}

@Singleton
class JsonFileService(
    @param:Named("JsonFileReader") private val fileReader: FileReader
) {
    // métodos da classe
}
```

Usamos a anotação `@Named` com o nome da classe que queremos que seja injetada. Nesse exemplo, como ambas as classes possuem o sufixo `FileReader`, que é o mesmo nome da interface, é possível omití-lo e usar somente `@Named("Json")`.

## Tenho mais de uma opção de Bean para usar, como aviso o Micronaut qual ele deve carregar?

O Micronaut possui uma anotação para indicar se o Bean deve ser carregado a partir de algum resquisito como uma configuração ou a existência de uma classe. Veja um exemplo usando uma configuração:

```kotlin
@Singleton
@Requires(property = "file.reader.json.enabled", value = "true")
class JsonFileReader : FileReader {
    override fun read() {
        // read Json file
    }
}
```

No exemplo acima, uma instância da classe `JsonFileReader` só estará disponível para uso se o arquivo de configuração da sua aplicação tiver uma propriedade `file.reader.json.enabled` com valor igual a `true`. Além de usar uma configuração para indicar se um Bean deve ser carregado, existem todas as opções abaixo:

| Requisito                                                                                                   | Exemplo                                            |
|---------------------------------------------------------------------------------------------------------------|----------------------------------------------------|
| Requer a presença de uma ou mais classes                                                                  | @Requires(classes=javax.servlet.Servlet)           |
| Requer a inexistência de uma ou mais classes                                                                 | @Requires(missing=javax.servlet.Servlet)           |
| Requer a presença de um ou mais beans                                                                      | @Requires(beans=javax.sql.DataSource)              |
| Requer a inexistência de uma ou mais beans                                                                      | @Requires(missingBeans=javax.sql.DataSource)       |
| Requer um ambiente específico para ser aplicada                                                               | @Requires(env=["test"])                              |
| Requer um ambiente específico para não ser aplicada                                                       | @Requires(notEnv=["test"])                           |
| Requer a presença de uma configuração                                                         | @Requires(configuration="foo.bar")                 |
| Requer a inexistência de uma configuração                                                          | @Requires(missingConfigurations="foo.bar")         |
| Requer uma versão específica do SDK                                                                                | @Requires(sdk=Sdk.JAVA, value="1.8")               |
| Requer a existência de classes com uma anotação específica | @Requires(entities=javax.persistence.Entity)       |
| Requer uma propriedade com um valor opcional                                                                     | @Requires(property="data-source.url")              |
| Requer que uma propriedade não exista                                                        | @Requires(missingProperty="data-source.url")       |
| Requer a existência de um ou mais arquivos                                                  | @Requires(resources="file:/path/to/file")          |
| Requer a existência de um ou mais recursos no classpath                                                       | @Requires(resources="classpath:myFile.properties") |
| Requer que o sitema operacional atual esteja na lista                                                        | @Requires(os=[Requires.Family.WINDOWS])            |
| Requer que o sitema operacional atual não esteja na lista                                                    | @Requires(notOs=[Requires.Family.WINDOWS])         |

É possível usar mais de uma condição, basta adicionar todas elas dentro da anotação `@Requirements`. Isso é necessário proque a linguagem Kotlin não suporta ter várias anotações iguais na mesma classe. Veja um exemplo:

```kotlin
@Singleton
@Requirements(
    Requires(notEnv = ["test"]),
    Requires(property = "file.reader.json.enabled", value = "true")
)
class JsonFileReader : FileReader {
    override fun read() {
        // read Json file
    }
}
```
